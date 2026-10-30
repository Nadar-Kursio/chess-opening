# ChessLab trainer — new.chesslab.dev

The account-backed course app: every opening the build ships becomes a course of chapters (one per
line), and each chapter runs **Learn → Drill → Test → Quiz**. Beside the path: free practice
against any line the course covers, drill shuffle and "punish the blunder" for the opponent's
authored mistakes. A Traps hub collects the trap openings. **Recall** keeps it all remembered:
spaced repetition across every course the learner has studied.

It reads the same JSON `src/build.py --emit` writes for `web/`, so adding an opening is still
data-only. Nothing about chess is computed here: legality is the packed `legal` strings (lines and,
since the trainer, branch positions too), scores are the shipped evals.

## Pieces

| | |
| --- | --- |
| Course model | `src/lib/course.ts` — chapters, steps, quiz questions, the free-practice tree. Pure; `npm test` runs it against the real compiled course. |
| Progress | `src/lib/progress.ts` + `db/migrations/`. Step completion is decided server-side from the counts a session reports (`stepPassed`). |
| Sessions | `src/components/session/` — `LineSession` (learn/drill/recall), `QuizSession` (quiz, punish, review), `FreeSession`. |
| Recall | `src/lib/memory.ts` (FSRS scheduling, grades from behaviour), `src/lib/recall.ts` (cards and the runs that ask them), `src/lib/cards.ts` (the deck in `review_cards`), `RecallSession`. See below. |
| Narration | `src/lib/speech.ts` turns course prose into what the coach says in Learn ("2.Bf4" → "bishop f4"); `scripts/narrate.ts` records it with Amazon Polly; `useNarration` plays it. See below. |
| Auth | Better Auth, email + password, open sign-up. Every page requires an account (`src/proxy.ts`, then `requirePageUser`). |

## Running it

```bash
npm ci
npm run content           # build.py --emit, copied into trainer/content/
npm run db:up && npm run env:dev && npm run db:migrate
npm run dev               # http://localhost:3021
npm test                  # course model against trainer/content (or CONTENT_DIR)
```

## Production

|          | |
| -------- | --- |
| URL      | https://new.chesslab.dev |
| Server   | `next start` on :3020, systemd user unit `chesslab-trainer` (`deploy/systemd/`) |
| Database | `chesslab` on the shared Kursio RDS instance, role `chesslab`, over TLS |
| Settings | `.env.production.local` from `npm run env:prod` (Secrets Manager `chesslab/db-credentials`, `chesslab/app-secrets`) |
| Network  | Worker `chesslab-trainer-edge` (`deploy/edge/`) on the custom domain → tunnel `chesslab` (`deploy/cloudflared/`, unit `chesslab-tunnel`) → :3020 |

The Worker exists because the tunnel's origin certificate covers `kursio.dev` only, so
`new.chesslab.dev` can't be a CNAME to the tunnel without a new `cloudflared tunnel login`. The
tunnel serves `chesslab-origin.kursio.dev`; the app 404s any request there without the Worker's
`x-chesslab-edge` secret.

## Recall

A card is a position where the learner has a move to find. Learn adds a chapter's cards to the
deck; every graded session after that — drill, test, quiz, punish, Recall itself — reschedules the
positions it asked with FSRS (`ts-fsrs`, 90% target retention, whole days). The learner never
grades themselves: found first time is Good, found after more than 15 s is Hard, missed or revealed
is Again, and a miss is due again the next day. Only the first graded attempt of a learner's day
moves a card, so repeating a line the same afternoon is practice, not evidence.

A round asks up to 20 due cards, most likely forgotten first. Due cards on one line share a
**run**: the board replays the line from a few moves before the first of them and stops at each,
so a move is recalled where it's met over the board. Runs from different courses alternate. A miss
shows the move, makes the learner play it and asks it again two runs later, until it's found. A
card counts as long-term memory once its stability reaches 21 days.

Lines learned before Recall existed get their cards on the learner's next visit (`syncDeck`),
seeded from `position_misses`. Every graded attempt is kept in `review_log`, so FSRS's parameters
can be fitted to these learners later.

## Narration

Learn is read aloud by a recorded coach, in the voice and speed the learner picks in Settings.
`npm run narrate` records every clip that isn't on disk yet for the openings listed in
`scripts/narrate.ts` (`NARRATED`), in all three voices, with Polly's neural engine through the
machine's AWS credentials. Clips are named by a hash of voice and the words spoken (not the
punctuation), so a run after a content edit records only the sentences whose words changed, and the server offers a session only the clips that
exist — an unrecorded line plays silent. Spending is capped: `narration/ledger.json` keeps the
running total and a run that would pass `NARRATION_BUDGET_USD` (default $5) records nothing.
`--dry-run` prints the count and the cost. Clips live in `narration/` (or `NARRATION_DIR`), are
generated and never committed, and are served by `/api/narration/[voice]/[clip]` to signed-in
learners. The deploy runs `narrate` after compiling the course.

Deploy with `npm run deploy:prod` from the main checkout's `trainer/` (run `npm run db:migrate:prod`
first when a migration is pending): it recompiles the course, builds into a staging folder and
swaps it in, rolling back if the server doesn't answer.

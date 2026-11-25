# ChessLab trainer — chesslab.dev

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
| Saving | `src/lib/outbox.ts` writes every result to the browser first, posts it to `/api/saves` (three tries) and keeps what fails until `OutboxSync` gets it through. The server ignores a repeat of the same id. |
| Sessions | `src/components/session/` — `LineSession` (learn/drill/recall), `QuizSession` (quiz, punish, review), `FreeSession`. |
| Recall | `src/lib/memory.ts` (FSRS scheduling, grades from behaviour), `src/lib/recall.ts` (cards and the runs that ask them), `src/lib/cards.ts` (the deck in `review_cards`), `RecallSession`. See below. |
| Looking back | `components/session/SessionBoard.tsx` is the board every session draws, plus the arrow keys, the buttons under it and the clickable move list. A session passes only the positions already reached, so stepping forward can't show the move it's about to ask for. |
| Sparring | `/play/spar`: the course against a club opponent that draws each move from `club/<id>.json` (`club-moves.py` in the `opening-research` skill), so common lines come up most and a move the course doesn't answer ends the game: "End of your prep", with the engine's reply drawn as an arrow and labelled as the engine's, not the course's (`answers` in the same file, from `exits.py`). `src/lib/spar.ts` makes the choices, `SparSession` plays them, fetching the book from `/api/spar/[id]` after the page loads (`forBrowser` keeps only what the game reads, `src/lib/pack.ts` writes each board once) and each position's wrong-move verdicts from `/api/spar/[id]/verdicts` as the learner reaches it; three lives, a book-depth score, personal bests in `spar_bests`. A course gets it by having the file. |
| Repertoire | `/repertoire/[id]`: the course's tree from one chair (`src/lib/repertoire.ts`, built on Recall's paths, fetched from `/api/repertoire/[id]` and packed like the sparring book), each move with the learner's memory below it, its club share and score, and the lesson that teaches it; a map of every learner position by move number. Club shares come from `content/club/<id>.json` when the scripts made one (`positions`, by position key or FEN, replies counted by SAN), else from the course's sideline rows. |
| Stats | `/stats`: practice per day, accuracy, the year, the deck by stability, retention and the ten weakest positions (`src/lib/stats.ts` is the pure part, `statsData.ts` the aggregates). "Practise these" runs them as a Recall round at `/stats/practice`. |
| Engine view | Every course gets the eval bar and move marks, because every ply ships a score (`src/content/evals/`): live in Learn and Watch, held at the learner's last move in Drill, Free, Guess and sparring, hidden in Test, Quiz and Recall until the move is answered. A course with `coaching/<id>.json` also gets a verdict on every wrong move and the "When they leave the line" section. Nothing is searched at runtime: `src/lib/engineView.ts` only presents what the scripts in the `opening-research` skill generated. A sideline is a `Line` with a `start`, so sessions, saves and Recall treat it like a chapter, with Learn and Drill only. |
| Your games | `src/lib/games.ts` walks a learner's imported Lichess and Chess.com games down the same tree free practice uses and finds where each left the course (pure, `tests/games.test.ts`). `gameSources.ts` reads the sites' responses, `gameImport.ts` fetches them (server only, one request at a time per site, one import per site every 10 minutes) and `gamePositions.ts` replays the moves with `chess.js` on the server so another move order into the course still counts. A move the learner had learned and missed in a game is due in Recall straight away (`bringForward`). Pages: `/games`, `/games/<site>/<id>`, `/games/practice`. |
| Real play | `src/lib/gameTraps.ts` reads each trap course's bait off its own lines (the victim's first move the course marks a mistake where it also offers a sound one) and finds it in a game by position: sprung, sprung on you, or dodged. Imported games are checked on every read; a sparring game sends its path with the save and `playRecord.ts` checks it against the course and club moves before storing what it met in `spar_traps` (`010_play.sql`). The same record pays XP for imported games (`gameXp` in `xp.ts`). The album is `/traps/collection`. |
| Crowns | `src/lib/crowns.ts`: each chapter's 0-5 crown from its Recall cards (learned, every move answered, every move familiar, half then all in long-term memory), one level lost for overdue cards and one more per week. Shown on the course page. |
| Narration | `src/lib/speech.ts` turns course prose into what the coach says in Learn ("2.Bf4" → "bishop f4"); `scripts/narrate.ts` records it with Amazon Polly; `useNarration` plays it. See below. |
| XP, badges, quests | `src/lib/xp.ts`, `achievements.ts`, `quests.ts` are the pure rules; `src/lib/fun.ts` reads them from the progress tables on every view. Stored (`008_fun.sql`) is only what can't be recomputed: when each badge tier and daily quest was earned, Rush scores, and the last level shown. `FunNews` asks for anything new on each page and after each save, and the server hands each item out once. |
| Opening Rush | `/play/rush`: `src/lib/rush.ts` picks positions from learned chapters (every chapter if none), `RushSession` plays them against the clock and saves a `rush` session per course, so the streak and goal count it. Not graded into Recall. |
| Auth | Better Auth, email + password, open sign-up. Every page requires an account (`src/proxy.ts`, then `requirePageUser`). |

## Running it

```bash
npm ci
npm run content           # build.py --emit, copied into trainer/content/
npm run db:up && npm run env:dev && npm run db:migrate
npm run dev               # http://localhost:3021
npm test                  # course model against trainer/content (or CONTENT_DIR)
```

## Piece images

The pieces are the SVGs in `public/pieces/`. At one device pixel per CSS pixel the browser's
antialiasing leaves their heavy outlines stair-stepped, so below 2x `Board` and `MiniBoard` draw
PNGs from `public/pieces/<size>/` instead, at a size 10-33% larger than the piece is drawn: the
browser's slight shrink is what smooths the edges (`src/lib/pieces.ts`, `usePieceRaster`). From 2x
up they keep the SVG. The PNGs are committed; after changing a piece SVG or `PIECE_SIZES`, run
`npm run pieces` (sharp, 8x supersampled) and commit what it writes. The small piece icons outside
boards (logo, coach, side pawns) stay SVG.

## Production

|          | |
| -------- | --- |
| URL      | https://chesslab.dev (new.chesslab.dev, its first address, redirects there) |
| Server   | `next start` on :3020, systemd user unit `chesslab-trainer` (`deploy/systemd/`) |
| Database | `chesslab` on the shared Kursio RDS instance, role `chesslab`, over TLS |
| Settings | `.env.production.local` from `npm run env:prod` (Secrets Manager `chesslab/db-credentials`, `chesslab/app-secrets`) |
| Network  | Worker `chesslab-trainer-edge` (`deploy/edge/`) on a `chesslab.dev/*` route (and the new.chesslab.dev custom domain, which redirects) → tunnel `chesslab` (`deploy/cloudflared/`, unit `chesslab-tunnel`) → :3020 |

The Worker exists because the tunnel's origin certificate covers `kursio.dev` only, so
`chesslab.dev` can't be a CNAME to the tunnel without a new `cloudflared tunnel login`. The
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
`npm run narrate` records every clip that isn't on disk yet for the courses in `NARRATED`
(`src/lib/speech.ts`), each in the voices it lists (less any line in `SKIPPED`): the first four in
all three, a new course in Brian's alone, with Polly's
neural engine through the machine's AWS credentials. Clips are named by a hash of voice and the words spoken (not the
punctuation), so a run after a content edit records only the sentences whose words changed, and the server offers a session only the clips that
exist — an unrecorded line plays silent. Spending is capped per course: `narration/ledger.json` keeps the running total and each
course's spend (the first four courses spent theirs together, before the split, and share one
budget), and a course whose clips would pass `NARRATION_BUDGET_USD` (default $5) records nothing
while the others go on. `--dry-run` prints the clips and the cost course by course, `--course <id>`
limits a run to one. When a learner's voice hasn't read a course, Learn plays Brian's (then any
recorded voice), and Settings names the courses only Brian reads. Clips live in `narration/` (or `NARRATION_DIR`), are
generated and never committed, and are served by `/api/narration/[voice]/[clip]` to signed-in
learners. The deploy runs `narrate` after compiling the course.

Deploy with `npm run deploy:prod` from the main checkout's `trainer/` (run `npm run db:migrate:prod`
first when a migration is pending): it recompiles the course, builds into a staging folder and
swaps it in, rolling back if the server doesn't answer.

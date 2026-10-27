# ChessLab trainer — new.chesslab.dev

The account-backed course app: every opening the build ships becomes a course of chapters (one per
line), and each chapter runs **Learn → Drill → Recall → Quiz**. Beside the path: free practice
against any line the course covers, drill shuffle, a review of the positions you miss most, and
"punish the blunder" for the opponent's authored mistakes. A Traps hub collects the trap openings.

It reads the same JSON `src/build.py --emit` writes for `web/`, so adding an opening is still
data-only. Nothing about chess is computed here: legality is the packed `legal` strings (lines and,
since the trainer, branch positions too), scores are the shipped evals.

## Pieces

| | |
| --- | --- |
| Course model | `src/lib/course.ts` — chapters, steps, quiz questions, the free-practice tree. Pure; `npm test` runs it against the real compiled course. |
| Progress | `src/lib/progress.ts` + `db/migrations/`. Step completion is decided server-side from the counts a session reports (`stepPassed`). |
| Sessions | `src/components/session/` — `LineSession` (learn/drill/recall), `QuizSession` (quiz, punish, review), `FreeSession`. |
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

Deploy with `npm run deploy:prod` from the main checkout's `trainer/` (run `npm run db:migrate:prod`
first when a migration is pending): it recompiles the course, builds into a staging folder and
swaps it in, rolling back if the server doesn't answer.

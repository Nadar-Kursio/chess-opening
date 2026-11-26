---
name: new-course
description: Ship a new ChessLab course end to end, the way a coach would teach it — map the opening from the Lichess explorer, choose chapters from what club players really play, author notes, plans, deviations, traps and model games, generate the eval bar, verdicts, sidelines and sparring data in one resumable job, verify every claim against the engine, price the narration. Use when asked to add, build or create a course ("add the <X> course", "make a Caro-Kann course"), or to rebuild an existing one from scratch. For checking or deepening commentary in a course that already exists, use opening-research.
---

# Shipping a new ChessLab course

A course is what a good coach would teach a 1200-2000 player in a few sessions: the
ideas first, then the six to ten roads the opponent really takes, what to do on each,
the traps on both sides, one or two real games, and a plan for when the opponent leaves
the book. It is not every reply to every move. The size budget below is the default;
widening it is a decision for the user, never a way to chase a coverage number.

Every chess fact comes from data, never from memory: what club players choose from the
Lichess explorer, what masters chose and how it went from the masters explorer, every
number on the page from `.engine/stockfish` at depth 20. The opening-research skill
(`.claude/skills/opening-research/SKILL.md`) holds the detail behind each step, and this
checklist links to its sections rather than repeating them.

**Where the time goes**: research is network time with no engine (the dossier, about 20
to 30 minutes the first time); the engine runs once, as one background job, while you
check the app, and only the steps an edit touched run again. The generate log times each
step; put those minutes in the PR, so the next course's estimate is a measurement.

## The size budget

| | Default | Why |
| --- | --- | --- |
| Chapters | 6 to 10, 12-24 plies each | one per road reached in about 5%+ of the course's club games, or one that needs its own plan |
| Deviations | 30 to 60 | named theory, mistakes worth punishing, what a quiz should ask |
| Sidelines | generated, at positions 1%+ of games reach | `generate.py --reach 1`; the rest is the "leaving the book" card |
| Coverage | `coverage.py <id> --reach 1` lists no GAPS | about 85% of club replies in the first 6 moves; 92% cost the Jobava course 280 sidelines |
| Model games | 1 or 2 | real PGN, annotated where a guess teaches something |

## 0. Set up

Commands run from the worktree root. An agent's shell forgets its directory between
commands, so start each with `cd /home/ec2-user/chess-opening/.worktrees/<id> &&`
(`build.py` writes relative to the current directory: from anywhere else it rebuilds
`main`). `<id>` is the module name.

```bash
git -C /home/ec2-user/chess-opening fetch origin
git -C /home/ec2-user/chess-opening worktree add /home/ec2-user/chess-opening/.worktrees/<id> -b feat/<id>-course origin/main
cd /home/ec2-user/chess-opening/.worktrees/<id> && ln -s ../../.venv .venv && ln -s ../../.engine .engine
cd /home/ec2-user/chess-opening/.worktrees/<id> && (ls .engine/stockfish || .claude/skills/opening-research/scripts/setup-engine.sh)
ls ~/.config/lichess-token    # the club explorer needs it: ask the user for a Lichess API token (no scopes) if missing
```

Heavy work shares one box (4 cores): every Stockfish run, `build.py --emit`, `npm ci`
and `next build` goes under `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock
nice -n 10`, 2 threads at most ([Running the engine beside other
work](../opening-research/SKILL.md#running-the-engine-beside-other-work)).
`generate.py` takes the lock itself. Lichess requests are queued box-wide by
`_lichess.py`, so two agents researching at once just take turns.

## 1. Map the opening: the dossier

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/dossier.py <id> --start d4 --system Nc3 Bf4
# a Black course names White's first move and Black's signature moves:
#   dossier.py caro --side black --start e4 --system c6
```

`--start` is played as given; `--system` is the course's signature moves, played in the
learner's first four moves unless the cloud says one costs an inaccuracy there (it then
says so under CHOICES). No engine, no lock: about 20 to 30 minutes the first time (the
Jobava London walked 505 positions on about 1,000 requests), limited by the explorer's
rate (roughly 20 to 30 requests a minute; the client paces itself, and a
`429 ... waiting 60 s` line is that pacing, not a failure), about a second after.
Everything is cached under `.engine/lichess/` for every worktree. It writes
`.engine/dossier/<id>.txt`; read all of it:

- **THE MAP**: every opponent position reached in 1%+ of the course's games, its club
  replies (share, and the learner's score from the club games), and the move the walk
  played for the learner, with why (`system`, `masters`, `cloud`).
- **CHAPTERS**: positions reached in 5%+ of games, each with the `record` to paste (the
  masters explorer, 2200+ over-the-board games) and the best-known master games there.
- **TRAPS**: club replies the cloud rates 1.5 pawns+ in the learner's favour (to set) and
  moves club players on the learner's side choose 10%+ that cost that much (to dodge).
- **CHOICES TO CHECK**: learner moves the walk was unsure of.

The cloud's numbers in the dossier are for choosing. Nothing it says ships: every number
on the page is measured again at depth 20 in step 6.

## 2. Choose the chapters, write the main line

1. **The course's own moves come from masters and the engine**, never from club games:
   the dossier's `masters` moves, `explorer.py` for any position you want to look at
   (`explorer.py "d4 d5 Nc3 Nf6 Bf4 e6"`), and `scan.py` to check a candidate
   ([1. Research](../opening-research/SKILL.md#1-research)). Club games decide which
   replies need an answer. Names come from Wikipedia and Wikibooks
   ([references/sources.md](../opening-research/references/sources.md)).
2. Choose 6 to 10 chapters from CHAPTERS and THE MAP, ordered by how often a game gets
   there. Then write the module with its main line (`id`, `name`, `orientation`,
   `section`, `deep`, `progression`, one line with `name`, `slug` and `moves`; the
   required keys are in `tests/test_content.py`), add the id to `ORDER` in
   `src/content/openings/__init__.py`, and add the other chapters' moves.
3. `coverage.py <id> --reach 1`: every row under GAPS gets an answer, a chapter, an
   authored deviation, or nothing authored (step 5's sidelines answer the rest). With one
   chapter coverage reads 100%; it only means something once chapters part.
4. `overlap.py <id>` (seconds): link both ways with every course that shares positions,
   a branch entry with `see: "<other>#<slug>"` here and the same in the other module (trap
   courses are linked by the build). Each `CONFLICT` is a position where two courses tell
   the learner, from the same chair, to play different moves. `[openings part here]`,
   `[explained]` and `[both fine]` need nothing. `[unexplained]` does, in the course whose
   move is weaker or less usual: play the same move there, or add a branch entry for the
   other course's move whose `why` says why this course plays its own. A conflict inside a
   generated sideline is fixed in the other course, never in the sideline file.
5. Traps: the dossier's candidates and the opening's Wikipedia/Wikibooks traps, then
   `nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/trap-scan.py <id> --lock /home/ec2-user/chess-opening/.worktrees/.heavy.lock`
   (about 10 minutes) once chapters and deviations exist. A `NEW` trap met in 0.05%+ of
   the course's games, or by 300+ club games, is a trap course to write
   ([Trap courses](../opening-research/SKILL.md#trap-courses)). A one-move capture is a
   hanging piece, not a trap: a deviation covers it.

## 3. Author it like a coach

Per [2. Author](../opening-research/SKILL.md#2-author) and [Writing for the
trainer](../opening-research/SKILL.md#writing-for-the-trainer). Done means:

- **the ideas first**: `theory` says what the opening is for, its pawn structures and each
  side's plans, in words a club player can use at the board;
- a `note` on **every learner move** in every chapter (`N moves, 0 without commentary`
  from the build), written for this opening;
- a `plan` card for every chapter, `next` saying what to do on the next move;
- deviations at the real decision points, severity from `verify-branches.py`, an answer
  in `line`; every `blunder` with its refutation in `line`. **Where club players' main
  reply to a deviation is itself a mistake, the `line` follows that reply**, so the
  learner practises the punishment (the club move, not the engine's best);
- **no line ends on the opponent's move**: the learner's next move is taught or the line
  is cut a move earlier;
- one or two model games: pick from the dossier's master games and print them with
  `dossier.py --pgn <game id>` (or `fetch-games.py` for a player's archive); never type a
  game in;
- `record` only from the dossier or `explorer.py`, none for an engine-only line; a `slug`
  on every line; `drill: True`;
- the id in `ORDER`, in `PORTED` in `src/build.py`, and for a repertoire course in
  `FEATURED` in `trainer/src/lib/catalog.ts`; its `section` exists in
  `src/content/sections.py`.

Everything the learner reads follows `tests/prose.json`: no em dashes, no chatbot
phrasing. Run `verify-prose.py <id> --counts` and `verify-notes.py <id>` as you write.

## 4. Verify the claims before generating

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && THREADS=2 flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/verify-branches.py <id>
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/verify-notes.py <id>
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/verify-prose.py <id> --counts
```

[3. Verify](../opening-research/SKILL.md#3-verify) explains each flag. Fix the text, then
re-run. Generating before the lines settle only means generating twice.

## 5. Generate everything, once, in the background

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/generate.py <id> --background
```

It prints a pid and a log, `.engine/generate/<id>.log`, and runs: the dossier on the
course's own moves first, without the engine lock, so every explorer answer the later
steps need is cached before any of them holds the box's engine; then sidelines (the
course's exits from the chapters, grown at positions 1%+ of games reach), the committed
club counts the sparring partner plays from, the eval bar at depth 20, the wrong-move
verdicts, the engine's answer to every club move that leaves the course, and the cloud
cross-check. Engine steps wait for the box lock. Wait in a background command:

```bash
until tail -1 /home/ec2-user/chess-opening/.worktrees/<id>/.engine/generate/<id>.log | grep -qE '^[0-9:]+ (done|failed)'; do sleep 30; done
```

and use the time for step 7's app check of everything that doesn't need the data. After
any content fix, run it again: only the steps whose inputs changed rerun
(`generate.py <id> --status` says which). `kill -- -<pid>` stops it.

Then read `.engine/crosscheck/<id>.txt`. A **CONFIRMED** row is a move where Lichess's
cloud (depth 30+) and a depth-28 search here both put it in a different band from the
shipped depth-20 numbers: whatever the course says about that move (a severity, a mark,
a sentence) needs a look. Fix the content, or say in the PR why it stands. The shipped
numbers stay at one depth either way.

Then `coverage.py <id> --reach 1`: GAPS (0), and the build warns about nothing in this
course.

## 6. Build and test

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 -m unittest discover tests
cd /home/ec2-user/chess-opening/.worktrees/<id> && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock .venv/bin/python3 src/build.py --emit   # read every warning
cd /home/ec2-user/chess-opening/.worktrees/<id>/trainer && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm ci && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm run content && npm test && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npx next build && npx tsc --noEmit -p .
cd /home/ec2-user/chess-opening/.worktrees/<id> && ln -s ../../../web/node_modules web/node_modules && node tests/prose-ui.mjs && (cd web && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm run build && npm test); rm web/node_modules
```

[4. Rebuild](../opening-research/SKILL.md#4-rebuild-and-check-the-site) explains each
build error.

## 7. Narration, then the app

**Narration**: add `<id>: ['brian']` to `NARRATED` in `trainer/src/lib/speech.ts` and
price it: `cd trainer && npm run content && npm run narrate -- --dry-run --course <id>`.
Within **$5 per course** (`NARRATION_BUDGET_USD`); `OVER` means cut words, never raise the
budget without the user. Record only when your brief says so, and never for words that
may still change: every reworded sentence is paid for again.

**The app**, on a QA server, from `trainer/` after step 6's build (`trainer/README.md`):
`npm run env:dev`, then `sed -E 's#localhost:3021#localhost:<port>#g' .env.development.local >
.env.production.local`, **check the database host in it is `localhost:5520`, never
production**, `npm run db:migrate`, then `npx next start -p <port>` in the background. In a
fresh account, at 390x664, 320x568
and 1280x800, in light and dark: every chapter's Learn, Drill, Test and Quiz (eval bar
live in Learn), Punish the blunder, a sideline from "When they leave the line", three or
four sparring games (a book end, an "End of your prep", running out of lives), the Traps
card and each linked trap course, `/repertoire/<id>` from each chair, and Settings naming
the voice.

## 8. Report

`coverage.py <id> --reach 1` and the generate log give the PR its numbers: replies
covered in the first 6 opponent moves and the GAPS count (0); book end from club games
alone (the coverage figure) and as sparring plays it (context); how many games that leave
end on an answered move (aim for 90%+); engine-only chapters; the cross-check's confirmed
rows and what was done with each; the narration price; and the generate log's minutes per
step.

## Upgrading an existing course

The same steps without the authoring from scratch: `dossier.py <id>` (the course's own
moves are walked, so THE MAP shows where club players leave it), `coverage.py`,
`overlap.py` and `trap-scan.py`, the content changes, then `generate.py <id>`, which
reruns only what the edits touched. A course keeps the month of club games its committed
`src/content/club/<id>.json` names; `CLUB_MONTHS=2026-11 generate.py <id> --force` moves
it to a newer one, which changes every generated file. If the course is narrated, run the
dry-run against a scratch copy of the production clip names and ledger, never the production
folder: a changed word in a recorded line is a new clip, charged to that course.

```bash
N=/home/ec2-user/chess-opening/.worktrees/_scratch/<id>/narration; P=/home/ec2-user/chess-opening/trainer/narration
for v in brian amy matthew; do mkdir -p $N/$v && (cd $P/$v && ls) | (cd $N/$v && xargs -r touch); done; cp $P/ledger.json $N/
cd /home/ec2-user/chess-opening/.worktrees/<id>/trainer && NARRATION_DIR=$N npm run narrate -- --dry-run --course <id>
```

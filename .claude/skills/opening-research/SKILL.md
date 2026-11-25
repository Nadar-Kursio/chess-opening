---
name: opening-research
description: Ship a ChessLab course end to end, or research and author coached content for an opening — chapters chosen from club data, variations, deviations with severities, move-by-move notes, plan cards, traps, model games, sidelines, sparring data, eval bar and narration — and verify every claim against a chess engine before it ships. Use when adding a course ("add the <X> course"), upgrading one, deepening an opening in src/content/openings/, or checking that existing opening commentary is actually true.
---

# Researching an opening, and shipping it as a ChessLab course

The build proves every move is **legal**. Nothing in the repo proves a claim is
**true** — "this wins a piece", "this is a blunder", "Karpov played this on move
24" all ship unchallenged. That gap is what this skill closes.

Order matters: **research → author → verify → fix → rebuild**. Verification is not
a final rubber stamp; expect it to send you back to the text two or three times.
On the Ruy Lopez and Four Knights it found four wrong lines in the first draft,
including a "refutation" that hung a piece.

When the job is "add the <X> course", follow the checklist below in order. Every
step links to the section that explains it; the checklist only says what to run
and what "done" looks like.

## Shipping a ChessLab course: the checklist

Budget a long day, most of it waiting on the engine and the Lichess stream: about
**2 hours of streaming, 3 to 5 hours of engine time and the rest authoring and
checking** for a course the size of the London. Start every long run in the
background, with its pid captured, and author while it runs.

Commands run from the worktree root unless they say `trainer/`. An agent's shell
forgets its directory and its variables between commands, so start each one with
`cd /home/ec2-user/chess-opening/.worktrees/<id> &&` (`build.py` writes relative
to the current directory: from anywhere else it rebuilds `main`), and every path
below is written out in full rather than kept in a variable. `<id>` is the module
name (`jobava`). Scratch files go in `/home/ec2-user/chess-opening/.worktrees/_scratch/<id>/`,
which step 0 creates.

### 0. Set up

```bash
git -C /home/ec2-user/chess-opening fetch origin
git -C /home/ec2-user/chess-opening worktree add /home/ec2-user/chess-opening/.worktrees/<id> -b feat/<id>-course origin/main
cd /home/ec2-user/chess-opening/.worktrees/<id> && ln -s ../../.venv .venv && ln -s ../../.engine .engine
mkdir -p /home/ec2-user/chess-opening/.worktrees/_scratch/<id>
cd /home/ec2-user/chess-opening/.worktrees/<id> && (ls .engine/stockfish || .claude/skills/opening-research/scripts/setup-engine.sh)   # four minutes, once
cd /home/ec2-user/chess-opening/.worktrees/<id>/trainer && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm ci   # for steps 7 and 8
```

Rules for the whole job ([Running the engine beside other work](#running-the-engine-beside-other-work)):
**one engine job at a time on the box**, always `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 ...` with
2 threads at most. Lichess streams run `nice -n 19` without the lock, started with
`setsid` so the whole pipeline is one process group: stop one with `kill -- -<pid>`
(the minus sign kills the group: curl, zstd and Python). A plain `kill <pid>` leaves
the stream running, and so does `pkill -f`, which can also hit other agents' runs.

### 1. Club data first: it decides the chapters

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && setsid bash -c 'curl -s https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
  | zstd -dc | nice -n 19 .venv/bin/python3 .claude/skills/opening-research/scripts/club-stats.py \
    <id> --first d4 --must Nc3 --must Bf4 --month "October 2026"' \
  > /home/ec2-user/chess-opening/.worktrees/_scratch/<id>/club-stats.log 2>&1 & echo $!
```

Keep the pid it prints; `kill -- -<pid>` stops the whole stream. Check after a minute
that the log shows `counting games ...` and a first `200000 scanned` line: a
redirect into a missing folder fails silently, and the pid printed is then of a
pipeline that already died. It is done when the log's last line starts `scanned`
(about 20 minutes). An agent's tool call times out long before that, so wait in a
background command, `until grep -q '^scanned' <log>; do sleep 30; done`, and author
meanwhile.

`--first` is the course's first move and each `--must` a move the course's side
plays within its first three moves (any order); a Black course names Black's moves
and adds `--side black` (the Caro-Kann is `--first e4 --must c6 --side black`).
Once the module exists, `--first` and `--side` default to the course's own. It reads
the stream for 20 minutes (`--seconds`), about 12 million games, and keeps the
1200-2000 games in the opening (the London kept 267k, the Queen's Gambit 474k),
counting every reply from every position in the first 20 plies into
`.engine/club/<id>.json` (gitignored). The last line lists the Lichess accounts
with the most games from the course's chair: keep one for step 9.
See [the course-planning tools](#the-course-planning-tools).

### 2. Choose the chapters from that data

1. **The course's own moves come from masters and the engine**, never from club
   games: `explorer.py` and `fetch-games.py` for what strong players chose, `scan.py`
   to check it ([1. Research](#1-research)). Names come from Wikipedia and
   Wikibooks ([references/sources.md](references/sources.md)).
2. Write the module with just its main line (`id`, `name`, `orientation`,
   `section`, and one line with `name`, `slug` and `moves`) and add the id to
   `ORDER` in `src/content/openings/__init__.py`, so the tools have something to
   measure. Then:

   ```bash
   cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/coverage.py <id> --moves 8
   ```

3. **Every row under GAPS needs an answer.** A gap is a reply chosen by 5%+ of club
   players (25+ games) at a position 0.25%+ of the course's club games reach, in the
   opponent's first 6 moves (`--moves 8` while designing shows what is coming).
   Decide each one:
   - **a chapter** when it is a main road: reached in about 5%+ of all the course's
     club games (`share` × `position reached`), or it needs its own plan. A chapter is
     12-24 plies; anything longer goes in `deep`.
   - **an authored deviation** (`branches`) when it is named theory, a mistake worth
     punishing, or something a quiz should ask: severity from the engine, an
     answer in `line` ([2. Author](#2-author)).
   - **nothing authored** for the rest: `sidelines.py` (step 6) answers every
     remaining gap with the engine and the course's own setup.
4. Re-run `coverage.py` after each new chapter or branch set: a new chapter opens
   new decision points.

### 3. Overlap with the other courses

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/overlap.py <id>
```

Seconds, no engine. Every course sharing positions with this one is listed, with
`see` links each way. **Link both ways**: a branch entry with `see: "<other>#<slug>"`
where this course's road meets the other course's chapter, and the same in the
other module. Trap courses are linked by the build, by position, and need no `see`.

Every `CONFLICT` is a position where two courses tell the learner, from the same
chair, to play different moves. How to read and resolve them:

- `[openings part here]` (the first two moves) and `[explained]` need nothing.
- `[both fine]`: the shipped evals rate both moves within an inaccuracy. Two sound
  choices; nothing to do, and the usual case inside a generated sideline, which you
  never edit by hand.
- `[unexplained]` is what to fix, in the course whose move is the weaker or the less
  usual one (check both with `scan.py`). Either play the same move there, or add a
  branch entry at that position for the other course's move, `severity` from
  `verify-branches.py`, whose `why` says what it does and why this course plays its
  own move instead ("playable, and the engine likes it too: ...; the course plays X
  because ..."). Re-run `position-evals.py` for that course afterwards. The
  conflict then reads `[explained]`.
- If the move you'd change sits in a generated sideline, change the other course or
  explain it there: a re-run of `sidelines.py` would undo an edit to the file.

### 4. Traps

1. **Known traps from the sources**: the opening's Wikipedia article and its
   Wikibooks pages name them with exact moves.
2. **Real traps from the games**, once the chapters and branches exist (engine,
   under the lock; 10 min for the London, 6 for the Queen's Gambit):

   ```bash
   cd /home/ec2-user/chess-opening/.worktrees/<id> && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/trap-scan.py <id>
   ```

   Each candidate is a common club move that costs its player 2+ pawns at depth 20,
   with the line that punishes it. `trap course X` means an existing trap course
   reaches the position after it and the build links it; `NEW` means none does.
   After that, what the course does there: a trap to set should read `the course
   punishes it with ...` (anything else: add the punishing move as a deviation or
   sideline answer); a trap to dodge should read `the course plays ... instead`
   (`THE COURSE PLAYS IT` is a bug in the course). **A `NEW` candidate met in
   0.05%+ of the course's games, or with 300+ games behind it, is a trap course to
   write** ([Trap courses](#trap-courses)): `section: "traps"`, taught from the chair
   that springs it, plus a line from the victim's chair with the safe move. Skip a
   candidate whose punishing line is a one-move capture (2.Bf4?? exf4 drops a piece
   to a pawn): that is a hanging piece, not a trap, and a deviation covers it. A known
   trap from step 1 that never shows up in the scan is rare at club level: give it a
   deviation, not a course.
3. Every new trap course goes through steps 5 to 7 like any course (it needs its
   evals; trap courses have no club data or sidelines).

### 5. Author

Per [2. Author](#2-author), [Writing for the trainer](#writing-for-the-trainer) and
[Trap courses](#trap-courses). Done means all of this is true:

- a `note` for **every learner move** in every chapter (`N moves, M without
  commentary` from the build ends in 0), written for this opening, not inherited
  from `common.py` text about another one;
- a `plan` card for every chapter, `next` saying what to do on the next move;
- opponent deviations at the real decision points, each with a severity from
  `verify-branches.py` and an answer in `line` (that is what Quiz asks), and every
  `blunder` with its refutation in `line` (that is "Punish the blunder");
- one or two model games from real PGN (`fetch-games.py`), annotated where a guess
  teaches something;
- a `slug` on every line, a `record` only from `explorer.py` (none for an
  engine-only line), `drill: True`;
- the id added to `ORDER` in `src/content/openings/__init__.py`, to `PORTED` in
  `src/build.py`, and, for a repertoire course, to `FEATURED` in
  `trainer/src/lib/catalog.ts` (its home page column, "As White" or "As Black",
  follows `orientation`); its `section` exists in `src/content/sections.py`.

### 6. Generate the data, in this order

Each file is generated and committed; never edit one. Times are for the London at
2 threads with the shared caches warm; a course with nothing in the caches yet
takes about twice as long. A trap course has no club data: it needs only **c**.

| # | Command | Writes | Time |
| --- | --- | --- | --- |
| a | `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/sidelines.py <id> --threads 2` | `src/content/sidelines/<id>.json` | 20-25 min the first time, 2-5 min a round after |
| b | Lichess stream into `club-moves.py` (below), no lock | `src/content/club/<id>.json` | 23 min (15M games, one core) |
| c | `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/position-evals.py <id> --threads 2` | `src/content/evals/<id>.json` | about 1 s a new position: 25 min for the London's 900 new ones, 4 min after a small edit |
| d | `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/move-verdicts.py <id> --workers 2` | `src/content/verdicts/<id>.json` | about 12 s a new learner position: 2 h for the London's 628 new ones |
| e | `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/exits.py <id> --games 3 --threads 2` | `src/content/exits/<id>.json` | 2-3 s an exit: 15 min for the Queen's Gambit's 394 at the default `--games 10`, about 100 min for the London's 1,900 at `--games 3` cold, 20 min re-run |

```bash
# b: no lock, nice 19, one core, in the background like step 1; name only the courses whose positions changed
cd /home/ec2-user/chess-opening/.worktrees/<id> && setsid bash -c 'curl -s https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
  | zstd -dc | nice -n 19 .venv/bin/python3 .claude/skills/opening-research/scripts/club-moves.py \
    <id> --games 15000000 --month "October 2026"' \
  > /home/ec2-user/chess-opening/.worktrees/_scratch/<id>/club-moves.log 2>&1 & echo $!
# done when the log's last line starts "scanned" (about 23 minutes); wait in a background command:
until grep -q '^scanned' /home/ec2-user/chess-opening/.worktrees/_scratch/<id>/club-moves.log; do sleep 30; done
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/coverage.py <id>    # then: GAPS (0)?
```

- **a and b go round until `coverage.py` prints `GAPS ... (0)` and the build no
  longer warns `positions the opponent moves in have no club counts`.** `sidelines.py`
  judges every club reply that leaves a chapter, then grows past the exits: every
  gap becomes a sideline answered by the engine, round after round inside one run.
  But it can only see replies the club counts have, and `club-stats.py` kept only
  games where the course's side played its `--must` moves, so a sideline where the
  learner answers differently (1.d4 e5 2.dxe5 in the London) is thin there.
  `club-moves.py` then counts every game reaching the new sidelines, which shows the
  next layer of replies, and a sideline's expected moves can change with the new
  counts. Each London regeneration has taken two to four rounds (once 376, then 39, 6
  and 1 opponent positions still without club counts; the last time 40, then 0,
  ending on 269 sidelines). Each round after
  the first costs a few minutes of engine time and one stream. If a gap survives, it needs a
  chapter or a deviation (step 2).
- **What a sideline teaches the opponent to play is what club players play.** Its
  learner moves are the engine's best. At each opponent move with 20+ club games it
  expects the top club move whenever a quarter of players choose it, whatever it
  costs them (a common mistake is the thing to teach: the learner's next move is the
  engine's best, which punishes it; `CLUB_COMMON`). Otherwise it expects the most
  common of the three most played moves that the engine rates within an inaccuracy
  (50cp, the move marks' band; `CLUB_SLACK`) of its best, and the engine's move only
  when none holds up. A lesson that expects 5...Qa5 where 36% of club players grab
  b2 teaches the learner to prepare for a game they won't get. Authored branch lines
  are kept as written. (The engine card on the sparring end screen is different on
  purpose: its line is Stockfish's own, labelled as the engine's.)
- **c** after the last **a**, because sidelines add positions; re-run it after any
  edit to a line, deviation, game or sideline, or the bar loses the plies you moved.
- **d** after **c** (it scores the learner's positions the sidelines add).
- **e** after the last round of **a** and **b** (it reads both): it answers the club moves that leave the course,
  which is what the sparring end screen shows. `coverage.py`'s book-end line then
  says how many of the games that leave end on an answered move; aim for 90%+. The
  default `--games 10` answers moves with 10+ club games; a course whose sidelines
  run deep meets thinner positions, so start with `--games 3` as the table does
  (the London: 66% at 10, 90% at 3). The build warns when a club move leaving the
  course has no answer, and `tests/test_content.py` fails: re-run `exits.py`.

### 7. Verify

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && THREADS=2 flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/verify-branches.py <id>  # 15-20 min
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/verify-notes.py <id>
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/verify-prose.py <id> --counts
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 -m unittest discover tests        # content, emit contract, prose
cd /home/ec2-user/chess-opening/.worktrees/<id> && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock .venv/bin/python3 src/build.py --emit   # read every warning, not just the exit code
cd /home/ec2-user/chess-opening/.worktrees/<id> && (cd trainer && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm run content && npm test && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npx next build && npx tsc --noEmit -p .)
cd /home/ec2-user/chess-opening/.worktrees/<id> && ln -s ../../../web/node_modules web/node_modules && node tests/prose-ui.mjs && (cd web && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm run build && npm test); rm web/node_modules  # UI strings, then the static site CI ships: export and jsdom smoke
```

The build must not warn about your course: no plies without commentary, no
positions missing from the evals, no sideline or club file out of date with the
lines. `npm test` in `trainer/` loads every course with its club, exits and
coaching files, so a broken generated file fails there.

[3. Verify](#3-verify) explains each flag and [4. Rebuild](#4-rebuild-and-check-the-site)
each build error. Re-run the step 6 generators after every content fix they force.

### 8. Narration: price it, never past the course's budget

A new course is recorded once, in Brian's voice, within **$5 per course**
(`NARRATION_BUDGET_USD`). Add `<id>: ['brian']` to `NARRATED` in
`trainer/src/lib/speech.ts`, then price it:

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id>/trainer && flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock npm run content && npm run narrate -- --dry-run --course <id>
```

A worktree has no recordings, which is exactly a new course's position. For a
course already narrated, price it against a scratch copy of the production clip
names (empty files) and ledger, never the production folder itself:

```bash
N=/home/ec2-user/chess-opening/.worktrees/_scratch/<id>/narration; P=/home/ec2-user/chess-opening/trainer/narration
for v in brian amy matthew; do mkdir -p $N/$v && (cd $P/$v && ls) | (cd $N/$v && xargs -r touch); done; cp $P/ledger.json $N/
cd /home/ec2-user/chess-opening/.worktrees/<id>/trainer && NARRATION_DIR=$N npm run narrate -- --dry-run --course <id>
```

It prints the clips, characters and cost for the course and its spend so far, and
`OVER` when it would cross the budget: then cut the text (shorter notes, fewer
words in names and plans) until it fits, and never raise the budget without the
user's say-so. In one voice the London's four chapters are 75 clips and $0.30, the Queen's Gambit's eight 156 clips and $0.43: a course fits its budget many times over unless it is huge. The real
recording is `npm run narrate -- --course <id>` against the production clip folder;
only run it if your brief says to (otherwise the deploy does it), and never again
for words you can still change: **every reworded sentence is paid for again**.

### 9. Check it in the real app

On your QA server, then on https://beta.chesslab.dev once the PM has your branch
there, in a fresh account, at 390x664, 320x568 and 1280x800, light and dark. The QA
server, from `trainer/` after step 7's build (`trainer/README.md` has the details):
`npm run env:dev`, then `sed -E 's#localhost:3021#localhost:<port>#g'
.env.development.local > .env.production.local`, check the database host in it is
`localhost:5520` (never production), `npm run db:migrate`, then `npx next start -p
<port>` in the background. Stop it by the pid `ss -ltnp | grep :<port>` shows.

- every chapter's Learn, Drill, Test and Quiz (eval bar live in Learn, held at your
  last move in Drill, hidden in Test and Quiz until answered), and Punish the blunder;
- a sideline's Learn from "When they leave the line";
- three or four sparring games from `/play/spar`: a book end, an "End of your prep"
  with the engine's arrow, and running out of lives;
- the Traps card on the course page, and each linked trap course;
- `/games`: import the account from step 1's player list and open a game that
  follows the course;
- `/repertoire/<id>` from each chair the course teaches;
- Settings: the voice picker names the course as read by Brian only.

### 10. Report the metrics

```bash
cd /home/ec2-user/chess-opening/.worktrees/<id> && .venv/bin/python3 .claude/skills/opening-research/scripts/coverage.py <id>
```

Put these in the PR, from that output and step 8:

- **replies covered**, first 6 opponent moves (the London: 88.3%, up from
  72.5% before it grew past its exits), and the GAPS count (must be 0);
- **book end, club games alone**: how often a club-weighted game reaches the end of
  the course instead of leaving it, sampling every position that has any club games
  (the London: 6.2%, up from 0.5%). This is the coverage figure. Report
  it, not the next one;
- **book end as sparring plays it**, as context: the same with the trainer's rule
  that under 20 club games the opponent follows the course and can't leave
  (the London: 29.1%, up from 2.4%). The gap between the two is games that ran into
  thin positions, not coverage: a course grown deep into thin territory looks
  better here than it is. Also how many of the games that leave end on a move with
  the engine's answer (aim for 90%+);
- **engine-only chapters**: those with no master `record`;
- **narration**: the dry-run price, and the spend after recording.

## Upgrading an existing course

The same tools, without the authoring from scratch:

1. `club-stats.py <id>` (step 1; the course's first move and side are its own),
   unless `.engine/club/<id>.json` is recent.
2. `coverage.py <id>`, `overlap.py <id>`, `trap-scan.py <id>`: the gaps, conflicts
   and traps to deal with. Fix conflicts and add deviations or chapters where a gap
   deserves more than a generated sideline (steps 2 to 4).
3. Step 6, a to e, then step 7. If the course is narrated, run step 8's dry-run: a
   changed word in a recorded line is a new clip, charged to that course.
4. Step 10's numbers before and after, in the PR.

## The course-planning tools

Four scripts read the course module, the generated files and the club counts and
answer the questions the checklist asks. All four walk the course the way the
trainer's sparring partner does (`scripts/_course.py`, mirroring `buildTree` in
`trainer/src/lib/course.ts`): the chapters from the course's chair, the answers to
the opponent's authored deviations, and the generated sidelines, matched by
position so transpositions meet. Where club games at a position are fewer than 20,
they follow the course instead, as the sparring partner does.

**Club counts.** `club-stats.py` (`.engine/club/<id>.json`, every position in the
opening's first 20 plies, from games where the course's side plays its `--must`
moves) and `club-moves.py` (`src/content/club/<id>.json`, committed, every game that
reaches a position the course teaches) count the same month. The planning tools
take whichever has more games at each position; the sparring tools (`coverage.py`'s
book end, `exits.py`) read only the committed file, exactly what the trainer has.

- **`coverage.py <id>`** (seconds). `GAPS`: every reply with no answer, chosen by
  `--share` 5%+ of club players (`--games` 25+) at a position `--reach` 0.25%+ of
  the course's club games get to, in the opponent's first `--moves` 6 moves. The
  moves every chapter shares are played, not sampled (1...Nf6 is not a gap in the
  Queen's Gambit, it is another opening). Then `replies covered` (club replies in
  those moves that land in the course, weighted by how often a game gets there),
  where club games are after those moves, the **sparring book end** rate (a game
  played to the end, the sparring partner's way: how often it reaches the end of
  the course instead of leaving it), the engine-only chapters, and the most common
  sparring exits. `--json <file>` keeps the whole report.
- **`overlap.py <id>`** (seconds). Positions shared with each other course, the
  deepest, `see` links each way, and each `CONFLICT`: same position, same chair,
  different move. `[unexplained]` is what to fix; `[openings part here]` (first
  two moves) and `[explained]` (a branch entry names the other move) are fine.
- **`trap-scan.py <id>`** (engine). Every position club games reach in the first
  `--moves` 8 moves while the learner plays the course, and one reply past it, with
  `--min-games` 200+ games: each move chosen by `--share` 3%+ (or `--games` 300+) is
  scored at depth 16 and, if it costs its player `--drop` 200cp+ and leaves them
  `--lost` 150cp+ behind, again at 20. Candidates are `to set` (the opponent's
  mistake, the learner punishes it) or `to dodge` (club players on the learner's
  side make it), each with the punishing line, marked `trap course X` or `NEW`, and
  with what the course plays there. Then the trap courses the course reaches and
  how deep (the build links those at 5 plies or more).
- **`exits.py <id> [<id> ...]`** (engine). For each club move with 10+ games
  (`--games`) that leaves the course, Stockfish's reply and a short line ending on
  the learner's move, at depth 20, into `src/content/exits/<id>.json`. The build adds
  them to the emitted `club/<id>.json` as `answers`; sparring shows the one it needs
  on "End of your prep", with a dashed purple arrow, labelled as the engine's
  choice and not the course's.

`sidelines.py`, `exits.py` and `trap-scan.py` share `.engine/sideline-cache.json`
(same depth, keyed by position), so a position one of them searched costs the
others nothing.

## 1. Research

Two sources carry the load. Neither is optional.

**Wikibooks Chess Opening Theory** — one page per position, listing every reply
with a name and a short assessment. This is the best source for deviations,
because deviations *are* "every legal reply to this position". URLs are the move
path:

```
https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Bb5
                                                    .../3._Bb5/3...a6/4._Ba4
```

**Wikipedia's opening article** — best for variation names, ECO codes and the
named traps. Ask for one thing at a time; a request for "every variation with ECO
codes and moves" comes back truncated and vague. Dedicated trap articles
(`Noah's_Ark_Trap`, `Ruy_Lopez,_Tarrasch_Trap`) are short and quote exact moves.

See `references/sources.md` for the prompt wording that worked, the wording that
failed, and what each source is and is not good for.

**Game scores never come from prose.** Fetch real PGN and filter it:

```bash
.claude/skills/opening-research/scripts/fetch-games.py Karpov --eco C98 --opponent Unzicker
```

A move list retyped from a video description or an article summary will be legal
and wrong, and the build will accept it.

**What players actually play from a position is a count, not an opinion.**
`explorer.py` replays pgnmentor's per-variation archives and reports, for each
position you name, how many master games reached it, how they finished, and the
replies in order of popularity:

```bash
.claude/skills/opening-research/scripts/explorer.py --fetch RuyLopezMarshall,RuyLopezOpen \
    "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5"
.claude/skills/opening-research/scripts/explorer.py --file positions.txt --top 8
```

Use it *before* writing a line, to pick the main line from what was played rather
than from what you remember, and again for each branch, so a `line` continuation
is a move real players chose. It matches by position rather than by move order, so
transpositions are counted; one pass answers every position in the file, which is
why the file form is the one to use. Archive names are the zip files under
"Openings" on <https://www.pgnmentor.com/files.html>; the whole Ruy Lopez is
fifteen of them and about 190k games, which takes three or four minutes to scan.

It also prints the `record` line a variation ships (see below), which is the only
way that key should ever be filled in.

**What club players play is a different count.** The archives above are masters.
`club-stats.py` streams a Lichess monthly database and counts replies by position
between 1200 and 2000 rated players. `sidelines.py` then asks the engine, for each
reply, whether the chapter's next move still holds up, and sorts it into keep your
setup, needs an answer, trap to dodge or trap to set, and then grows the course past
every remaining gap. `move-verdicts.py` scores every legal move from every asked
position, so a wrong move gets a real answer. `club-moves.py` counts, in one pass of
the stream for several openings at once, every club move from every position a
course's opponent moves in (chapters, deviations and sidelines), into
`src/content/club/<id>.json`; the trainer's sparring partner plays from it, and
`exits.py` answers the moves in it that leave the course. All of them need a re-run
after editing a covered opening, in the order of checklist step 6. Run the streaming
scripts with `nice -n 19` and cap them (`--seconds`, `--games`); the file records
the sample size. **Club games choose which replies the course answers, never the
course's own moves**: those come from masters and the engine.

**The corpus has holes, and the honest answer is to say so.** pgnmentor's
per-variation archives follow the ECO split, not your repertoire: there is no
archive with 1.d4 d5 2.Bf4 games, and the four Scandinavian archives hold only
3.Nc3 lines, so 3.Nf3, 3.d4 and the move-2 sidelines return zero games. When
`explorer.py` comes back empty, choose the moves from player archives
(`fetch-games.py`) plus the engine, leave `record` off rather than inventing
one, and say in your report that the line is engine-checked only. Named trap
positions are almost never reached in master play either; trap lines ship
without a `record` as a rule.

Pass `--fetch` the archives you need rather than scanning everything under
`.engine/openings/`: after the Sicilian landed it holds about a million games,
and an unqualified run takes long enough to look hung.

## 2. Author

Copy the shape of `src/content/openings/italian.py` for a White repertoire and
`src/content/openings/french.py` for a Black one — both carry the full set, and
the second one shows what the inversion below actually looks like on the page.
`README.md` ("The optional keys") is the reference for what each key does.

- **Write like a coach, not a chatbot.** No em dashes, no "the honest
  evaluation", no "it is worth noting", no "not just X but Y", nothing from the
  word list in `tests/prose.json`. `tests/test_prose.py` fails on any of them in
  shipped text. Fix the sentence rather than the symbol: a full stop where the
  dash joined two thoughts, a colon where it introduced an explanation,
  parentheses for an aside. Swapping every dash for a comma is its own tell.
- **`branches`** are keyed by the SAN prefix that reaches a position, so one set
  fires in every line of that opening passing through it. Author at the positions
  where a real opponent actually deviates: move 3 and 4 alternatives, your own
  branch points, and any position where a natural move loses something.

  **A set only attaches to a position one of your lines actually reaches** — the
  build stops with `branches authored for a position no line reaches` otherwise.
  That is a planning rule, not just an error: pick your lines partly for the
  branch positions they make reachable. It is what decides how much of an opening
  you can cover, and it is why the Sicilian here has seven lines rather than three.

  And an entry whose `san` is the move the line itself plays never renders — the
  panel drops it, correctly, because it is not a deviation from that line. Harmless
  when several lines share the position; invisible dead weight when only one does.
  The build now warns.

- **A Black repertoire inverts the job.** `orientation: "black"` means the reader
  answers White's choices, so the branch sets sit at the plies where *White* moves,
  and `playable` will dominate — White picking a good system is not a mistake, and
  most entries should explain what changes rather than hunt for a punishment.
  Severity is always measured against whoever played the move, so `blunder` on a
  White move means White lost something and the `line` must show Black taking it.
  The scripts handle the sign already; the framing is yours.
- **Severity is a promise to the learner.** `blunder` means there is a refutation
  and it is in the `line`. `inaccuracy` means it costs something specific. Most
  deviations are `playable` — say so, and explain what changes rather than
  hunting for a punishment that is not there.
- **`plan`** is the only thing that registers an opening on a structure card. The
  build derives each card's "reached by" list from plan pointers alone, so a branch
  with `see: "structure#id"` links *to* the card and does not appear *on* it. That
  is the deciding fact when you are asking whether a new card earns its place: if
  no line's plan ends in the structure, the card ships as reference material and
  the build says so on every rebuild.
- **`plan`** ends the line. Name the structure if a card in `structures.py` fits;
  add a new structure only when two or more lines reach it, and be honest in
  `taxonomy` about whether the literature actually names it. Read the card's own
  plans against your `plan.next` before you point at it — nothing checks that they
  agree, and one card spent a while telling White never to recapture on c3 while
  the line pointing at it opened with "Nxc3 first, this is the move". If nothing fits,
  **leave `structure` out** — three plans in `fourknights.py` do. Forcing a
  near-miss card onto a line is worse than no card, because the reader studies a
  pawn count that is not on their board. Count the pawns before you point at a
  card: two of the cards there have had their own wing counts corrected.
- **`record`** is the win bar: `{"at": ply, "games": n, "white": %, "draw": %,
  "black": %}`, straight out of `explorer.py`. Two judgement calls are yours.
  **Which ply** — measure at the move the variation is *named* for, not at the end
  of the line: twenty plies in, a variation has a few dozen games and the bar is
  noise. **Whether the numbers survive the text** — a bar saying Black scores
  better sits badly under prose promising an edge, and the honest fix is to say so
  in the plan card, which is what the Marshall does. The build rejects shares that
  do not total 100 and an `at` past the end of the line; nothing can check that the
  count is real, so never write one by hand.
- **`games`** are annotated by hand — `build_game` deliberately skips engine
  intel, so a game with no `notes` ships with no commentary at all. Nothing
  validates note keys against a game's length beyond a range check, which is why
  `verify-notes.py` exists. Prefer a score that ends on the winner's move, and
  run the final position through the engine before writing the last note: "and
  White resigned" is not in the PGN, and a note claiming the loser had no moves
  left is the kind of thing that turns out to be four legal king moves.
- **Shared text is free, and it is keyed by ply and SAN only.** `content/common.py`
  explains repeated opening moves by `"ply:SAN"`, so a line that reaches move six
  by a normal move order needs no notes for plies 1–6. But the key knows nothing
  about *your* opening: most entries were written for 1.e4, and a 1.d4 line that
  happens to play the same move at the same ply inherits text about a different
  game. Read what your line actually renders and override locally when it is
  wrong — nine lines were being told "after 2...dxc4 Black cannot hold the pawn"
  in positions with no pawn on d5 at all. `content/sections.py` must already contain the `section` id you
  name, and every section needs at least one opening or the tests fail.
- `tests/test_content.py` enforces the key sets exactly, so a typo'd key is a
  test failure rather than a shrug. Run the tests before the build.

### The eval bar, which every course ships

Separate from everything above, and generated rather than authored: one Stockfish
score per position, which the build hangs off each ply so the bar under the board
has a number wherever the reader is. The trainer shows the bar and the move marks
for every course whose plies carry scores, trap courses included, with no coaching
file needed; `tests/test_content.py` fails when a ported course has a ply without
one.

```bash
flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/position-evals.py ruylopez --threads 2
```

It walks every position the opening reaches — lines, deep dive, the continuation
of every deviation, and the games — and searches each at one depth with MultiPV
at one. Twenty minutes or so for the Ruy Lopez's 841 positions, cached by position
under `.engine/eval-cache.json`.

- **Re-run it whenever the content moves.** The file is generated *from* the
  lines, so adding a deviation or changing a move leaves the bar blank on the
  plies you touched. The build warns and names the first one; the tests fail on
  it. This is the step that is easy to forget and invisible on the page.
- **One depth for every opening.** The build refuses two files that disagree,
  because the bar exists so two positions can be compared.
- Adding a second opening is cheap — the cache is shared and keyed by position,
  so anything the two have in common is already searched.
- Nothing checks that a score is *true*, which is the usual rule here: never
  hand-edit one of these files.

## 3. Verify

Build the engine once (about four minutes; the binary is gitignored):

```bash
.claude/skills/opening-research/scripts/setup-engine.sh
```

Then, from the worktree root with the project venv. Every command that starts the
engine (`verify-branches.py`, `scan.py`, and the generators above) runs under the
shared lock with `nice`, as the checklist writes them: one engine job on the box at a
time.

```bash
# every authored branch: eval of the position, of the deviation, and of your line
THREADS=2 flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/verify-branches.py ruylopez

# every note key: what move it actually lands on
.venv/bin/python3 .claude/skills/opening-research/scripts/verify-notes.py ruylopez

# every move NAMED IN PROSE: is it legal in the position the prose puts it in?
# --counts also dumps, for any sentence making a countable claim: pawns by wing,
# pieces, the material balance, which files are open, and who actually attacks
# every square the sentence names. No engine needed; run it early and often.
.venv/bin/python3 .claude/skills/opening-research/scripts/verify-prose.py ruylopez --counts

# exploring before you write: candidate replies to a position, ranked
THREADS=2 flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/scan.py \
    "e4 e5 Nf3 Nc6 Bb5" a6 Nf6 f5 Bc5 d6 Nd4

# a whole session's worth in one engine start-up: one position per line,
# `prefix: move move move`, `#` for comments. This is the form you want.
THREADS=2 flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/scan.py --file positions.txt
```

A full opening takes 20–40 minutes to verify, and each script reads the module
**once, at start-up**. `verify-branches.py` prints the file's mtime when it starts
and warns at the end if you edited it meanwhile, but the rows themselves still
describe the old text — re-run the sets you changed. Set `THREADS=2` when someone
else is on the box, and both scripts flush as they go, so silence means slow, not
hung.

To stop a background run, **capture the pid when you launch it and kill that**.
Any `pkill -f` / `pgrep -f` against a repo script matches the shell that issued
it, so it kills the command you are typing and any other agent's engine running
the same script. Making the pattern more specific does not help — a port number
or a `[b]racket` trick still appears in your own command line. This has cost
several completed runs.

**Namespace your scratch files by opening.** The scratchpad directory is shared,
so `scan1.log` and `pos1.txt` collide when more than one opening is being written
at once — output interleaves mid-line and a run comes back containing somebody
else's analysis. Write to `<scratchpad>/<opening-id>/` and it cannot happen.

A move that parses is not necessarily the move you typed. `scan.py` prints
`Bxd4 -> Bd4` when the position writes it differently — python-chess accepts a
spurious capture marker and hands back an eval for a different legal move. The
build now rejects that in content (`san_overclaim`), but `scan.py` is where you
would otherwise base a whole branch on the wrong number.

**Calibrating severity** on `cost` — how much the deviation gives away compared
to the position it was played from, already sign-flipped for whoever moved:

| Cost | Severity | What the text should say |
| --- | --- | --- |
| under ~50cp | `playable` | what changes, and what each side gets |
| ~50–300cp | `inaccuracy` | the specific thing it costs |
| 300cp+, or forced material | `blunder` | the refutation, in the `line` |

`verify-branches.py` flags a row only when no reading of the eval supports it:

| Flag | Means |
| --- | --- |
| `?` | the severity does not fit `cost` |
| `!` | called a `blunder`, and its own `line` does not end 150cp in the punisher's favour |
| `~` | the `line` hands back 75cp+ of what the deviation conceded — **at any severity** |
| `x` | the move does not play from that position |

`~` is the one that earns its keep. Most bad lines found in practice were labelled
`playable` or `inaccuracy` and answered with a move that returned the whole edge,
which `!` cannot see because it only looks at blunders. On honest rows `kept`
stays within about ±10, so anything past 75 is a real problem and not depth noise.

Each row also prints `best` — the engine's reply to the deviation — and `then`,
what follows the end of the line you wrote. When a row is flagged, `best` is
usually the move your `line` should have started with, so you rarely need a second
`scan.py` run to find out.

Band edges are editorial, not arithmetic. A named theoretical defence that
concedes 60cp is still `playable`; a 40cp move that drops a pawn by force is
still a `blunder`. Write what is true, then make the label match the text.

**The sentence that goes wrong most often is "the bishop on g2 fires down the long
diagonal".** It is wrong because a piece is standing in the way, and the piece is
usually your own — so it is named nowhere in the sentence and no amount of
re-reading finds it. `--counts` prints a `sees:` list for every piece the sentence
names: a bishop on g2 that `sees:f1,f3,h1,h3` settles the question in one line.
Check it for every claim about a diagonal, a file or a rank.

**A clean `verify-branches.py` report means the labels survive, not the sentences.**
Every error found in review so far sat on a row the script printed as clean, and
almost all of them were arithmetic rather than judgement: a "bishop pair" where
both sides had two bishops, an "open file" with a pawn on it, a "4-v-3 majority"
that was 3-v-3. That is what `verify-prose.py --counts` is for — it puts the
counts next to the sentence so you compare numbers instead of trusting a mental
picture.

Five failure modes worth naming, all of them seen in practice:

- **A legal line that refutes nothing.** Read `kept`. If your continuation ends
  worse for the side you claim is better, your line is wrong even though the build
  accepted it — and the reader is being told to play the move that throws the
  advantage away.
- **A note on the wrong ply.** `verify-notes.py` prints the move each note lands
  on. A note keyed one ply off reads as nonsense on a different move.
- **An overclaim.** "A piece up" that is level, "a clean pawn" that is +0.5.
  Check the number before writing the adjective.
- **A true line with a false reason.** The eval agrees, the moves are right, and
  the explanation names a mechanism that does not exist — a defended square called
  undefended, a rook "facing" a square its own pawn blocks, a bishop pointing at a
  king on the other wing. The engine cannot see this and neither can the build.
  Read your own sentence against the board, square by square.
- **A move cited in prose that cannot be played.** `Bxc5` blocked by your own
  knight, `dxc6` after the d-pawn already moved, a move number one off so the
  reader plays it from the wrong position. The build never parses prose;
  `verify-prose.py` does.

## 4. Rebuild and check the site

The commands are checklist step 7's (worktree `cd`, the lock, the trainer's build
and tests, and the static site's build and smoke test). What follows is how to read
what they print.

All of step 7 must pass. **Read the build's own report, not just its exit code.**
`N moves, M without commentary` must end in `0`: a ply with no note and no
`common.py` entry renders nothing where the coach card should be, and the build
only warns. Same for `structure 'x': no line points here yet` — that structure
is shipping as reference material nobody can reach from a line.

These stop the build with nothing written, and are worth knowing before you hit
them:

- **`branches authored for a position no line reaches`** — you wrote a set for a
  position you then edited out of the line. Most common error in this workflow.
- **`branch prefix reaches a position another prefix already covers`** — two
  prefixes transposing into one position. Author it once, at the shorter prefix.
- **`deep dive does not continue the main line`** — `deep.moves` must start with
  `lines[0].moves` exactly, and a `SystemExit` beats the other error reporting,
  so fix this first when both are broken.
- Illegal SAN anywhere, an unknown `structure` id in a plan, an unknown `tier`
  or `severity`.
- **`says a capture that is not one` / `claims check, and the move gives none`** —
  `san_overclaim` in `src/build.py`. python-chess reads `Bxd4` on an empty d4 as
  `Bd4` and analyses it happily, so notation that lies is otherwise legal and
  silent. Disambiguation is not checked: `Nge7` where `Ne7` would do names the
  knight for the reader, and that is allowed.

And one silent one: **a deep dive with no `tier`/`drill`/`plan` of its own
inherits line 0's** (`with_deep_line` in `src/build.py`). A deep dive that ends
somewhere else therefore ships line 0's plan card describing a position fifteen
plies back. Give it its own.

Authored prose renders as HTML, so write `&amp;` and `&lt;` in text rather
than the bare characters.

## Writing for the trainer

The course app in `trainer/` (chesslab.dev) turns every line into a
**chapter** the learner works through four times: Learn (each move's note shown
*before* they play it), Drill (their moves, with hints), Test (from memory,
notes held back) and Quiz, and afterwards Recall asks every move again on a
spaced schedule. Authoring choices land differently there than on a page
someone reads once.

- **Narrated openings cost money to reword.** Learn in the courses listed in
  `NARRATED` (`trainer/src/lib/speech.ts`) is read aloud from recordings named by
  the words spoken, in the voices the course lists. A punctuation fix keeps its
  clip; changing a word in a line's name, note, per-move notes or plan means paying
  to record it again in each of them, from that course's budget (checklist step 8).
- **Prefer several focused lines of about 12–24 plies over a few long ones.**
  A chapter is drilled move by move; a 35-ply line is a chore to recall and
  hides its point. Put the long continuation in `deep`, and it becomes its own
  chapter.
- **Every learner move needs its own note.** Learn shows it as the reason to
  play the move, before the learner plays it. Shared `common.py` text written
  for another opening reads as nonsense there.
- **A quiz question is an opponent deviation with an answer.** The quiz is built
  from the branch entries at positions where the *opponent* moves, and asks for
  `line`'s first move. A deviation with no `line` can't become a question, and
  a `line` whose first move isn't the best practical answer teaches the wrong
  thing under exam conditions. Your own side's alternatives aren't quizzed:
  Drill shows their `why` when the learner plays one, so write that text as
  "playable, but the course plays X because…".
- **Opponent `blunder` entries feed "Punish the blunder".** Each needs the
  refutation in its `line`, which the skill already demands.
- **The plan card is the chapter's ending.** It's shown as "Where this leaves
  you" when a line finishes; `next` should be things to do on move N+1, not a
  summary of the line.
- **Theory prose becomes a board.** `engine/lesson.py` (the machine is
  `engine/illustrate.py`) turns move runs in `big_idea`, the plans, `structure`
  and `traps` into tappable chips with a board. A run starts at a numbered move
  (`3.e3`, `2...h5`); the bare moves after it continue it (`3.e3 Qb6 4.Nc3!`),
  and it's replayed from a position the opening's lines reach. A list of moves
  with no number (`d4, Bf4, e3, Nf3`) stays plain text, so write sequences with
  move numbers wherever seeing the position helps.
- **No promotion choice.** The board always promotes to a queen, so a line whose
  point is an underpromotion can't be drilled (the Lasker Trap was dropped for
  this).
- **Model games are played in "guess the move" mode,** stopping before each of
  the learner's moves. Annotate the moments where a guess teaches something, and
  leave the routine moves bare, because only annotated moves get a coach bubble.

## Trap courses

A trap is an opening module like any other (`section: "traps"`), not a line in
a collection, so it can grow variations the way `friedliver.py` has.

- **Teach it from the chair that springs it** (`orientation`), ending on the
  payoff. Give each line a `side` when it's taught from the other chair.
- **Add a line from the victim's chair where the engine supports one:** the
  safe move at the moment of the mistake and a sensible continuation. Spring it,
  then avoid it.
- **Exact move orders come from the trap's Wikipedia or Wikibooks article**
  (see `references/sources.md`), then the engine. Where the source and the engine
  disagree about which move is the real mistake, write what the engine says.
- **A game attribution needs the game.** Name a game only if `fetch-games.py`
  finds it in the stated form; otherwise ship the moves without the name.

## Running the engine beside other work

The box is shared (4 cores, about 5 GB free), and four engine-heavy agents at once
rebooted it once.

- **One engine job at a time on the whole box.** Wrap every Stockfish run (and
  `build.py --emit`, `npm ci`, `next build`) in
  `flock /home/ec2-user/chess-opening/.worktrees/.heavy.lock nice -n 10 ...`; the
  lock queues you behind other agents rather than beside them. Lichess streams
  (`club-stats.py`, `club-moves.py`) are one core each: `nice -n 19`, no lock.
- Always under the lock, with 2 threads at most (`THREADS=2`, `--threads 2`,
  `--workers 2`); 1 when the box is busy.
  If several agents run at once, cap the hash too:
  `STOCKFISH=<a wrapper>` whose `sed -u` rewrites the `Hash` option, and which
  also lets `quit` through (`-e '/^quit$/q'`). Without that, python-chess's
  `quit()` hangs and a finished `position-evals.py` run stalls at the very end.
- `/tmp` is wiped on reboot, so keep research notes you'll need in the worktree,
  not only in the scratchpad.

## What the page does with the rest

- **`see` is a link.** `devTarget` in `web/components/study/Deviation.tsx`
  resolves `"opening"` and `"opening#slug"`, matching the slug loosely against
  line names. A slug that matches nothing — or a target the site does not carry
  yet (an unported opening, a structure, a game) — renders no card at all, so a
  renamed line cannot quietly break a cross-reference, and nothing links into a
  404.

  Two consequences of "line names first, loosely". `scotch#gambit` in an opening
  with both a Scotch Gambit and a Göring Gambit lands on whichever line comes
  first, silently — name the slug so it can only match one. And the slug is
  ASCII-only, so a line called "Göring Gambit" is `g-ring-gambit`; check the
  target resolves rather than guessing it.

One key still does less than the authoring vocabulary suggests:

- **`tier` on a *line* or a *plan* does not filter anything.** The Show bar
  filters branches, structures, games and progression stages only; every line of
  an opening renders at every setting. A `Mastery` line is a label, not a gate,
  so do not write text that treats it as one.

`web/tests/smoke.mjs` drives the exported pages in jsdom and fails on a console
error or a leaked `undefined`; open the PR's preview link to see the content
itself. Pushing to `main` is the deploy.

## Scope of a single pass

An opening at Italian depth is roughly: 20–30 branch positions, 70–90 deviations,
a plan card per line, one or two model games, `drill: True` everywhere. All
thirteen openings are now at that depth — 345 branch positions and 1185
deviations between them, none above 32 positions and none below 23. That spread
is the evidence for the budget: the openings with the most theory in the world
(the Sicilian, the Nimzo, the Catalan) landed in the same range as the Scotch,
because what limits a page is what a reader will click through, not what exists.

Treat those as a **budget and count as you go**. It is not a floor to beat: past
about 30 positions the page asks the reader to click through deviations nobody
plays, and every extra entry is another claim to verify at 20 seconds a position.
A draft that comes in at 30/112 is not more thorough, it is a deletion pass you
have not done yet.

The verification runs take 15–20 minutes each — start them in the background and
write the next section while they run, remembering that the module was read when
the run started.

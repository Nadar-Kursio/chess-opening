---
name: opening-research
description: Research and author coached content for an opening — variations, deviations with severities, move-by-move notes, plan cards, traps, model games, records — and verify every claim against a chess engine and the Lichess explorer before it ships. Use when deepening an opening in src/content/openings/, writing branches, games or plans, or checking that existing opening commentary is actually true. To ship a whole new course, use new-course, whose checklist runs these tools and links here.
---

# Researching an opening, and proving what the course says

The build proves every move is **legal**. Nothing in the repo proves a claim is
**true** — "this wins a piece", "this is a blunder", "Karpov played this on move
24" all ship unchallenged. That gap is what this skill closes.

Order matters: **research → author → verify → fix → rebuild**. Verification is not
a final rubber stamp; expect it to send you back to the text two or three times.
On the Ruy Lopez and Four Knights it found four wrong lines in the first draft,
including a "refutation" that hung a piece.

When the job is "add the <X> course", follow the new-course skill
(`.claude/skills/new-course/SKILL.md`): its checklist runs the tools below in order and
links back here for the detail.

## The course-planning tools

Four scripts read the course module, the generated files and the club counts and
answer the questions new-course's checklist asks. All four walk the course the way the
trainer's sparring partner does (`scripts/_course.py`, mirroring `buildTree` in
`trainer/src/lib/course.ts`): the chapters from the course's chair, the answers to
the opponent's authored deviations, and the generated sidelines, matched by
position so transpositions meet. Where club games at a position are fewer than 20,
they follow the course instead, as the sparring partner does.

**Club counts** come from the Lichess explorer (`scripts/_lichess.py`), a position
at a time: every rated blitz, rapid and classical game between 1200 and 2000 players in
one month (the latest whole one for a new course; an existing course keeps the month its
committed `src/content/club/<id>.json` names, and `CLUB_MONTHS=2026-11` moves it on).
The planning tools ask the explorer directly, so a reply the course doesn't answer yet
can be followed as far as anyone played it; the sparring tools read the committed file
`club-moves.py` writes, exactly as the trainer does. Answers are cached for good under
`.engine/lichess/`, shared by every worktree, and requests are queued box-wide, one at a
time, because the explorer allows roughly 20 to 30 a minute. The client needs a
Lichess API token in `~/.config/lichess-token` (any account, no scopes).

- **`dossier.py <id> --start ... --system ...`** (minutes, no engine). The opening
  mapped before any of it is written: every opponent position reached in 1%+ of the
  course's games with its club replies and scores, candidate chapters with a `record`
  to paste and the master games played there, trap candidates and the learner moves to
  check. The cloud's evals in it are for choosing; none of them ship. `--pgn <id>`
  prints a master game.
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

**`generate.py <id>`** runs every generator in order (sidelines, club counts, evals,
verdicts, exits, the cloud cross-check), each only when something it reads changed, as
one background job with one log (`--background`, `--status`). **`crosscheck.py <id>`**
is its last step: every move the course shows whose band (blunder, inaccuracy, fine)
differs between the shipped depth-20 scores and a Lichess cloud analysis of depth 30+
is searched again at depth 28, and the rows where that agrees with the cloud are the
claims to re-read. It never edits a generated file: the shipped numbers stay at one
depth. **`move-verdicts.py`** screens every legal move at depth 10 and searches again
at 16 only the moves within five pawns of the best, so every band the trainer shows is
settled at full depth; `--compare N` checks that against N fully searched positions.

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
`explorer.py` asks the Lichess masters explorer (over-the-board games, both players
2200+) and reports, for each position you name, how many master games reached it, how
they finished, the replies in order of popularity and the best-known games there:

```bash
.claude/skills/opening-research/scripts/explorer.py "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5"
.claude/skills/opening-research/scripts/explorer.py --file positions.txt --top 8
```

Use it *before* writing a line, to pick the main line from what was played rather
than from what you remember, and again for each branch, so a `line` continuation
is a move real players chose. It matches by position rather than by move order, so
transpositions are counted. It also prints the `record` line a variation ships (see
below), which with the dossier is the only way that key should ever be filled in.
Courses written before November 2026 took their records from pgnmentor's archives,
which hold far fewer games; they keep them until the course is next edited, and an
edited line gets its record from here.

**What club players play is a different count.** Club games come from the same
explorer's Lichess database (the course-planning tools above). `sidelines.py` asks the
engine, for each club reply that leaves a chapter, whether the chapter's next move
still holds up, and sorts it into keep your setup, needs an answer, trap to dodge or
trap to set, then grows the course past the remaining gaps up to the course's size.
`move-verdicts.py` scores every legal move from every asked position, so a wrong move
gets a real answer. `club-moves.py` writes, for every position a course's opponent
moves in, the club count of every move, into `src/content/club/<id>.json`; the
trainer's sparring partner plays from it, and `exits.py` answers the moves in it that
leave the course. `generate.py` reruns all of them after an edit, in order. **Club
games choose which replies the course answers, never the course's own moves**: those
come from masters and the engine.

**Some positions have no master games, and the honest answer is to say so.** A
move-two sideline or a trap position is often never reached in master play. When
`explorer.py` comes back empty, choose the moves from the engine (and player archives,
`fetch-games.py`), leave `record` off rather than inventing one, and say in your
report that the line is engine-checked only. Named trap positions are almost never
reached in master play; trap lines ship without a `record` as a rule.

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
shared lock with `nice`: one engine job on the box at a time.

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

The commands are new-course step 6's (worktree `cd`, the lock, the trainer's build and
tests, and the static site's build and smoke test). What follows is how to read what
they print.

All of step 6 must pass. **Read the build's own report, not just its exit code.**
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
  to record it again in each of them, from that course's budget (new-course, step 7).
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
  lock queues you behind other agents rather than beside them. Lichess requests
  need no lock: `_lichess.py` queues them box-wide, one at a time.
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

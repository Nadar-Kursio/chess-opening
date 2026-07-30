---
name: opening-research
description: Research and author coached content for an opening in this course — variations, deviations with severities, move-by-move explanations, plan cards and annotated model games — and verify every claim against a chess engine before it ships. Use when adding or deepening an opening in src/content/openings/, writing branches/games/plans, or checking that existing opening commentary is actually true.
---

# Researching an opening

The build proves every move is **legal**. Nothing in the repo proves a claim is
**true** — "this wins a piece", "this is a blunder", "Karpov played this on move
24" all ship unchallenged. That gap is what this skill closes.

Order matters: **research → author → verify → fix → rebuild**. Verification is not
a final rubber stamp; expect it to send you back to the text two or three times.
On the Ruy Lopez and Four Knights it found four wrong lines in the first draft,
including a "refutation" that hung a piece.

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

## 2. Author

Copy the shape of `src/content/openings/italian.py` — it carries the full set.
`README.md` ("The optional keys") is the reference for what each key does.

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

## 3. Verify

Build the engine once (about four minutes; the binary is gitignored):

```bash
.claude/skills/opening-research/scripts/setup-engine.sh
```

Then, from the repo root with the project venv:

```bash
# every authored branch: eval of the position, of the deviation, and of your line
.venv/bin/python3 .claude/skills/opening-research/scripts/verify-branches.py ruylopez

# every note key: what move it actually lands on
.venv/bin/python3 .claude/skills/opening-research/scripts/verify-notes.py ruylopez

# every move NAMED IN PROSE: is it legal in the position the prose puts it in?
# --counts also dumps, for any sentence making a countable claim: pawns by wing,
# pieces, the material balance, which files are open, and who actually attacks
# every square the sentence names. No engine needed; run it early and often.
.venv/bin/python3 .claude/skills/opening-research/scripts/verify-prose.py ruylopez --counts

# exploring before you write: candidate replies to a position, ranked
.venv/bin/python3 .claude/skills/opening-research/scripts/scan.py \
    "e4 e5 Nf3 Nc6 Bb5" a6 Nf6 f5 Bc5 d6 Nd4

# a whole session's worth in one engine start-up: one position per line,
# `prefix: move move move`, `#` for comments. This is the form you want.
.venv/bin/python3 .claude/skills/opening-research/scripts/scan.py --file positions.txt
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

## 4. Rebuild and check the page

```bash
.venv/bin/python3 -m unittest discover tests
.venv/bin/python3 src/build.py
.venv/bin/python3 src/build.py --check                    # docs/ matches the sources
npm i -g jsdom                                            # once per box
node .claude/skills/opening-research/scripts/smoke.js [opening-id …]
```

The repo ships no `package.json` on purpose — the page has to work from a
`file://` URL — so `smoke.js` looks jsdom up globally. If the global install is
not writable, `npm i jsdom` anywhere and point `NODE_PATH` at that
`node_modules` instead.

**Read the build's own report, not just its exit code.** `N moves, M without
commentary` must end in `0`: a ply with no note and no `common.py` entry renders
the literal string `null` on the page, and the build only warns. Same for
`structure 'x': no line points here yet` — that structure is shipping as
reference material nobody can reach from a line.

**If you may not write `docs/`** — someone else is mid-rebuild, or you are one of
several agents in one checkout — `--check` still runs the whole validating build
in memory and prints its report; the closing `docs/ is stale` line is then
expected and not yours to fix. Smoke-test against a served copy instead of the
committed page:

```bash
.venv/bin/python3 src/build.py --serve --port 8611 &     # builds per request, writes nothing
curl -s http://127.0.0.1:8611/chess-opening-course.html > /tmp/page.html
PAGE=/tmp/page.html node .claude/skills/opening-research/scripts/smoke.js scotch
```

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

Authored prose is interpolated into HTML inside an inline `<script>` with no
escaping, so write `&amp;` and `&lt;` in text, and never let the sequence
`</script>` into a string — the build will not notice and the page will be dead.

## What the page does with the rest

- **`see` is a link.** `brSee` in `src/app/scripts/branch.js` resolves
  `"opening"`, `"opening#slug"` and `"structure#id"`, matching the slug loosely
  against line names first and game ids second — so `fourknights#rubinstein`
  finds the variation and `fourknights#spielmann-rubinstein` finds the game. A
  slug that matches nothing renders no link at all and `smoke.js` reports it, so
  a renamed line cannot quietly break a cross-reference.

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

The smoke test opens every deviation panel, every plan card, every game and every
structure card in jsdom and fails on an empty panel or a console error. **The
build never parses the JavaScript**, so this is the only thing standing between a
data shape it does not like and a dead page.

Then `git status` should show `docs/` rebuilt — committing that is the deploy.

## Scope of a single pass

An opening at Italian depth is roughly: 20–30 branch positions, 70–90 deviations,
a plan card per line, one or two model games, `drill: True` everywhere. Shipped:
Italian 28/106, Ruy 24/86, Four Knights 30/88, Scotch 32/104, Queen's Gambit
23/90, London 25/87, Sicilian 26/90, French 24/89, Slav 23/86, King's Indian
28/90.

Treat those as a **budget and count as you go**. It is not a floor to beat: past
about 30 positions the page asks the reader to click through deviations nobody
plays, and every extra entry is another claim to verify at 20 seconds a position.
A draft that comes in at 30/112 is not more thorough, it is a deletion pass you
have not done yet.

The verification runs take 15–20 minutes each — start them in the background and
write the next section while they run, remembering that the module was read when
the run started.

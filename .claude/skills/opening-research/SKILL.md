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
- **Severity is a promise to the learner.** `blunder` means there is a refutation
  and it is in the `line`. `inaccuracy` means it costs something specific. Most
  deviations are `playable` — say so, and explain what changes rather than
  hunting for a punishment that is not there.
- **`plan`** ends the line. Name the structure if a card in `structures.py` fits;
  add a new structure only when two or more lines reach it, and be honest in
  `taxonomy` about whether the literature actually names it.
- **`games`** are annotated by hand — `build_game` deliberately skips engine
  intel, so a game with no `notes` ships with no commentary at all. Nothing
  validates note keys against a game's length beyond a range check, which is why
  `verify-notes.py` exists.
- **Shared text is free.** `content/common.py` explains repeated opening moves by
  `"ply:SAN"`; a line that reaches move six by a normal move order needs no notes
  for plies 1–6. `content/sections.py` must already contain the `section` id you
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

# exploring before you write: candidate replies to a position, ranked
.venv/bin/python3 .claude/skills/opening-research/scripts/scan.py \
    "e4 e5 Nf3 Nc6 Bb5" a6 Nf6 f5 Bc5 d6 Nd4
```

**Calibrating severity** on `cost` — how much the deviation gives away compared
to the position it was played from, already sign-flipped for whoever moved:

| Cost | Severity | What the text should say |
| --- | --- | --- |
| under ~50cp | `playable` | what changes, and what each side gets |
| ~50–300cp | `inaccuracy` | the specific thing it costs |
| 300cp+, or forced material | `blunder` | the refutation, in the `line` |

`verify-branches.py` only flags a row when no reading of the eval supports the
label — `?` for that, and `!` for a branch called a `blunder` whose own `line`
does not end at least 150cp in the punisher's favour. That second flag is the
valuable one: it is the "refutation" that quietly loses a piece.

Band edges are editorial, not arithmetic. A named theoretical defence that
concedes 60cp is still `playable`; a 40cp move that drops a pawn by force is
still a `blunder`. Write what is true, then make the label match the text.

Three failure modes worth naming, all of them seen in practice:

- **A legal line that refutes nothing.** Read the *end* eval in
  `verify-branches.py`. If your continuation ends worse for the side you claim is
  better, your line is wrong even though the build accepted it.
- **A note on the wrong ply.** `verify-notes.py` prints the move each note lands
  on. A note keyed one ply off reads as nonsense on a different move.
- **An overclaim.** "A piece up" that is level, "a clean pawn" that is +0.5.
  Check the number before writing the adjective.

## 4. Rebuild and check the page

```bash
.venv/bin/python3 -m unittest discover tests
.venv/bin/python3 src/build.py
.venv/bin/python3 src/build.py --check                    # docs/ matches the sources
npm i -g jsdom                                            # once per box
node .claude/skills/opening-research/scripts/smoke.js [opening-id …]
```

**Read the build's own report, not just its exit code.** `N moves, M without
commentary` must end in `0`: a ply with no note and no `common.py` entry renders
the literal string `null` on the page, and the build only warns. Same for
`structure 'x': no line points here yet` — that structure is shipping as
reference material nobody can reach from a line.

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

And one silent one: **a deep dive with no `tier`/`drill`/`plan` of its own
inherits line 0's** (`with_deep_line` in `src/build.py`). A deep dive that ends
somewhere else therefore ships line 0's plan card describing a position fifteen
plies back. Give it its own.

Authored prose is interpolated into HTML inside an inline `<script>` with no
escaping, so write `&amp;` and `&lt;` in text, and never let the sequence
`</script>` into a string — the build will not notice and the page will be dead.

## What the page ignores today

Three keys are accepted by the build and the tests, and do less than the
authoring vocabulary suggests. Do not write text that depends on them:

- **`see` is emitted and never rendered.** No script reads it, so a branch that
  says "step through the model game below" gives the reader nothing to click.
  Keep it as authoring metadata, and make the prose stand on its own.
- **`tier` on a *line* or a *plan* does not filter anything.** The Show bar
  filters branches, structures, games and progression stages only; every line of
  an opening renders at every setting. A `Mastery` line is a label, not a gate.
- **The plan card is hidden in drill mode** (`plan.js`), so a learner who drills
  a line to the end never sees it.

Worth fixing in the app one day; until then, they are constraints on what the
content can promise.

The smoke test opens every deviation panel, every plan card, every game and every
structure card in jsdom and fails on an empty panel or a console error. **The
build never parses the JavaScript**, so this is the only thing standing between a
data shape it does not like and a dead page.

Then `git status` should show `docs/` rebuilt — committing that is the deploy.

## Scope of a single pass

An opening at Italian depth is roughly: 20–30 branch positions, 70–90 deviations,
a plan card per line, one or two model games, `drill: True` everywhere. That is a
long session, and the verification runs take 15–20 minutes each — start them in
the background and write the next section while they run.

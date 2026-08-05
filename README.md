# Chess Opening Course — interactive, self-contained

An interactive opening trainer: 13 openings, 66 variations, 1,518 engine-validated
moves, chess.com-style arrows (including bent knight arrows), and an auto-generated
"what this move does" line under every move. The whole app is a single HTML file
with no external dependencies — open it in any browser.

You can **read** a line, or **drill** it — the board asks for each move before it
shows you, with a three-rung hint ladder and a score. When your opponent plays
something else, the deviation panel answers *the move they actually played*, sorted
into blunder / inaccuracy / playable — because most deviations are none of the first
two, and a trainer that answers every one with a red cross teaches you to hunt for
refutations that were never there. Every line ends with a plan card naming the pawn
structure it reached, and structures are shared across openings, so learning the
isolani once pays out in four of them. A variation can also carry a **win bar** —
the chess.com-style white/draw/black split of the master games that reached its key
position, counted from real PGN rather than quoted from anywhere. And you can write
**your own notes** over the top of any of it — text and arrows you drew yourself,
kept in their own card so they never pass for the engine-checked kind.

## Quick start

Online: **https://chesslab.dev**

Or build it and open the file locally:

```
python3 src/build.py
open docs/chess-opening-course.html          # macOS
xdg-open docs/chess-opening-course.html      # Linux
start docs/chess-opening-course.html         # Windows
```

That file is fully self-contained (data + code inline). If you only ever keep one
thing, keep that.

## Project layout

Everything under `src/` is source; everything under `docs/` is generated and
gitignored. Never edit `docs/` by hand — run the build.

> **Why `docs/` and not `build/`?** Read it as "where the build writes", not as
> documentation. The name is a holdover from GitHub Pages, which served from the
> repo root or `/docs` and nowhere else.

```
docs/                          <- generated and gitignored; CI uploads it
  chess-opening-course.html      the built, shippable app
  index.html                     redirect so / opens the course
  .nojekyll                      switches off Pages' Jekyll pass

src/
  build.py                     <- validates, generates intel, assembles the page
  engine/
    board.py                     board -> 64-char position string
    intel.py                     per-move arrows + "what it does" text
    notes.py                     the personal-notes format, parsed
  content/
    common.py                    shared annotations, keyed by "ply:SAN"
    sections.py                  the four opening families, and their order
    structures.py                pawn structures, shared between openings
    openings/
      __init__.py                ORDER: which openings exist, and in what order
      italian.py, ruylopez.py…   one module per opening — 13 of them
    notes/
      ruylopez.txt…              your own notes, one file per opening
  app/
    page.html                    document skeleton with the build's placeholders
    primer.html                  the "how openings work" primer, as plain HTML
    index.html                   the redirect stub copied to docs/
    styles/                      18 stylesheets, concatenated in build.py's order
      tokens.css                   the design system: palette, type scale, spacing
      base.css                     reset and the text primitives
      controls.css                 .btn / .pill / .seg -- every control on the page
      shell.css                    app bar, course nav, the two-column frame
      …then one file per component, and responsive.css last
    scripts/                     16 scripts, concatenated in build.py's order

scripts/serve.sh               <- build and preview locally; sets up .venv if needed
tests/test_content.py          <- shape checks over the opening catalogue
tests/test_smoke.py            <- loads the built page in a DOM and drives every view
tests/smoke.mjs                <- what it drives it with
```

`STYLES` and `SCRIPTS` in `build.py` are the real file lists; a file not named
there is silently left out of the build. Both are order-dependent — `responsive.css`
must cascade last, `boot.js` must run last, and the scripts share one top-level
scope, so a `const` is only visible to files listed after it.

## Rebuilding after an edit

The one dependency lives in a virtualenv, so use that interpreter rather than the
system `python3` — every command below assumes it:

```
python3 -m venv .venv                        # first time only
.venv/bin/pip install -r requirements.txt

.venv/bin/python3 src/build.py
```

Or `source .venv/bin/activate` once and plain `python3` works for the rest of the
shell. Using the system `python3` by mistake fails with a message telling you
this, rather than a bare `ModuleNotFoundError`.

`src/build.py` does three things:
1. Validates that **every move in every line is legal**, and that its notation does
   not claim more than the move does (fails loudly on either).
2. Generates arrows + a plain-language tactical summary for each move (`engine/intel.py`).
3. Writes `docs/`, inlining the data, styles and scripts into one HTML file.

If a move is illegal, the build prints every problem it found — naming the opening,
line, ply, and for a deviation the branch — and then stops without writing. That
matters: `build_line` breaks out of a bad line, so carrying on would write a
silently truncated line into `docs/` that `--check` would then call up to date.

Legality alone is not enough, because python-chess is lenient about markers:
`Bxd4` on an empty d4 parses happily as `Bd4`, a different legal move that the
surrounding explanation is not about. So a capture marker on a non-capture, a `+`
on a move that gives no check and a `#` on a move that is not mate are all content
errors (`san_overclaim`). Disambiguation is not policed — `Nge7` where `Ne7` would
do names the knight for the reader, and two lines use it deliberately.

`python3 src/build.py --check` verifies `docs/` matches the sources without
writing anything — use it to catch a data edit that was never rebuilt.

## Previewing while you work

```
scripts/serve.sh                  # http://127.0.0.1:8000/
scripts/serve.sh --port 9000
scripts/serve.sh --host 0.0.0.0   # reachable from other machines
```

That is the whole setup step: the script creates `.venv` and installs the
dependency if they are missing, then starts the server. It works from any
directory and always serves the checkout it lives in — run the copy inside a
worktree and you get that worktree, not `main`.

It is a thin wrapper. The build owns the behaviour and can be driven directly:

```
.venv/bin/python3 src/build.py --serve --port 9000
```

It rebuilds on every request — about 0.4s — and serves the result **from memory**.
Nothing is written to `docs/`, so a preview never leaves the repo half-built or
produces a diff you did not ask for, and there is no stale-page failure mode to
remember: edit a module, refresh, see it. Responses carry `Cache-Control: no-store`,
so an ordinary refresh is enough.

If the build fails you get a 500 with the error — opening, line and ply — instead
of the last page that happened to work.

It binds loopback unless you pass `--host`, so exposing the port is something you
type rather than something you get. There is no live reload and no file watching;
this is a plain rebuild-per-request server, which is all a 0.4s build needs.

Note that `--serve` drops the cached `content.*` modules before each build.
Without that, `import_module` would hand back the first import forever and the
server would serve your first build all afternoon — the styles and scripts are
read from disk every time, so only content edits would silently fail to appear.

**The build does not parse the JavaScript.** It concatenates it, so a syntax error
in a script ships a dead page and the build still reports success.

`tests/test_smoke.py` is the guard: it loads the built page in jsdom and drives
every view, every mode and every control, failing on anything thrown and on any
view that renders `undefined` into the page. That catches a syntax error, and it
catches the subtler version -- a function renamed in one file and not in the file
that calls it.

It needs node and jsdom, and **skips loudly** when they are missing:

```
npm install jsdom            # once; node_modules/ is gitignored
python3 -m unittest discover tests
```

What it cannot see is layout, because jsdom has no layout engine. After a change
to `src/app/styles/`, open the page — or the pull request's preview URL — and look
at it on a phone as well as a desktop.

## Publishing

Push to `main`. `.github/workflows/deploy.yml` runs the tests, builds, and uploads
`docs/` to Cloudflare Pages, which serves https://chesslab.dev.

Every pull request gets the whole site to itself at
`https://<branch>.chesslab.pages.dev`, posted as a comment on the PR, so a change
can be read in a browser before it is merged. Branch names are lowercased and
non-alphanumeric characters become hyphens, so `issue-42` serves at
`issue-42.chesslab.pages.dev`.

Because `docs/` is never committed, the page that ships is always the one CI built
from the `src/` in that commit — there is no way to push a stale page. Locally,
`python3 src/build.py --check` still tells you whether your `docs/` is current.

## How to add a new opening

1. Copy any module in `src/content/openings/` — `italian.py` is a good, plain
   example — and edit it. One module holds everything about one opening: its
   `lines`, its `deep` dive, and its `progression`.
2. Add its name to `ORDER` in `src/content/openings/__init__.py`. That list is
   the catalogue *and* the nav order; it is editorial, not alphabetical, and it
   runs family by family in the order `sections.py` lists them.
3. Set its `"section"` to one of the four family ids in `src/content/sections.py`
   — `open`, `semi-open`, `closed`, `indian`. That is the grouping the nav and
   every page head use, and it is the one the literature and the ECO volumes use.
4. Run `python3 src/build.py`.

Nothing else needs to change — the build has no per-opening knowledge. To add a
variation to an existing opening, add an entry to its `lines` list: `name`,
`note`, `moves` (space-separated SAN) and `notes` (ply number -> explanation).

Arrows and the "On the board" tactical line are generated automatically from the
moves — you do not write those by hand.

### The optional keys

Every one of these can be left out, and an opening without them still builds and
still works — the drill, the deviation panel and the plan card all degrade rather
than disappear. All thirteen openings carry `tier`, `drill`, `plan`, `branches` and
`games`: 353 branch positions, 1207 deviations and 27 annotated games between them.
`record` is newer and only the Ruy Lopez has it. The degradation still matters,
because it is what let the course grow one opening at a time without a flag day.

| Key | Where | What it does |
| --- | --- | --- |
| `tier` | line, branch, structure, game | A difficulty band. Authored throughout and validated by the build, but nothing in the UI reads it — the picker that filtered on it was removed for being unexplainable. Kept because re-deriving the bands by hand would be the expensive half of bringing a difficulty feature back. |
| `drill` | line | Ships a legal-move list per position, so the drill can tell *illegal* from merely *not this line*. |
| `plan` | line | The end-of-line card: `point`, optional `structure` id, `next`, `endgame`. |
| `record` | line | The win bar: `at` (the ply the games were counted from), `games`, and `white` / `draw` / `black` percentages that must add up to 100. Counted with the research skill's `explorer.py`; the build rejects a record whose shares do not total 100 or whose `at` is past the end of the line. |
| `branches` | opening | Deviations, keyed by the **SAN prefix that reaches the position** — not by ply. A branch written once fires in every line of *that opening* which passes through the position; a second opening that transposes there writes its own, because the index is built per opening. |
| `games` | opening | Annotated model games, replayed with the same board and tape. |

A branch entry is `san` + `severity` (`blunder` / `inaccuracy` / `playable`) +
`why`, optionally `name`, `line` (the continuation that proves the point) and
`see` — a cross-reference the panel renders as a button. `see` takes `"opening"`,
`"opening#slug"` or `"structure#id"`, the slug matched against that opening's line
names first and its game ids second. A slug matching nothing renders no button.

A branch that happens to be the move some line plays is not an error: positions are
shared, so the same move can be a deviation from one line and the main move of
another. The line being rendered drops it.

Structures live in `src/content/structures.py` and belong to no single opening. A
line points at one from its `plan`; the reverse list — which openings reach a
structure — is derived by the build and must never be written by hand.

## Your own notes

Everything above is course content, checked against an engine before it ships.
Your own notes are a separate channel: one plain-text file per opening in
`src/content/notes/`, named for the opening id, and rendered in its own card
under the coach card with the marks you drew alongside.

```
Open Spanish — the Dilworth:
   6. d4 (Attacks the centre.) [d4-e5, d4-c5]
      b5 (Kicks the bishop.)   [b5-a4]
```

A block opens with a title line ending in `:`. After that it is ordinary
notation: a note in `(round brackets)` and board marks in `[square brackets]`,
each attaching to the move it follows. `e2-e4` draws an arrow, `!e4` circles a
square, and a line starting with `#` is a comment — only at the start of a line,
because mid-line a `#` is checkmate. Layout is free: a move to a line or a whole
variation on one reads the same, move numbers are ignored wherever they fall,
and a note may wrap across lines.

**Notes attach by position, not by ply.** The file is replayed on a board and
each note is stored against the position its move reaches, so one sentence shows
up in every line, deep dive and deviation of that opening that arrives there —
and your move order only has to reach the same positions, not match. Writing
`10.Bc2 O-O 11.Nbd2` where the course plays `10.Nbd2 O-O 11.Bc2` lands your note
on the course's line without touching either.

The cost of that is a note with nowhere to live, when your move order reaches a
position no line does. The build **warns** rather than stopping — the file is
prose, and one homeless sentence must not hide the twenty that landed — and
prints which note and which line of the file, along with `N of M personal notes
attached to a position` on every rebuild. An *illegal* move is still a hard
error: every note after it would be a move out of step.

Unlike the content modules, note prose is HTML-escaped by the build, so a stray
`<` or `&` is not your problem. The **Notes** button beside Flip and Arrows hides
the card and its marks together, leaving the course exactly as it was.

Nothing here is verified. That is the reason for the separate card and the
separate colour: six months from now, the difference between what an engine
confirmed and what you remembered is the only thing telling you which of the two
to trust.

### Writing one in the browser

The same note can be written while you are reading, without a rebuild. Under
every move there is **Write a note on this position**; it opens a text box and
turns the board into a drawing surface.

| To draw | Do this |
| --- | --- |
| An arrow | **Right-drag** on the board |
| A circled square | **Right-click** it |
| Either, without a right button | **Make arrow** or **Circle square**, then tap the squares |
| Undo one mark | Click it in the list under the text box |
| Undo an arrow you just drew | Draw it again — the second time removes it |

**Drawing is the right button, and only the right button.** A left-drag on this
board means *play this move*, and read mode answers whatever you play with the
deviation library — so an open text box changes nothing about what the board
does. Right-drag works whether the editor is open or not, and opens it on the way.

The one exception is the two-tap tools, which exist because a finger has no right
button: pressing **Make arrow** or **Circle square** buys a plain tap its new
meaning, and buys it for exactly two taps.

Notes are stored in `localStorage` under `chessopening` — the same single JSON
payload as your drill progress and theme, under a `notes` key — and are **keyed
by position** exactly like the files, so a note follows a transposition into a
different opening and survives a line being renamed or reordered. A note written
here shadows the file's note for the same position; nothing in a browser can edit
a file, so **Delete** always brings the shipped text back.

The editor belongs to the position it was opened on. Stepping away mid-sentence
saves what you typed against that position rather than dropping it or filing it
against the move you stepped onto.

**Your progress → Copy as a notes file** writes everything you have annotated in
the format above, grouped into the file each block belongs in. Within one
opening a shared position is written once — the build rejects two notes on one
position — and across openings it is repeated, because a notes file is read per
opening and the Italian's copy is not one the Ruy Lopez can see.

**Before writing any of it, read `.claude/skills/opening-research/SKILL.md`.** The
build proves a move legal; nothing here proves a claim *true*, and "this wins a
piece" ships unchallenged. That skill is the research-and-verify loop that closes
the gap, and it has caught wrong lines — including "refutations" that hung a
piece — in every authoring pass so far.

## Design notes (why things are the way they are)

- **Board is HTML `<div>` grid, not SVG.** An earlier SVG board went blank in some
  embedded viewers; the div grid + `padding-top:100%` square wrapper renders
  everywhere.
- **Arrows are drawn on a `<canvas>` overlay**, for the same robustness reason.
- **A console shim** at the top of the HTML defines any missing `console` methods,
  so host wrappers that call e.g. `console.debug` can't crash the page.
- **Move intel is engine-derived** (python-chess), so the arrows and tactical text
  are always accurate rather than hand-written guesses.
- **The build concatenates rather than bundles.** No npm, no bundler, and no ES
  modules — the output has to keep working from a `file://` URL with no server,
  which ES modules would refuse to load.
- **One nav, two presentations.** The rail beside the content on a wide screen
  and the drawer on a narrow one are the same markup, built once by `nav.js`. The
  page used to carry a second, cut-down copy of the nav as a `<select>` for
  phones, which meant every navigation idea had to be built twice and the phone
  got the worse half.
- **The board is pinned on a phone.** It stays under the app bar while the notes
  scroll beneath it, because reading "this move attacks f7" with the board off
  the top of the screen is not reading. That is why `.study` is a grid on a wide
  screen and a flex column on a narrow one: a grid item's sticky positioning is
  bounded by its own grid area, so a board in a one-column grid has nowhere to
  travel.
- **One coach card.** Reading a note, being marked in drill, and being shown what
  a deviation does are the same slot beside the board, so they are the same
  component with a different tone rule — not three differently-shaped boxes that
  make the page look like it changed subject every time it answers.
- **Severity is never colour alone.** Every mark states its word, and the live
  region announces the same word. The `??` / `?!` / `=` glyph beside it is the
  notation a player already reads.
- **One module per opening.** Content used to be grouped by *kind* — all the deep
  dives in one file, all the learning paths in another — which meant adding an
  opening touched three files and, in the Four Knights' case, the build script
  too. Grouping by opening instead makes the build's job uniform.

## License / use

Personal study material. Openings, names, and ECO codes are public knowledge.

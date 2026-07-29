# Chess Opening Course — interactive, self-contained

An interactive opening trainer: 13 openings, 59 variations, 1,359 engine-validated
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
isolani once pays out in four of them.

## Quick start

Online: **https://nadar-kursio.github.io/chess-opening/**

Or open the built file locally:

```
open docs/chess-opening-course.html          # macOS
xdg-open docs/chess-opening-course.html      # Linux
start docs/chess-opening-course.html         # Windows
```

That file is fully self-contained (data + code inline). If you only ever keep one
thing, keep that.

## Project layout

Everything under `src/` is source; everything under `docs/` is generated and is
what GitHub Pages serves. Never edit `docs/` by hand — run the build.

> **Why `docs/` and not `build/`?** Not a choice. GitHub Pages' deploy-from-a-branch
> mode accepts exactly two source folders — the repo root, or `/docs`. Since the
> root is where the source lives, `/docs` is the only option left. Read it as
> "the folder Pages serves", not as documentation. Using `build/` would mean
> dropping branch deployment and publishing through a GitHub Actions workflow
> instead.

```
docs/                          <- generated; served by GitHub Pages
  chess-opening-course.html      the built, shippable app
  index.html                     redirect so / opens the course
  .nojekyll                      switches off Pages' Jekyll pass

src/
  build.py                     <- validates, generates intel, assembles the page
  engine/
    board.py                     board -> 64-char position string
    intel.py                     per-move arrows + "what it does" text
  content/
    common.py                    shared annotations, keyed by "ply:SAN"
    sections.py                  the sidebar's sections and their order
    structures.py                pawn structures, shared between openings
    openings/
      __init__.py                ORDER: which openings exist, and in what order
      italian.py, ruylopez.py…   one module per opening — 13 of them
  app/
    page.html                    document skeleton with the build's placeholders
    primer.html                  the "how openings work" primer, as plain HTML
    index.html                   the redirect stub copied to docs/
    styles/                      13 stylesheets, concatenated in build.py's order
    scripts/                     14 scripts, concatenated in build.py's order

scripts/serve.sh               <- build and preview locally; sets up .venv if needed
tests/test_content.py          <- shape checks over the opening catalogue
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
1. Validates that **every move in every line is legal** (fails loudly if not).
2. Generates arrows + a plain-language tactical summary for each move (`engine/intel.py`).
3. Writes `docs/`, inlining the data, styles and scripts into one HTML file.

If a move is illegal, the build prints every problem it found — naming the opening,
line, ply, and for a deviation the branch — and then stops without writing. That
matters: `build_line` breaks out of a bad line, so carrying on would write a
silently truncated line into `docs/` that `--check` would then call up to date.

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
in a script ships a dead page and the build still reports success. Nothing in the
repo catches that; load `docs/chess-opening-course.html` in a browser after touching
anything under `src/app/scripts/` and check the console.

## Publishing

There is no deploy step. Pages is configured to deploy from `main`, folder
`/docs`, so **committing a rebuilt `docs/` is the deploy**:

```
python3 src/build.py
git add -A && git commit -m "…" && git push
```

The site updates about a minute later at
https://nadar-kursio.github.io/chess-opening/. Push without rebuilding and the
site keeps serving the previous version — `--check` exists to catch exactly that.
`gh api repos/Nadar-Kursio/chess-opening/pages/builds/latest` shows the last
build's status if a change does not appear.

## How to add a new opening

1. Copy any module in `src/content/openings/` — `italian.py` is a good, plain
   example — and edit it. One module holds everything about one opening: its
   `lines`, its `deep` dive, and its `progression`.
2. Add its name to `ORDER` in `src/content/openings/__init__.py`. That list is
   the catalogue *and* the sidebar order; it is editorial, not alphabetical.
3. Run `python3 src/build.py`.

Nothing else needs to change — the build has no per-opening knowledge. To add a
variation to an existing opening, add an entry to its `lines` list: `name`,
`note`, `moves` (space-separated SAN) and `notes` (ply number -> explanation).

Arrows and the "On the board" tactical line are generated automatically from the
moves — you do not write those by hand.

### The optional keys

Every one of these can be left out, and an opening without them still builds and
still works — the drill, the deviation panel and the plan card all degrade rather
than disappear. Only the Italian carries the full set today.

| Key | Where | What it does |
| --- | --- | --- |
| `tier` | line, branch, structure, game | Hides it below that setting in the **Show** bar. Absent = always visible. |
| `drill` | line | Ships a legal-move list per position, so the drill can tell *illegal* from merely *not this line*. |
| `plan` | line | The end-of-line card: `point`, optional `structure` id, `next`, `endgame`. |
| `branches` | opening | Deviations, keyed by the **SAN prefix that reaches the position** — not by ply. A branch written once fires in every line and every opening that transposes into that position. |
| `games` | opening | Annotated model games, replayed with the same board and tape. |

A branch that happens to be the move some line plays is not an error: positions are
shared, so the same move can be a deviation from one line and the main move of
another. The line being rendered drops it.

Structures live in `src/content/structures.py` and belong to no single opening. A
line points at one from its `plan`; the reverse list — which openings reach a
structure — is derived by the build and must never be written by hand.

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
- **One module per opening.** Content used to be grouped by *kind* — all the deep
  dives in one file, all the learning paths in another — which meant adding an
  opening touched three files and, in the Four Knights' case, the build script
  too. Grouping by opening instead makes the build's job uniform.

## License / use

Personal study material. Openings, names, and ECO codes are public knowledge.

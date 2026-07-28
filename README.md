# Chess Opening Course — interactive, self-contained

An interactive opening trainer: 13 openings, 59 variations, 1,359 engine-validated
moves, chess.com-style arrows (including bent knight arrows), and an auto-generated
"what this move does" line under every move. The whole app is a single HTML file
with no external dependencies — open it in any browser.

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
  openings.json                  the data, also inlined into the HTML
  .nojekyll                      switches off Pages' Jekyll pass

src/
  build.py                     <- validates, generates intel, assembles the page
  engine/
    board.py                     board -> 64-char position string
    intel.py                     per-move arrows + "what it does" text
  content/
    common.py                    shared annotations, keyed by "ply:SAN"
    sections.py                  the sidebar's sections and their order
    openings/
      __init__.py                ORDER: which openings exist, and in what order
      italian.py, ruylopez.py…   one module per opening — 13 of them
  app/
    page.html                    document skeleton with the build's placeholders
    primer.html                  the "how openings work" primer, as plain HTML
    index.html                   the redirect stub copied to docs/
    styles/                      9 stylesheets, concatenated in build.py's order
    scripts/                     7 scripts, concatenated in build.py's order

tests/test_content.py          <- shape checks over the opening catalogue
```

## Rebuilding after an edit

```
pip install -r requirements.txt
python3 src/build.py
```

`src/build.py` does three things:
1. Validates that **every move in every line is legal** (fails loudly if not).
2. Generates arrows + a plain-language tactical summary for each move (`engine/intel.py`).
3. Writes `docs/`, inlining the data, styles and scripts into one HTML file.

If a move is illegal, the build prints exactly which line and ply, and stops.
`python3 src/build.py --check` verifies `docs/` matches the sources without
writing anything — use it to catch a data edit that was never rebuilt.

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

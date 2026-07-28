# Chess Opening Course — interactive, self-contained

An interactive opening trainer: 13 openings, 59 variations, 1,359 engine-validated
moves, chess.com-style arrows (including bent knight arrows), and an auto-generated
"what this move does" line under every move. The whole app is a single HTML file
with no external dependencies — open it in any browser.

## Quick start

Online: **https://nadar-kursio.github.io/chess-opening/**

Or open the built file locally:

```
open chess-opening-course.html          # macOS
xdg-open chess-opening-course.html      # Linux
start chess-opening-course.html         # Windows
```

That file is fully self-contained (data + code inline). If you only ever keep one
thing, keep that.

## Project layout

```
chess-opening-course.html   <- the built, shippable app (generated)
shell.html                  <- the HTML/CSS/JS template, with a __DATA__ placeholder
openings.json               <- generated data (moves, notes, arrows, tactics)
build_data.py               <- builds openings.json AND injects it into the HTML
move_intel.py               <- engine logic: per-move arrows + "what it does" text

data_common.py              <- shared move annotations (keyed by "ply:SAN")
data_white_e4.py            <- White 1.e4 openings (Italian, Ruy Lopez, Scotch)
data_white_d4.py            <- White 1.d4 openings (Queen's Gambit, London, Catalan)
data_black_e4.py            <- Black vs 1.e4 (Sicilian, French, Caro-Kann)
data_black_d4.py            <- Black vs 1.d4 (King's Indian, Nimzo-Indian, Slav)
data_four_knights.py        <- Four Knights + all its variations (incl. Caro, Tarrasch)
data_deep.py                <- "deep dive" middlegame continuations
data_prog_white.py          <- learning-path progressions for White openings
data_prog_black.py          <- learning-path progressions for Black openings
```

## Rebuilding after an edit

Requires Python 3 and the `python-chess` package:

```
pip install chess
python3 build_data.py
```

`build_data.py` does three things:
1. Validates that **every move in every line is legal** (fails loudly if not).
2. Generates arrows + a plain-language tactical summary for each move (`move_intel.py`).
3. Writes `openings.json` and injects it into `shell.html` -> `chess-opening-course.html`.

If a move is illegal, the build prints exactly which line and ply, and stops.

## How to add a new opening or variation

1. Open the relevant `data_*.py` file (e.g. `data_white_e4.py`).
2. Add a new opening object, or add a line to an existing opening's `lines` list.
   A line needs: `name`, `note`, `moves` (space-separated SAN), and `notes`
   (a dict mapping ply-number -> explanation string).
3. Run `python3 build_data.py`. It validates the moves and rebuilds the HTML.
4. Open `chess-opening-course.html` to check it.

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

## License / use

Personal study material. Openings, names, and ECO codes are public knowledge.

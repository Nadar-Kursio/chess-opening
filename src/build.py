"""Build the course: validate every line, generate move intel, emit the app.

Run from the repo root:  python src/build.py

Every move in every line is replayed on a real board. An illegal move fails the
build loudly, naming the opening, line and ply.
"""
import json
import os
import sys

import chess

from content.common import COMMON
from content.openings import load
from content.sections import SECTIONS
from engine.board import board_array
from engine.intel import move_data

SRC = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(SRC, "app")
DOCS = os.path.join(os.path.dirname(SRC), "docs")

# Concatenation order. CSS cascades and the scripts share a top-level scope, so
# both are order-dependent: responsive.css must land last, boot.js must run last.
STYLES = ["base", "layout", "study", "board", "arrows",
          "theory", "primer", "path", "responsive"]
SCRIPTS = ["state", "rail", "board", "arrows", "render", "primer", "boot"]

OPENING_NOTE = ("The starting position. White moves first — and that single tempo "
                "is the whole reason opening theory exists.")


def with_deep_line(op):
    """Append the deep dive as an extra line, inheriting the main line's notes.

    A deep dive continues line 0, so it reuses that line's commentary for the
    moves they share and only supplies notes for the moves beyond it.
    """
    deep = op["deep"]
    main_moves = op["lines"][0]["moves"].split()
    if deep["moves"].split()[:len(main_moves)] != main_moves:
        raise SystemExit(f"{op['id']}: deep dive does not continue the main line")

    notes = dict(op["lines"][0]["notes"])
    notes.update(deep["notes"])
    return op["lines"] + [{
        "name": deep["name"],
        "note": deep["note"],
        "moves": deep["moves"],
        "notes": notes,
    }]


def build_line(op_id, index, line, errors):
    """Replay one line, returning its ply-by-ply record."""
    board = chess.Board()
    plies = [{
        "san": "", "fen": board_array(board), "from": None, "to": None,
        "note": OPENING_NOTE, "num": "", "turn": "w",
    }]

    for i, san in enumerate(line["moves"].split()):
        try:
            move = board.parse_san(san)
        except Exception as e:
            errors.append(f"{op_id} / line {index} '{line['name']}' / ply {i+1} '{san}': {e}")
            break
        mover = "w" if board.turn == chess.WHITE else "b"
        arrows, tactics = move_data(board, move)   # board is the position BEFORE the move
        board.push(move)

        ply = i + 1
        prefix = "" if mover == "w" else ".."
        plies.append({
            "san": san, "fen": board_array(board),
            "from": chess.square_name(move.from_square),
            "to": chess.square_name(move.to_square),
            "note": line["notes"].get(ply) or COMMON.get(f"{ply}:{san}"),
            "num": f"{(ply + 1) // 2}.{prefix}{san}",
            "turn": mover,
            "check": board.is_check(),
            "arrows": arrows, "tactics": tactics,
        })
    return {"name": line["name"], "note": line.get("note", ""), "plies": plies}


def build_openings():
    errors = []
    out = []
    for op in load():
        lines = with_deep_line(op)
        record = {k: v for k, v in op.items() if k != "deep"}
        record["lines"] = [build_line(op["id"], i, line, errors)
                           for i, line in enumerate(lines)]
        out.append(record)

    if errors:
        print("=== ILLEGAL MOVES FOUND ===")
        for e in errors:
            print(" ", e)
    else:
        print("All moves legal.")

    total = missing = 0
    for op in out:
        for line in op["lines"]:
            for p in line["plies"][1:]:
                total += 1
                if not p["note"]:
                    missing += 1
                    print("  no note:", op["id"], "|", line["name"], "|", p["num"])
    print(f"{total} moves, {missing} without commentary")
    return out


def read(*parts):
    with open(os.path.join(APP, *parts), encoding="utf-8") as f:
        return f.read()


def assemble(data_str):
    """Inline every asset into one self-contained page.

    Plain concatenation, deliberately: the output has to keep working from a
    file:// URL with no server, which rules out ES modules and any external
    reference.
    """
    page = read("page.html")
    parts = {
        "__HEAD_SCRIPT__": read("scripts", "shim.js"),
        "__STYLES__": "\n".join(read("styles", f"{n}.css") for n in STYLES),
        "__PRIMER__": read("primer.html"),
        "__SCRIPTS__": "\n".join(read("scripts", f"{n}.js") for n in SCRIPTS),
    }
    for placeholder, text in parts.items():
        if placeholder not in page:
            raise SystemExit(f"page.html is missing the {placeholder} placeholder")
        page = page.replace(placeholder, text)

    for placeholder, text in (("__SECTIONS__", json.dumps(SECTIONS)),
                              ("__DATA__", data_str)):
        if placeholder not in page:
            raise SystemExit(f"assembled page is missing the {placeholder} placeholder")
        page = page.replace(placeholder, text)
    return page


def outputs():
    """Everything the build produces, as {filename: text}."""
    data_str = json.dumps(build_openings(), separators=(",", ":"))
    return {
        "openings.json": data_str,
        "chess-opening-course.html": assemble(data_str),
        "index.html": read("index.html"),
    }


def check():
    """Fail if docs/ no longer matches the sources, without writing anything."""
    stale = []
    for name, text in outputs().items():
        try:
            with open(os.path.join(DOCS, name), encoding="utf-8") as f:
                current = f.read()
        except FileNotFoundError:
            current = None
        if current != text:
            stale.append(name)
    if stale:
        raise SystemExit("docs/ is stale, run: python3 src/build.py\n  " + "\n  ".join(stale))
    print("docs/ is up to date.")


def main():
    if "--check" in sys.argv:
        check()
        return
    os.makedirs(DOCS, exist_ok=True)
    for name, text in outputs().items():
        with open(os.path.join(DOCS, name), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote docs/{name}", len(text) // 1024, "KB")


if __name__ == "__main__":
    main()

"""Parse a personal notes file into blocks of annotated moves.

The file is prose first. A block opens with a title line ending in a colon, then
runs ordinary move notation with a note in (round brackets) and board marks in
[square brackets], each attaching to the move it follows:

    Open Spanish:
       6. d4 (attacks the centre) [d4-e5]
          b5 (kicks the bishop)   [b5-a4]

Layout is free -- one move to a line, or a whole variation on one -- because a
block is read as a token stream rather than a grid. Move numbers are ignored
wherever they appear, glued to a move or standing alone.

Nothing here touches a board. Which position a note lands on is build.py's job,
deliberately: keyed by position rather than by ply, one authored sentence
attaches to every line, deep dive and deviation that reaches it.
"""
import re

TOKEN = re.compile(r"\(([^)]*)\)|\[([^\]]*)\]|(\S+)")
MOVE_NUMBER = re.compile(r"^\d+\.*")
ARROW = re.compile(r"^([a-h][1-8])-([a-h][1-8])$")
SPOT = re.compile(r"^!([a-h][1-8])$")


def parse_notes(text, where):
    """Return (blocks, errors). A block is {title, at, items}, an item {san, at,
    text?, arrows?, spots?}."""
    errors = []
    blocks = []
    current = None

    for n, raw in enumerate(text.splitlines(), 1):
        # Whole-line comments only: a bare '#' mid-line is checkmate, and a notes
        # file is exactly where someone writes one.
        if raw.lstrip().startswith("#"):
            continue
        line = raw.strip()
        if not line:
            continue
        if line.endswith(":"):
            current = {"title": line[:-1].strip(), "at": n, "lines": []}
            blocks.append(current)
            continue
        if current is None:
            errors.append(f"{where} line {n}: moves before any title "
                          f"(a block opens with a name ending in ':')")
            continue
        current["lines"].append((n, raw))

    for block in blocks:
        block["items"] = _read_block(block, where, errors)
        del block["lines"]
    return blocks, errors


def _read_block(block, where, errors):
    body = "\n".join(text for _, text in block["lines"])
    starts = [n for n, _ in block["lines"]]
    name = f"{where} '{block['title']}'"

    # A note may wrap across lines, so the tokeniser reads the whole block at
    # once and an unclosed bracket would swallow the rest of it silently.
    if body.count("(") != body.count(")") or body.count("[") != body.count("]"):
        errors.append(f"{name}: unbalanced ( ) or [ ] brackets")
        return []

    def line_of(pos):
        return starts[body.count("\n", 0, pos)] if starts else block["at"]

    items = []
    for match in TOKEN.finditer(body):
        note, marks, word = match.groups()
        at = line_of(match.start())

        if word is not None:
            san = MOVE_NUMBER.sub("", word)
            if san:
                items.append({"san": san, "at": at})
            continue

        if not items:
            errors.append(f"{name} line {at}: a note before any move")
            continue

        if note is not None:
            if "text" in items[-1]:
                errors.append(f"{name} line {at}: a second note on '{items[-1]['san']}'")
                continue
            items[-1]["text"] = " ".join(note.split())
            continue

        arrows, spots = parse_marks(marks, f"{name} line {at}", errors)
        if arrows:
            items[-1].setdefault("arrows", []).extend(arrows)
        if spots:
            items[-1].setdefault("spots", []).extend(spots)
    return items


def parse_marks(text, where, errors):
    """Return (arrows, spots) from one [...] group. `e2-e4` draws, `!e4` circles."""
    arrows, spots = [], []
    for token in text.replace(",", " ").split():
        arrow = ARROW.match(token)
        if arrow:
            if arrow.group(1) == arrow.group(2):
                errors.append(f"{where}: mark '{token}' points a square at itself")
            else:
                arrows.append({"f": arrow.group(1), "t": arrow.group(2)})
            continue
        spot = SPOT.match(token)
        if spot:
            spots.append(spot.group(1))
            continue
        errors.append(f"{where}: mark '{token}' is not an arrow (e2-e4) or a spot (!e4)")
    return arrows, spots

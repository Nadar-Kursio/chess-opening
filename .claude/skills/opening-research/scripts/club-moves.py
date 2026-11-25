#!/usr/bin/env python3
"""Count what club players play in every position a course's opponent moves in.

    .venv/bin/python3 .claude/skills/opening-research/scripts/club-moves.py london
    .venv/bin/python3 .claude/skills/opening-research/scripts/club-moves.py london queensgambit ruylopez

The trainer's sparring partner picks its moves from this: in proportion to how
often 1200-2000 rated Lichess players chose each one, including the moves the
course has no answer to, which is how the learner finds out where their prep
ends. The positions are the ones the course reaches (chapters, deviations and the
sidelines in src/content/sidelines/), so the result is small enough to commit.

The counts come from the Lichess explorer (_lichess.Club), a position at a time and cached, so
this takes seconds once sidelines.py has asked about the same positions: every game in the
course's window of months, whatever move order reached the position. The window is the one the
course's committed file names, kept so a regenerated file never mixes in a newer month;
CLUB_MONTHS=2026-11 moves it on (then re-run sidelines.py, position-evals.py,
move-verdicts.py and exits.py, as after any content edit).

Writes src/content/club/<opening>.json for each opening named: every position the
opponent moves in, with the club count of every move played there. A position
listed with no moves is one nobody in the window reached. `scanned` is every game in
the window and `games` the ones that reach the position all the course's chapters
share. Generated: never edit it, re-run this after editing a covered opening (after
sidelines.py). Lichess's database is CC0.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _course import club_header, club_window            # noqa: E402
from _engine import ROOT                                # noqa: E402
from _lichess import Club                               # noqa: E402


def sequences(op, sidelines):
    """Every move sequence the course plays, each with the colour the learner has in it."""
    orientation = chess.WHITE if op["orientation"] == "white" else chess.BLACK
    out = []
    for line in op["lines"] + ([op["deep"]] if op.get("deep") else []):
        side = line.get("side", op["orientation"])
        out.append((chess.WHITE if side == "white" else chess.BLACK, line["moves"].split()))
    for prefix, entries in (op.get("branches") or {}).items():
        base = prefix.split()
        if len(base) % 2 == (0 if orientation == chess.WHITE else 1):
            continue            # the learner's own alternatives: the opponent never plays them
        for br in entries:
            out.append((orientation, base + [br["san"]] + br.get("line", "").split()))
    for item in sidelines:
        if item.get("line"):
            out.append((orientation, item["moves"].split() + [item["reply"]] + item["line"].split()))
    return out


def tree(op, sidelines):
    """The positions the opponent moves in, and every position the course reaches.

    Not the starting position: the stream is filtered on the first moves the courses play, so
    a count there would only say which courses were in the run."""
    asked, known, depth = set(), set(), 0
    for learner, sans in sequences(op, sidelines):
        board = chess.Board()
        for san in sans:
            known.add(board.epd())
            if board.turn != learner:
                asked.add(board.epd())
            board.push_san(san)
        known.add(board.epd())
        if board.turn != learner:
            asked.add(board.epd())
        depth = max(depth, len(sans) + 1)
    asked.discard(chess.Board().epd())
    return asked, known, depth


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("openings", nargs="+")
    args = ap.parse_args()

    from importlib import import_module
    generated = time.strftime("%Y-%m-%d", time.gmtime())
    for op_id in args.openings:
        started = time.time()
        op = import_module(f"content.openings.{op_id}").OPENING
        path = os.path.join(ROOT, "src", "content", "sidelines", f"{op_id}.json")
        sidelines = []
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                sidelines = json.load(f)["sidelines"]
        asked, _, _ = tree(op, sidelines)
        club = Club(*club_window(op_id))
        counts = {epd: club.get(epd) or {} for epd in sorted(asked)}
        header = club_header(op_id, club)
        target = os.path.join(ROOT, "src", "content", "club", f"{op_id}.json")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        body = ",\n".join(
            f"    {json.dumps(epd)}: {json.dumps(dict(sorted(moves.items(), key=lambda kv: -kv[1])), separators=(',', ':'))}"
            for epd, moves in counts.items())
        with open(target, "w", encoding="utf-8") as f:
            f.write(f'{{\n  "source": {json.dumps(header["source"])},\n  "window": {json.dumps(header["window"])},\n'
                    f'  "generated": "{generated}",\n  "scanned": {header["scanned"]},\n  "games": {header["games"]},\n'
                    f'  "elo": {json.dumps(header["elo"])},\n  "positions": {{\n{body}\n  }}\n}}\n')
        reached = sum(1 for moves in counts.values() if moves)
        print(f"wrote {os.path.relpath(target, ROOT)}: {reached} of {len(asked)} positions reached, "
              f"{club.asked} asked of the explorer, {int(time.time() - started)} s")


if __name__ == "__main__":
    main()

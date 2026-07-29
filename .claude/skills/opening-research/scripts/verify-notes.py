#!/usr/bin/env python3
"""Show which move every authored note actually lands on.

    .venv/bin/python3 .claude/skills/opening-research/scripts/verify-notes.py ruylopez

Covers lines, the deep dive and the model games. Notes are keyed by ply, games
are 80-odd plies long, and a note one ply out reads as a confident description of
a move nobody played -- which is exactly what happened to three notes in the
Kasparov-Kramnik game before this script existed.

Needs no engine: read the right-hand column and check each sentence describes the
move printed next to it.
"""
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import chess                                       # noqa: E402
from _engine import numbered, opening              # noqa: E402


def walk(label, moves, notes):
    board = chess.Board()
    sans = moves.split()
    print(f"\n--- {label}  ({len(sans)} plies)")
    for ply, san in enumerate(sans, 1):
        board.push_san(san)
        if ply in notes:
            print(f"   note {ply:3d} -> {numbered(ply, san):14s} | {notes[ply][:78]}")
    for ply in sorted(notes):
        if not 1 <= ply <= len(sans):
            print(f"   !! note {ply} is outside the line ({len(sans)} plies)")


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: verify-notes.py <opening-id>")
    op = opening(sys.argv[1])
    for line in op["lines"]:
        walk(line["name"], line["moves"], line["notes"])
    walk("DEEP " + op["deep"]["name"], op["deep"]["moves"], op["deep"]["notes"])
    for game in op.get("games") or []:
        walk("GAME " + game["id"], game["moves"], game.get("notes") or {})


if __name__ == "__main__":
    main()

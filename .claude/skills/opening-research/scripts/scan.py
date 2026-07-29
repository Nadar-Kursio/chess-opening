#!/usr/bin/env python3
"""Rank candidate replies to a position, before you write anything about them.

    .venv/bin/python3 .claude/skills/opening-research/scripts/scan.py \
        "e4 e5 Nf3 Nc6 Bb5" a6 Nf6 f5 Bc5 d6 Nd4 Nge7 g6

    # or a whole session's worth, one position per line, moves after a colon:
    … scan.py --file positions.txt

Output is one row per candidate: the eval after it and the engine's principal
variation, which is where the `line` for a branch usually comes from. Sort order
is the order you passed them, so the main move first makes the comparison easy.
"""
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _engine import board_after, open_engine, score      # noqa: E402


def positions(argv):
    if "--file" in argv:
        path = argv[argv.index("--file") + 1]
        with open(path, encoding="utf-8") as f:
            for raw in f:
                raw = raw.strip()
                if raw and not raw.startswith("#"):
                    prefix, _, moves = raw.partition(":")
                    yield prefix.strip(), moves.split()
        return
    args = [a for a in argv if not a.startswith("--")]
    if len(args) < 2:
        raise SystemExit('usage: scan.py "<san prefix>" <move> [<move>…]   |   scan.py --file <path>')
    yield args[0], args[1:]


def main():
    with open_engine() as eng:
        for prefix, candidates in positions(sys.argv[1:]):
            base = board_after(prefix)
            here, pv = score(eng, base)
            print(f"\n=== after {prefix}   [{here:+5d}, engine likes {pv}]")
            for san in candidates:
                board = base.copy()
                try:
                    board.push_san(san)
                except Exception as e:
                    print(f"   {san:8s} ILLEGAL — {e}")
                    continue
                after, line = score(eng, board)
                print(f"   {san:8s} {after:+6d}  {line}")


if __name__ == "__main__":
    main()

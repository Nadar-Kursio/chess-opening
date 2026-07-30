#!/usr/bin/env python3
"""Rank candidate replies to a position, before you write anything about them.

    .venv/bin/python3 .claude/skills/opening-research/scripts/scan.py \
        "e4 e5 Nf3 Nc6 Bb5" a6 Nf6 f5 Bc5 d6 Nd4 Nge7 g6

    # or a whole session's worth, one position per line, moves after a colon:
    … scan.py --file positions.txt

Output is one row per candidate: the eval after it and the engine's principal
variation, which is where the `line` for a branch usually comes from. Sort order
is the order you passed them, so the main move first makes the comparison easy.

A row shows `Bxd4 -> Bd4` when the move you typed is not how the position writes
it. python-chess accepts a spurious capture marker, a missing check marker and
loose disambiguation, so `Bxd4` on an empty d4 is parsed, analysed and reported
without complaint -- an eval for a move you did not ask about.
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
            # One unplayable prefix must not drop the rest of a --file batch. It
            # has, twice, and each time it cost a re-run of everything after it.
            try:
                base = board_after(prefix)
            except ValueError as e:
                print(f"\n=== after {prefix}\n    SKIPPED — {e}", flush=True)
                continue
            here, pv = score(eng, base)
            print(f"\n=== after {prefix}   [{here:+5d}, engine likes {pv}]", flush=True)
            for san in candidates:
                board = base.copy()
                try:
                    move = board.parse_san(san)
                except Exception as e:
                    print(f"   {san:8s} ILLEGAL — {e}", flush=True)
                    continue
                canonical = board.san(move)
                board.push(move)
                after, line = score(eng, board)
                shown = san if canonical == san else f"{san} -> {canonical}"
                print(f"   {shown:16s} {after:+6d}  {line}", flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Count what master games actually did from a position, so a `record` is never guessed.

    explorer.py "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5"
    explorer.py --file positions.txt --top 8

Each position prints how many master games reached it, how they finished, the
replies played from it and the best-known games there. The score line is the one
a line's `record` key ships: White wins / draws / Black wins, as percentages of
the games that got there, whole numbers adding up to exactly 100.

The games are the Lichess masters explorer's: over-the-board games between
players rated 2200 and up, a position at a time (_lichess.Masters, cached under
.engine/lichess/). Positions are matched by EPD, so a game that transposes into
the position is counted. A game id it lists prints as PGN with
`dossier.py --pgn <id>`, which is how a model game is taken from real moves.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import chess                                        # noqa: E402
except ModuleNotFoundError:
    raise SystemExit("run this under the project venv: .venv/bin/python3 "
                     ".claude/skills/opening-research/scripts/explorer.py …")
from _lichess import Masters                            # noqa: E402


def epd_of(prefix):
    board = chess.Board()
    for san in prefix.split():
        board.push_san(san)
    return board.epd()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("positions", nargs="*", help="SAN prefixes, e.g. \"e4 e5 Nf3 Nc6 Bb5\"")
    p.add_argument("--file", help="one SAN prefix per line; # comments and blanks ignored")
    p.add_argument("--top", type=int, default=6, help="replies to list per position")
    p.add_argument("--games", type=int, default=3, help="best-known games to list per position")
    args = p.parse_args()

    prefixes = list(args.positions)
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            prefixes += [ln.split("#")[0].strip() for ln in f]
    prefixes = [x for x in prefixes if x]
    if not prefixes:
        raise SystemExit("nothing to look up — pass a SAN prefix or --file")

    masters = Masters()
    print(f"{len(prefixes)} position(s), from the {masters.source}", file=sys.stderr)
    for prefix in prefixes:
        try:
            epd = epd_of(prefix)
        except Exception as e:
            raise SystemExit(f"'{prefix}' is not playable: {e}")
        row = masters.lookup(epd)
        record = masters.record(epd, len(prefix.split()))
        print(f"\n{prefix}")
        if not record:
            print("  no master games reached this position")
            continue
        games = record["games"]
        print(f"  {games} games — white {record['white']}%  draw {record['draw']}%  black {record['black']}%  "
              f"(white scores {100 * (row['white'] + row['draws'] / 2) / games:.1f}%)")
        print(f'  "record": {{"at": {record["at"]}, "games": {games}, '
              f'"white": {record["white"]}, "draw": {record["draw"]}, "black": {record["black"]}}},')
        for san, w, d, b in row["moves"][:args.top]:
            n = w + d + b
            print(f"    {san:6s} {n:6d}  {100 * n / games:4.1f}%")
        for g in row["games"][:args.games]:
            print(f"    game {g['id']}  {g['white']} - {g['black']}, {g['year']} ({g['result']})")


if __name__ == "__main__":
    main()

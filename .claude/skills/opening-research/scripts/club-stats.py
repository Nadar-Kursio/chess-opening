#!/usr/bin/env python3
"""Count what club players actually play, from a Lichess monthly database.

    curl -s https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
      | zstd -dc | .venv/bin/python3 .claude/skills/opening-research/scripts/club-stats.py \
        london --first d4 --must Bf4 --seconds 1200

pgnmentor's archives are master games and carry the win bars. This is the other
half of the question: what the learner's opponents will really play. It streams
and stops early, because a month is 30GB compressed and a sample answers it.

Writes .engine/club/<opening>.json (gitignored), a count of every reply from
every position, matched by position so transpositions add up. sidelines.py reads
it. Lichess's database is CC0.
"""
import argparse
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from collections import Counter, defaultdict            # noqa: E402
from _engine import ROOT                                # noqa: E402

STRIP = re.compile(r"\{[^}]*\}|\d+\.+|\$\d+|[?!]+")
RESULTS = {"1-0", "0-1", "1/2-1/2", "*"}
PLIES = 18


def key(board):
    return board.epd()


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--first", required=True, help="White's first move, as SAN")
    ap.add_argument("--must", required=True, help="a move White plays by move three, as SAN")
    ap.add_argument("--low", type=int, default=1200)
    ap.add_argument("--high", type=int, default=2000)
    ap.add_argument("--seconds", type=int, default=1200)
    ap.add_argument("--month", default="unknown")
    args = ap.parse_args()

    opening = f"1. {args.first}"
    counts = defaultdict(Counter)
    scanned = kept = 0
    white = black = ""
    excluded = False
    started = time.time()
    for raw in sys.stdin:
        if raw.startswith("["):
            if raw.startswith("[Event"):
                excluded = "Bullet" in raw or "Correspondence" in raw
            elif raw.startswith("[WhiteElo"):
                white = raw.split('"')[1]
            elif raw.startswith("[BlackElo"):
                black = raw.split('"')[1]
            continue
        if not raw.startswith("1."):
            continue
        scanned += 1
        if scanned % 200000 == 0 and time.time() - started > args.seconds:
            break
        if excluded or not raw.startswith(opening):
            continue
        try:
            if not (args.low <= int(white) <= args.high and args.low <= int(black) <= args.high):
                continue
        except ValueError:
            continue
        moves = STRIP.sub(" ", raw).split()[:PLIES]
        if args.must not in moves[:5:2]:
            continue
        kept += 1
        board = chess.Board()
        for san in moves:
            if san in RESULTS:
                break
            try:
                move = board.parse_san(san)
            except ValueError:
                break
            counts[key(board)][board.san(move)] += 1
            board.push(move)

    out = os.path.join(ROOT, ".engine", "club", f"{args.opening}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"source": f"Lichess rated games, {args.month}", "scanned": scanned, "games": kept,
                   "elo": [args.low, args.high],
                   "positions": {k: dict(v) for k, v in counts.items() if sum(v.values()) >= 3}}, f)
    print(f"scanned {scanned} games, kept {kept}, wrote {out}")


if __name__ == "__main__":
    main()

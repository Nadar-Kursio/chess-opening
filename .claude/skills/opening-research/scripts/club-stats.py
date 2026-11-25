#!/usr/bin/env python3
"""Count what club players actually play, from a Lichess monthly database.

    curl -s https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
      | zstd -dc | nice -n 19 .venv/bin/python3 .claude/skills/opening-research/scripts/club-stats.py \
        jobava --first d4 --must Nc3 --must Bf4 --month "October 2026"

pgnmentor's archives are master games and carry the win bars. This is the other
half of the question: what the learner's opponents will really play. It streams
and stops early, because a month is 30GB compressed and a sample answers it.

Which games count: the first move is --first, and the side the course plays
(--side, or the course's orientation once its module exists) plays every --must
within its first --by moves, in any order. So the London is `--first d4 --must
Bf4`, the Jobava London `--first d4 --must Nc3 --must Bf4`, and a Black course
names Black's moves: the Caro-Kann is `--first e4 --must c6 --side black`. With no
--first the course's own first move is used, so an existing course needs only its id.

It also lists the Lichess accounts with the most games in the sample from the course's chair
(public usernames, kept in the gitignored file only): somebody whose games will import into the
trainer and walk the course, for checking "Your games" before shipping.

Writes .engine/club/<opening>.json (gitignored), a count of every reply from
every position in the first --plies, matched by position so transpositions add
up. sidelines.py, coverage.py and trap-scan.py read it. Lichess's database is CC0.
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


def key(board):
    return board.epd()


def course_defaults(opening):
    """The course's first move and side, when its module exists yet."""
    try:
        from importlib import import_module
        op = import_module(f"content.openings.{opening}").OPENING
    except ModuleNotFoundError:
        return None, None
    firsts = {line["moves"].split()[0] for line in op["lines"]}
    return (firsts.pop() if len(firsts) == 1 else None), op["orientation"]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--first", help="White's first move, as SAN (default: the course's)")
    ap.add_argument("--must", action="append", default=[],
                    help="a move the course's side plays within its first --by moves, as SAN; repeatable")
    ap.add_argument("--side", choices=("white", "black"), help="the side --must moves are played by "
                    "(default: the course's orientation, else white)")
    ap.add_argument("--by", type=int, default=3, help="how many of that side's moves --must may take")
    ap.add_argument("--plies", type=int, default=20, help="how deep to count, in plies")
    ap.add_argument("--low", type=int, default=1200)
    ap.add_argument("--high", type=int, default=2000)
    ap.add_argument("--seconds", type=int, default=1200, help="stop reading the stream after this long")
    ap.add_argument("--month", default="unknown")
    args = ap.parse_args()

    first, orientation = course_defaults(args.opening)
    first = args.first or first
    if not first:
        raise SystemExit("--first is required until the course's module exists")
    side = args.side or orientation or "white"
    offset = 0 if side == "white" else 1
    opening = f"1. {first} "
    print(f"counting games starting 1.{first}"
          + (f" where {side} plays {', '.join(args.must)} within its first {args.by} moves" if args.must else ""),
          flush=True)

    counts = defaultdict(Counter)
    players = Counter()
    scanned = kept = 0
    white = black = ""
    names = ["", ""]
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
            elif raw.startswith("[White "):
                names[0] = raw.split('"')[1]
            elif raw.startswith("[Black "):
                names[1] = raw.split('"')[1]
            continue
        if not raw.startswith("1."):
            continue
        scanned += 1
        if scanned % 200000 == 0:
            print(f"  {scanned} scanned, {kept} kept, {int(time.time() - started)} s", flush=True)
            if time.time() - started > args.seconds:
                break
        if excluded or not raw.startswith(opening):
            continue
        try:
            if not (args.low <= int(white) <= args.high and args.low <= int(black) <= args.high):
                continue
        except ValueError:
            continue
        moves = STRIP.sub(" ", raw).split()[:args.plies]
        theirs = moves[offset:2 * args.by:2]
        if any(m not in theirs for m in args.must):
            continue
        kept += 1
        players[names[offset]] += 1
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
                   "elo": [args.low, args.high], "players": dict(players.most_common(20)),
                   "positions": {k: dict(v) for k, v in counts.items() if sum(v.values()) >= 3}}, f)
    print(f"scanned {scanned} games, kept {kept}, {int(time.time() - started)} s, wrote {out}")
    print(f"most games in it from {side}'s chair (Lichess accounts, for checking game import): "
          + ", ".join(f"{name} {n}" for name, n in players.most_common(10)))


if __name__ == "__main__":
    main()

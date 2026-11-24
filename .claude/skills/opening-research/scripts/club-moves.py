#!/usr/bin/env python3
"""Count what club players play in every position a course's opponent moves in.

    curl -s https://database.lichess.org/standard/lichess_db_standard_rated_2026-10.pgn.zst \
      | zstd -dc | nice -n 19 .venv/bin/python3 .claude/skills/opening-research/scripts/club-moves.py \
        london queensgambit ruylopez sicilian scandinavian --games 12000000 --month "October 2026"

The trainer's sparring partner picks its moves from this: in proportion to how
often 1200-2000 rated Lichess players chose each one, including the moves the
course has no answer to, which is how the learner finds out where their prep
ends. club-stats.py counts every position in the first moves for sidelines.py;
this counts only the positions the course reaches (chapters, deviations and the
sidelines in src/content/sidelines/), so several openings share one pass of the
stream and the result is small enough to commit.

A game is replayed while it stays in some course's tree, and a few plies past
that, so a transposition back in is counted. Matching is by position.

Writes src/content/club/<opening>.json for each opening named: every position the
opponent moves in, with the club count of every move played there. A position
listed with no moves is one the sample never reached. `scanned` is the games read
from the stream and `games` the ones that reached a position of that course. Generated: never edit it,
re-run this after editing a covered opening (after sidelines.py). Lichess's
database is CC0.
"""
import argparse
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _engine import ROOT                                # noqa: E402

STRIP = re.compile(r"\{[^}]*\}|\d+\.+|\$\d+|[?!]+")
RESULTS = {"1-0", "0-1", "1/2-1/2", "*"}
# Plies a game is followed after it leaves every course's tree.
SLACK = 3


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
    ap.add_argument("--low", type=int, default=1200)
    ap.add_argument("--high", type=int, default=2000)
    ap.add_argument("--games", type=int, default=12_000_000, help="stop after scanning this many games")
    ap.add_argument("--month", default="unknown")
    args = ap.parse_args()

    from importlib import import_module
    asked_by = {}
    known = set()
    depth = 0
    firsts = set()
    for op_id in args.openings:
        op = import_module(f"content.openings.{op_id}").OPENING
        path = os.path.join(ROOT, "src", "content", "sidelines", f"{op_id}.json")
        sidelines = []
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                sidelines = json.load(f)["sidelines"]
        asked, reached, longest = tree(op, sidelines)
        asked_by[op_id] = asked
        known |= reached
        depth = max(depth, longest)
        firsts |= {line["moves"].split()[0] for line in op["lines"]}
    every_asked = set().union(*asked_by.values())
    starts = tuple(f"1. {san} " for san in firsts)
    print(f"{len(every_asked)} positions to count, games followed up to ply {depth}", flush=True)

    counts = defaultdict(Counter)
    games = Counter()
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
        if scanned % 500_000 == 0:
            print(f"  {scanned} scanned, {kept} followed, {int(time.time() - started)} s", flush=True)
        if scanned >= args.games:
            break
        if excluded or not raw.startswith(starts):
            continue
        try:
            if not (args.low <= int(white) <= args.high and args.low <= int(black) <= args.high):
                continue
        except ValueError:
            continue
        kept += 1
        board = chess.Board()
        outside = 0
        touched = set()
        for san in STRIP.sub(" ", raw).split()[:depth]:
            if san in RESULTS:
                break
            epd = board.epd()
            if epd in every_asked:
                counts[epd][san] += 1
                touched.add(epd)
            if epd in known:
                outside = 0
            else:
                outside += 1
                if outside > SLACK:
                    break
            try:
                board.push_san(san)
            except ValueError:
                break
        for op_id, asked in asked_by.items():
            if touched & asked:
                games[op_id] += 1

    generated = time.strftime("%Y-%m-%d", time.gmtime())
    for op_id, asked in asked_by.items():
        target = os.path.join(ROOT, "src", "content", "club", f"{op_id}.json")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        body = ",\n".join(
            f"    {json.dumps(epd)}: {json.dumps(dict(counts[epd].most_common()), separators=(',', ':'))}"
            for epd in sorted(asked))
        reached = sum(1 for epd in asked if counts[epd])
        with open(target, "w", encoding="utf-8") as f:
            f.write(f'{{\n  "source": {json.dumps(f"Lichess rated games, {args.month}")},\n'
                    f'  "generated": "{generated}",\n  "scanned": {scanned},\n  "games": {games[op_id]},\n'
                    f'  "elo": [{args.low}, {args.high}],\n  "positions": {{\n{body}\n  }}\n}}\n')
        print(f"wrote {os.path.relpath(target, ROOT)}: {games[op_id]} games, "
              f"{reached} of {len(asked)} positions reached")
    print(f"scanned {scanned} games, followed {kept}, {int(time.time() - started)} s")


if __name__ == "__main__":
    main()

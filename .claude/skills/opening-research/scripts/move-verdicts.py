#!/usr/bin/env python3
"""Score every legal move from every position the learner is asked to move from.

    .venv/bin/python3 .claude/skills/opening-research/scripts/move-verdicts.py london --depth 16

Writes src/content/verdicts/<opening>.json, which is how a wrong move gets a real
answer ("that drops from +0.21 to -0.69") and not just "not the course move".
The browser computes no chess, so this has to be done ahead of time, and it is a
search per legal move. Searches are cached in .engine/verdict-cache.json, so a
re-run after a content edit only pays for new positions.

Re-run after editing any line, deviation or sideline of a covered opening. A
position with no entry just falls back to the plain wrong-move message.

The depth is lower than the eval bar's on purpose: these numbers are compared
with each other to rank one position's moves, and this is thirty times the work.
"""
import argparse
import json
import multiprocessing
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
import chess.engine                                     # noqa: E402
from _engine import ROOT, engine_path                   # noqa: E402

MATE = 10000
CACHE = os.path.join(ROOT, ".engine", "verdict-cache.json")


def asked_positions(op, sidelines):
    learner = chess.WHITE if op["orientation"] == "white" else chess.BLACK
    found = {}

    def walk(board, sans):
        for san in sans:
            if board.turn == learner:
                found[board.epd()] = True
            board.push_san(san)
        if board.turn == learner:
            found[board.epd()] = True

    for line in op["lines"] + ([op["deep"]] if op.get("deep") else []):
        walk(chess.Board(), line["moves"].split())
    for prefix, entries in (op.get("branches") or {}).items():
        base = chess.Board()
        for san in prefix.split():
            base.push_san(san)
        if base.turn == learner:
            continue            # the learner's own alternatives are never asked
        for br in entries:
            walk(base.copy(), [br["san"]] + br.get("line", "").split())
    for item in sidelines:
        if item.get("line"):
            walk(chess.Board(), item["moves"].split() + [item["reply"]] + item["line"].split())
    return list(found)


ENGINE = None


def score_position(job):
    global ENGINE
    epd, depth = job
    if ENGINE is None:
        ENGINE = chess.engine.SimpleEngine.popen_uci(engine_path())
        ENGINE.configure({"Threads": 1, "Hash": 128})
    board = chess.Board(epd + " 0 1")
    out = {}
    for move in board.legal_moves:
        if move.promotion not in (None, chess.QUEEN):
            continue
        san = board.san(move)
        board.push(move)
        info = ENGINE.analyse(board, chess.engine.Limit(depth=depth))
        white = info["score"].white()
        record = [san, white.score(mate_score=MATE)]
        if white.mate() is not None:
            record.append(white.mate())
        out[chess.square_name(move.from_square) + chess.square_name(move.to_square)] = record
        board.pop()
    return epd, out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--depth", type=int, default=16)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--limit", type=int, help="stop after this many new positions, to time a run")
    args = ap.parse_args()

    from importlib import import_module
    op = import_module(f"content.openings.{args.opening}").OPENING
    sidelines = []
    path = os.path.join(ROOT, "src", "content", "sidelines", f"{args.opening}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            sidelines = json.load(f)["sidelines"]

    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            cache = json.load(f)
    wanted = asked_positions(op, sidelines)
    todo = [epd for epd in wanted if f"{epd}|{args.depth}" not in cache]
    print(f"{len(wanted)} positions, {len(todo)} to search at depth {args.depth}", flush=True)
    if args.limit:
        todo = todo[:args.limit]

    started = time.time()
    if todo:
        with multiprocessing.Pool(args.workers) as pool:
            for i, (epd, out) in enumerate(pool.imap_unordered(score_position, [(e, args.depth) for e in todo]), 1):
                cache[f"{epd}|{args.depth}"] = out
                if i % 10 == 0 or i == len(todo):
                    with open(CACHE, "w", encoding="utf-8") as f:
                        json.dump(cache, f)
                    left = (len(todo) - i) * (time.time() - started) / i
                    print(f"  {i}/{len(todo)}, {int(left // 60)} min left", flush=True)
    if args.limit:
        return

    target = os.path.join(ROOT, "src", "content", "verdicts", f"{args.opening}.json")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    name = "Stockfish"
    eng = chess.engine.SimpleEngine.popen_uci(engine_path())
    name = eng.id.get("name", name)
    eng.quit()
    body = ",\n".join(f"    {json.dumps(epd)}: {json.dumps(cache[f'{epd}|{args.depth}'], separators=(',', ':'), ensure_ascii=False)}"
                      for epd in sorted(wanted))
    with open(target, "w", encoding="utf-8") as f:
        f.write(f'{{\n  "engine": {json.dumps(name)},\n  "depth": {args.depth},\n'
                f'  "generated": "{time.strftime("%Y-%m-%d", time.gmtime())}",\n  "positions": {{\n{body}\n  }}\n}}\n')
    print(f"wrote {os.path.relpath(target, ROOT)}, {os.path.getsize(target) // 1024} KB")


if __name__ == "__main__":
    main()

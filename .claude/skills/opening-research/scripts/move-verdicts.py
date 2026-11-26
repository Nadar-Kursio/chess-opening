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

TWO PASSES

Most legal moves in an opening position lose material outright, and a depth-16 search of each
is most of the cost. So every move is screened at --screen depth first, and only the moves the
screen puts within MARGIN of a blunder's cost (BLUNDER + MARGIN behind the screen's best) are
searched again at --depth. Those are every move that could be fine, an inaccuracy or a borderline
blunder, so every band the trainer shows is settled at full depth; a move the screen already has
five pawns behind keeps the screen's number, which can move a little but never out of its band.
`--compare N` re-scores N positions the cache holds from a full search and reports any move
whose band differs, which is how the margin was chosen.
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
BLUNDER = 300       # engine/marks.py's bands, as the build applies them to these scores
INACCURACY = 50
DECIDED = 250
MARGIN = 200
CACHE = os.path.join(ROOT, ".engine", "verdict-cache.json")


def asked_positions(op, sidelines):
    """From each chair the course has a chapter for: a trap course teaches the dodge from the other side."""
    found = {}
    lines = op["lines"] + ([op["deep"]] if op.get("deep") else [])
    for side in dict.fromkeys(line.get("side", op["orientation"]) for line in lines):
        learner = chess.WHITE if side == "white" else chess.BLACK
        reached = set()

        def walk(board, sans):
            for san in sans:
                reached.add(board.epd())
                if board.turn == learner:
                    found[board.epd()] = True
                board.push_san(san)
            reached.add(board.epd())
            if board.turn == learner:
                found[board.epd()] = True

        for line in lines:
            if line.get("side", op["orientation"]) == side:
                walk(chess.Board(), line["moves"].split())
        for prefix, entries in (op.get("branches") or {}).items():
            base = chess.Board()
            for san in prefix.split():
                base.push_san(san)
            if base.turn == learner or base.epd() not in reached:
                continue        # the learner's own alternatives are never asked, nor another chair's deviations
            for br in entries:
                walk(base.copy(), [br["san"]] + br.get("line", "").split())
        if side == op["orientation"]:
            for item in sidelines:
                if item.get("line"):
                    walk(chess.Board(), item["moves"].split() + [item["reply"]] + item["line"].split())
    return list(found)


ENGINE = None


def search(board, move, depth):
    board.push(move)
    info = ENGINE.analyse(board, chess.engine.Limit(depth=depth))
    board.pop()
    white = info["score"].white()
    record = [board.san(move), white.score(mate_score=MATE)]
    if white.mate() is not None:
        record.append(white.mate())
    return record


def score_position(job):
    global ENGINE
    epd, depth, screen = job
    if ENGINE is None:
        ENGINE = chess.engine.SimpleEngine.popen_uci(engine_path())
        ENGINE.configure({"Threads": 1, "Hash": 128})
    board = chess.Board(epd + " 0 1")
    sign = 1 if board.turn == chess.WHITE else -1
    moves = {chess.square_name(m.from_square) + chess.square_name(m.to_square): m for m in board.legal_moves
             if m.promotion in (None, chess.QUEEN)}
    out = {uci: search(board, move, screen) for uci, move in moves.items()} if screen else {}
    best = max((sign * r[1] for r in out.values()), default=0)
    for uci, move in moves.items():
        if not screen or best - sign * out[uci][1] < BLUNDER + MARGIN:
            out[uci] = search(board, move, depth)
    return epd, out


def band(moves, sign):
    """The build's severity for each move (src/build.py move_verdicts)."""
    best = max(sign * m[1] for m in moves.values())
    return {uci: "b" if best - sign * m[1] >= BLUNDER else
            "i" if best - sign * m[1] >= INACCURACY and best > -DECIDED else "g" for uci, m in moves.items()}


def compare(cache, depth, screen, count, workers):
    """Tiered against full searches the cache already holds: how often a band changes."""
    full = dict(list((k.split("|")[0], v) for k, v in cache.items() if k.endswith(f"|{depth}"))[:count])
    print(f"re-scoring {len(full)} positions with a depth-{screen} screen", flush=True)
    started = time.time()
    moved = total = 0
    with multiprocessing.Pool(workers) as pool:
        for epd, out in pool.imap_unordered(score_position, [(e, depth, screen) for e in full]):
            reference = full[epd]
            sign = 1 if chess.Board(epd + " 0 1").turn == chess.WHITE else -1
            want, got = band(reference, sign), band(out, sign)
            for uci in want:
                total += 1
                if want[uci] != got.get(uci):
                    moved += 1
                    print(f"  {epd}  {reference[uci][0]}: full {want[uci]} {reference[uci][1]}, "
                          f"tiered {got.get(uci)} {out[uci][1]}")
    print(f"{moved} of {total} moves changed band; {int(time.time() - started)} s for {len(full)} positions")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--depth", type=int, default=16)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--screen", type=int, default=10, help="depth of the first pass over every move (0: none)")
    ap.add_argument("--limit", type=int, help="stop after this many new positions, to time a run")
    ap.add_argument("--compare", type=int, metavar="N", help="check the screen on N fully searched positions")
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
    if args.compare:
        compare(cache, args.depth, args.screen, args.compare, args.workers)
        return
    wanted = asked_positions(op, sidelines)
    todo = [epd for epd in wanted if f"{epd}|{args.depth}" not in cache]
    print(f"{len(wanted)} positions, {len(todo)} to search at depth {args.depth}", flush=True)
    if args.limit:
        todo = todo[:args.limit]

    started = time.time()
    if todo:
        with multiprocessing.Pool(args.workers) as pool:
            for i, (epd, out) in enumerate(pool.imap_unordered(score_position, [(e, args.depth, args.screen) for e in todo]), 1):
                cache[f"{epd}|{args.depth}"] = out
                if i % 10 == 0 or i == len(todo):
                    with open(f"{CACHE}.{os.getpid()}.tmp", "w", encoding="utf-8") as f:
                        json.dump(cache, f)
                    os.replace(f"{CACHE}.{os.getpid()}.tmp", CACHE)
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

#!/usr/bin/env python3
"""Score every position one opening reaches, for the eval bar under the board.

    .venv/bin/python3 .claude/skills/opening-research/scripts/position-evals.py ruylopez

Writes src/content/evals/<opening>.json, which the build reads and hangs off each
ply it emits. Nothing here runs during a build: this is an hour or two of engine
time and the build takes half a second.

WHAT IT SCORES

Every distinct position the opening reaches, from all four places a board appears
on the page -- the variations, the deep dive, the continuation of every authored
deviation, and the model games. One number per position, at one depth, so the bar
means the same thing wherever the reader sees it. A page that scored the main
line at depth 20 and a deviation at depth 14 would be inviting a comparison
between two numbers that cannot be compared.

The move-by-move swing is not stored: it is the difference between consecutive
positions, and storing a derived number is how the two of them come to disagree.

KEYED BY POSITION

EPD, like the build's branches and personal notes -- castling rights and the
en-passant square, no move counters. A transposition is the same position and
gets the same score without being searched twice, which is most of why 841
positions come out of 1,038 plies.

RESUMING, AND REGENERATING

Every search is cached under --cache, keyed by position and depth, so a re-run
after a content edit only pays for the positions that are new. Re-run this
whenever a line, a deviation or a game changes: the build warns about positions
it has no score for, and that warning is the only thing that will tell you.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
import chess.engine                                     # noqa: E402
import time                                             # noqa: E402
from _engine import ROOT, engine_path                   # noqa: E402

MATE = 10000


def positions(op, skip):
    """Every position this opening puts on a board, in the order it reaches them.

    A list of (epd, where) rather than a set, so the report can name the first
    place a position turned up. Deduplicated by the caller.

    `skip` names model games to leave out. A game is all-or-nothing -- half a
    scored game is a bar that vanishes at move fifteen, which reads as a bug --
    so a skipped one is recorded in the file and the build leaves it alone.
    Worth skipping when a game runs deep into an endgame: those positions cost
    minutes each to search and the bar says least there, because by then the
    reader can see who is winning.
    """
    out = []

    def walk(board, sans, where):
        for i, san in enumerate(sans, 1):
            try:
                board.push_san(san)
            except Exception as e:
                raise SystemExit(f"{where} ply {i} '{san}': {e}")
            out.append((board.epd(), where))

    out.append((chess.Board().epd(), "the starting position"))
    for line in op["lines"] + [op["deep"]]:
        walk(chess.Board(), line["moves"].split(), f"line '{line['name']}'")

    for prefix, entries in (op.get("branches") or {}).items():
        base = chess.Board()
        for san in prefix.split():
            base.push_san(san)
        for br in entries:
            walk(base.copy(), [br["san"]] + br.get("line", "").split(),
                 f"deviation '{br['san']}' after {prefix}")

    for game in op.get("games") or []:
        if game["id"] in skip:
            continue
        walk(chess.Board(), game["moves"].split(), f"game '{game['id']}'")
    return out


def score(eng, board, depth, cache):
    """One position, in centipawns from White's point of view.

    MultiPV stays at one. The bar answers "how does this position stand", and
    every reply to it having its own number is a different feature at ten times
    the cost -- which is the shape this file replaced.
    """
    key = f"{board.epd()}|{depth}"
    if key in cache:
        return cache[key]
    info = eng.analyse(board, chess.engine.Limit(depth=depth))
    white = info["score"].white()
    out = {"v": white.score(mate_score=MATE)}
    if white.mate() is not None:
        out["n"] = white.mate()
    cache[key] = out
    return out


def write(path, payload, scores):
    """One position per line, so a regenerated file has a readable diff.

    json.dump would either put 841 positions on one line or expand every score
    object across four. This file is regenerated whenever the content moves, and
    a diff nobody can read is a diff nobody checks.
    """
    body = ",\n".join(f"    {json.dumps(epd)}: {json.dumps(scores[epd], separators=(',', ':'))}"
                      for epd in sorted(scores))
    head = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in payload.items())
    with open(path, "w", encoding="utf-8") as f:
        f.write("{\n" + head + ",\n  \"scores\": {\n" + body + "\n  }\n}\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening", help="the opening id, e.g. ruylopez")
    ap.add_argument("--depth", type=int, default=20)
    ap.add_argument("--skip", default="",
                    help="model game ids to leave unscored, comma-separated — "
                         "for games that run deep into an endgame")
    ap.add_argument("--threads", type=int, default=3)
    ap.add_argument("--cache", default=os.path.join(ROOT, ".engine", "eval-cache.json"))
    args = ap.parse_args()

    from importlib import import_module
    op = import_module(f"content.openings.{args.opening}").OPENING

    skip = [s for s in args.skip.split(",") if s]
    known = {g["id"] for g in op.get("games") or []}
    for s in skip:
        if s not in known:
            raise SystemExit(f"--skip names '{s}', which is not a game of {args.opening}")
    wanted = positions(op, skip)
    order, first = [], {}
    for epd, where in wanted:
        if epd not in first:
            first[epd] = where
            order.append(epd)
    print(f"{len(wanted)} plies, {len(order)} distinct positions", flush=True)

    cache = {}
    if os.path.exists(args.cache):
        with open(args.cache, encoding="utf-8") as f:
            cache = json.load(f)

    def flush():
        os.makedirs(os.path.dirname(args.cache), exist_ok=True)
        with open(args.cache, "w", encoding="utf-8") as f:
            json.dump(cache, f)

    eng = chess.engine.SimpleEngine.popen_uci(engine_path())
    eng.configure({"Threads": args.threads, "Hash": 1024})
    # Read before the engine is shut down, not after: the file is written outside
    # the try/finally that quits it, and eng.id raises once it is gone.
    engine_name = eng.id.get("name", "Stockfish")
    started = time.time()
    scores = {}
    try:
        for i, epd in enumerate(order, 1):
            began = time.time()
            hit = f"{epd}|{args.depth}" in cache
            scores[epd] = score(eng, chess.Board(epd + " 0 1"), args.depth, cache)
            if not hit:
                done = time.time() - began
                left = (len(order) - i) * (time.time() - started) / i
                print(f"  [{i:>4}/{len(order)}] {done:>5.1f}s  "
                      f"{scores[epd]['v']:>+6}  {int(left // 60)} min left  "
                      f"{first[epd][:44]}", flush=True)
                # An hour-long run that dies at fifty minutes should cost nothing.
                if i % 20 == 0:
                    flush()
    finally:
        eng.quit()
        flush()

    out = os.path.join(ROOT, "src", "content", "evals", f"{args.opening}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    write(out, {"engine": engine_name,
                "depth": args.depth,
                "generated": time.strftime("%Y-%m-%d", time.gmtime()),
                "skipped": skip}, scores)
    print(f"\nwrote {os.path.relpath(out, ROOT)}  {len(scores)} positions, "
          f"{os.path.getsize(out) // 1024} KB, {(time.time() - started) / 60:.0f} min")


if __name__ == "__main__":
    main()

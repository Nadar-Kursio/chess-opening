#!/usr/bin/env python3
"""Check the course's depth-20 scores against Lichess's deeper cloud analyses.

    flock .../.heavy.lock nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/crosscheck.py jobava

Every number the course ships is Stockfish at depth 20 (position-evals.py), because the bar and
the move marks compare positions with each other and two depths can't be compared. Depth 20 is
usually right in an opening. Where it isn't, a claim rests on it: a move marked as a blunder, an
authored severity, a "wins a piece" in a note. Lichess's cloud has most popular positions at depth
30 to 60, so it is a free second opinion on exactly those claims.

For every move the course shows (chapters, the deep dive, each deviation and its line, the model
games, the generated sidelines), the move's cost to its player is put in a band from both sets of
numbers: blunder (300+), inaccuracy (50+, while the position is not already decided) or fine,
marks.py's bands. Where both positions have a cloud analysis of --min-depth or more and the bands
differ, both positions are searched again here at --deep. The deeper local search settles it:

  confirmed    it agrees with the cloud. Depth 20 is wrong about this move, and whatever the
               course says about it (a severity, a mark, a sentence in a note) needs a look.
  holds        it agrees with depth 20. The cloud entry was shallow or stale.

Nothing here edits a generated file: the shipped scores stay at one depth. A confirmed row is
fixed in the content (a different move in the line, a softer sentence, a severity from
verify-branches.py with a note) or left with a reason. Deep searches go in the shared
.engine/eval-cache.json, keyed by depth, so a re-run only pays for new disputes.
Writes .engine/crosscheck/<opening>.txt.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
import chess.engine                                     # noqa: E402
from _course import generated, move_label, opening      # noqa: E402
from _engine import ROOT, engine_path                   # noqa: E402
from _lichess import Cloud                              # noqa: E402

BLUNDER = 300
INACCURACY = 50
DECIDED = 250
MATE = 10000


def moves_shown(op):
    """(position before, SAN, position after, where) for every move the course puts on a board."""
    out = []

    def walk(board, sans, where):
        for san in sans:
            before = board.copy()
            board.push_san(san)
            out.append((before, san, board.epd(), where))

    for line in op["lines"] + ([op["deep"]] if op.get("deep") else []):
        walk(chess.Board(), line["moves"].split(), f"chapter {line.get('slug') or line['name']}")
    for prefix, entries in (op.get("branches") or {}).items():
        base = chess.Board()
        for san in prefix.split():
            base.push_san(san)
        for br in entries:
            walk(base.copy(), [br["san"]] + br.get("line", "").split(),
                 f"deviation {move_label(base, br['san'])} ({br['severity']})")
    for game in op.get("games") or []:
        walk(chess.Board(), game["moves"].split(), f"game {game['id']}")
    for item in (generated("sidelines", op["id"]) or {}).get("sidelines", []):
        if item.get("line"):
            walk(chess.Board(), (item["moves"] + " " + item["reply"] + " " + item["line"]).split(),
                 f"sideline {item['slug']}")
    return out


def band(before, after, white_moved):
    """marks.py's band for a move, from White-side centipawns before and after it."""
    sign = 1 if white_moved else -1
    cost = sign * (before - after)
    if cost >= BLUNDER:
        return "blunder"
    if cost >= INACCURACY and abs(before) < DECIDED:
        return "inaccuracy"
    return "fine"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--min-depth", type=int, default=30, help="cloud analyses shallower than this are ignored")
    ap.add_argument("--deep", type=int, default=28, help="depth of the local search that settles a dispute")
    ap.add_argument("--threads", type=int, default=2)
    ap.add_argument("--limit", type=int, default=80, help="at most this many disputes searched deeply")
    ap.add_argument("--cache", default=os.path.join(ROOT, ".engine", "eval-cache.json"))
    args = ap.parse_args()

    op = opening(args.opening)
    evals = generated("evals", args.opening)
    if not evals:
        raise SystemExit(f"no src/content/evals/{args.opening}.json: run position-evals.py first")
    scores = {epd: s["v"] for epd, s in evals["scores"].items()}
    shown = moves_shown(op)
    cloud = Cloud()
    started = time.time()

    seen, disputes = set(), []
    for before, san, after, where in shown:
        key = (before.epd(), san)
        if key in seen or before.epd() not in scores or after not in scores:
            continue
        seen.add(key)
        a, b = cloud.lookup(before.epd()), cloud.lookup(after)
        if not a or not b or min(a["depth"], b["depth"]) < args.min_depth:
            continue
        white = before.turn == chess.WHITE
        local = band(scores[before.epd()], scores[after], white)
        deep = band(a["cp"], b["cp"], white)
        if local != deep:
            disputes.append({"before": before, "san": san, "after": after, "where": where,
                             "d20": (scores[before.epd()], scores[after], local),
                             "cloud": (a["cp"], b["cp"], deep, min(a["depth"], b["depth"]))})
    checked = len(seen)
    print(f"{checked} moves, {cloud.asked} new cloud lookups, {len(disputes)} where a cloud analysis of "
          f"depth {args.min_depth}+ puts the move in another band", flush=True)

    cache = {}
    if os.path.exists(args.cache):
        with open(args.cache, encoding="utf-8") as f:
            cache = json.load(f)
    disputes.sort(key=lambda d: (not d["where"].startswith(("chapter", "deviation")), d["where"]))
    searched = disputes[:args.limit]
    if searched:
        eng = chess.engine.SimpleEngine.popen_uci(engine_path())
        eng.configure({"Threads": args.threads, "Hash": 1024})
        try:
            def deep_score(epd):
                key = f"{epd}|{args.deep}"
                if key not in cache:
                    info = eng.analyse(chess.Board(epd + " 0 1"), chess.engine.Limit(depth=args.deep))
                    white = info["score"].white()
                    cache[key] = {"v": white.score(mate_score=MATE)}
                    if white.mate() is not None:
                        cache[key]["n"] = white.mate()
                return cache[key]["v"]

            for i, d in enumerate(searched, 1):
                x, y = deep_score(d["before"].epd()), deep_score(d["after"])
                d["deep"] = (x, y, band(x, y, d["before"].turn == chess.WHITE))
                print(f"  [{i}/{len(searched)}] {d['where']}", flush=True)
        finally:
            eng.quit()
            with open(args.cache + ".tmp", "w", encoding="utf-8") as f:
                json.dump(cache, f)
            os.replace(args.cache + ".tmp", args.cache)

    lines = [f"{op['name']} ({args.opening}): {checked} moves checked against Lichess cloud analyses of depth "
             f"{args.min_depth}+, {len(disputes)} in another band, {len(searched)} searched at depth {args.deep}", ""]
    confirmed = [d for d in searched if d["deep"][2] == d["cloud"][2]]
    holds = [d for d in searched if d["deep"][2] == d["d20"][2]]
    other = [d for d in searched if d not in confirmed and d not in holds]
    for title, rows in (("CONFIRMED: depth 20 is wrong about these moves; check what the course says", confirmed),
                        ("UNSETTLED: the deeper search agrees with neither", other),
                        ("HOLDS: depth 20 stands", holds)):
        lines.append(f"{title} ({len(rows)})")
        for d in rows:
            a, b, band20 = d["d20"]
            ca, cb, cband, cdepth = d["cloud"]
            da, db, dband = d["deep"]
            lines.append(f"  {move_label(d['before'], d['san']):<10} {d['where']}")
            lines.append(f"             depth 20 {a:+5} -> {b:+5} {band20:<10}  cloud d{cdepth} {ca:+5} -> {cb:+5} {cband:<10}"
                         f"  depth {args.deep} {da:+5} -> {db:+5} {dband}")
        lines.append("")
    if len(disputes) > len(searched):
        lines.append(f"{len(disputes) - len(searched)} more disputes not searched (--limit {args.limit}); "
                     f"chapters and deviations were searched first")
    folder = os.path.join(ROOT, ".engine", "crosscheck")
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, f"{args.opening}.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"{int(time.time() - started)} s, wrote .engine/crosscheck/{args.opening}.txt")


if __name__ == "__main__":
    main()

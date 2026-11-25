#!/usr/bin/env python3
"""The engine's answer wherever a club opponent leaves a course, for the sparring end screen.

    nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/exits.py london queensgambit

When the sparring partner plays a club move the course has nothing after, the game ends with
"End of your prep". The browser can't search, so this does it ahead of time: for every opponent
position in the course's tree (_course.Tree, the tree the sparring partner walks) with enough
club games to be played from, every club move with at least --games games that leaves the course
is played, and Stockfish's best reply and a short line (ending on the learner's move) are stored.
The trainer shows them with an arrow, labelled as the engine's choice and not course theory.

Writes src/content/exits/<opening>.json, keyed by the position after the leaving move (EPD):
{"ply": plies played to reach it (for the move number), "best": SAN, "v": White's centipawns,
"n": mate in n when there is one, "line": "SAN ..."}.
Searches share .engine/sideline-cache.json with sidelines.py (same position, same depth), so a
sideline's exit already searched there costs nothing. Generated: never edit it. Re-run after
sidelines.py and club-moves.py whenever a course with club data changes.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _course import THIN, Tree, club_counts, generated, opening  # noqa: E402
from _engine import ROOT                                # noqa: E402
from sidelines import SEARCH, Search, line_from_pv      # noqa: E402

MATE = 10000


def leaving_positions(tree, counts, min_games):
    """Positions after a club move that leaves the course: {epd: (games, ply)}."""
    out = {}
    for epd, moves in tree.moves.items():
        board = chess.Board(epd + " 0 1")
        if board.turn == tree.side:
            continue
        club = counts.get(epd)
        if not club or sum(club.values()) < THIN:
            continue
        for san, n in club.items():
            if n < min_games:
                continue
            b = board.copy()
            b.push_san(san)
            if tree.goes_on(b.epd()):
                continue
            if not list(b.legal_moves):
                continue
            prior = out.get(b.epd(), (0, len(tree.path.get(epd, [])) + 1))
            out[b.epd()] = (prior[0] + n, prior[1])
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("openings", nargs="+")
    ap.add_argument("--games", type=int, default=10, help="club games a leaving move needs to be answered")
    ap.add_argument("--threads", type=int, default=1)
    args = ap.parse_args()

    search = Search(args.threads)
    try:
        for op_id in args.openings:
            if generated("club", op_id) is None:
                print(f"{op_id}: no src/content/club/{op_id}.json, so no sparring and nothing to answer")
                continue
            op = opening(op_id)
            tree = Tree(op)
            counts, source = club_counts(op_id, "spar")
            todo = leaving_positions(tree, counts, args.games)
            print(f"{op_id}: {len(todo)} positions after a club move that leaves the course", flush=True)
            started = time.time()
            answers = {}
            for i, (epd, (games, ply)) in enumerate(sorted(todo.items(), key=lambda kv: -kv[1][0]), 1):
                board = chess.Board(epd + " 0 1")
                ev, pv = search.score(board, SEARCH)
                if not pv:
                    continue
                line = line_from_pv(board, pv)
                entry = {"ply": ply, "best": board.san(pv[0]), "v": ev, "line": " ".join(line)}
                if abs(ev) >= MATE - 500:
                    entry["n"] = (MATE - abs(ev)) * (1 if ev > 0 else -1)
                answers[epd] = entry
                if i % 25 == 0 or i == len(todo):
                    left = (len(todo) - i) * (time.time() - started) / i
                    print(f"  {i}/{len(todo)}  {int(left // 60)} min left", flush=True)
            out = os.path.join(ROOT, "src", "content", "exits", f"{op_id}.json")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            body = ",\n".join(f"    {json.dumps(epd)}: {json.dumps(answers[epd], separators=(',', ':'), ensure_ascii=False)}"
                              for epd in sorted(answers))
            with open(out, "w", encoding="utf-8") as f:
                f.write(f'{{\n  "engine": {json.dumps(search.name)},\n  "depth": {SEARCH},\n'
                        f'  "generated": "{time.strftime("%Y-%m-%d", time.gmtime())}",\n'
                        f'  "source": {json.dumps(source)},\n  "games": {args.games},\n'
                        f'  "positions": {{\n{body}\n  }}\n}}\n')
            print(f"wrote {os.path.relpath(out, ROOT)}: {len(answers)} answers", flush=True)
    finally:
        search.quit()


if __name__ == "__main__":
    main()

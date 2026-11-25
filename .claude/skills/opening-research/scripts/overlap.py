#!/usr/bin/env python3
"""Positions a course shares with every other course, and where two courses teach different moves.

    .venv/bin/python3 .claude/skills/opening-research/scripts/overlap.py london
    .venv/bin/python3 .claude/skills/opening-research/scripts/overlap.py london --all   # every shared position

No engine, a few seconds. Matched by position (EPD), so a transposition counts. For each other
module in content/openings ORDER (trap courses included; the site may not ship them all), it
prints how many positions the two share, the deepest one, whether each links to the other with a
`see` (a trap course is linked by the build instead, see below), and every CONFLICT: a position where both courses tell the learner, from the same chair,
to play different moves. A conflict is fine when one of the courses says why (a branch entry at
that position naming the other course's move, which Drill shows as "playable, but the course
plays X because...", marked `explained`), or when the shipped evals rate every move either course
plays there within an inaccuracy (`both fine`: two sound choices, typical inside a generated
sideline, which nobody edits). It is marked `unexplained` otherwise, and that is the thing to fix.
In the first two moves it is just two openings parting, and marked so.

The trap relation (which trap courses happen in this one) is the build's, not this script's:
src/build.py relate_traps links them by position on every build.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _course import Tree, every_opening, generated, numbered, opening  # noqa: E402
from engine.marks import INACCURACY                     # noqa: E402

PORTED = None
# A course's first two moves are where two repertoires choose different openings: a conflict
# there is the choice itself, not something to explain.
PARTING = 4


SCORES = {}


def score(epd):
    """White's score of a position from any course's evals file, or None."""
    if not SCORES:
        for op_id in every_opening():
            SCORES.update((generated("evals", op_id) or {}).get("scores", {}))
    found = SCORES.get(epd)
    return found["v"] if found else None


def both_fine(epd, mine, theirs):
    """Whether the engine rates every move either course plays here within an inaccuracy of the
    others, by the shipped evals: then the courses simply chose differently."""
    board = chess.Board(epd + " 0 1")
    sign = 1 if board.turn == chess.WHITE else -1
    scores = []
    for san in mine | theirs:
        b = board.copy()
        b.push_san(san)
        v = score(b.epd())
        if v is None:
            return False
        scores.append(sign * v)
    return max(scores) - min(scores) < INACCURACY


def ported():
    global PORTED
    if PORTED is None:
        import build
        PORTED = set(build.PORTED)
    return PORTED


class Taught:
    """What one course puts on a board: every position, and the learner's moves from each chair."""

    def __init__(self, op):
        self.op = op
        self.reached = {}       # epd -> SAN path
        self.moves = {}         # (epd, side) -> set of SAN the course teaches there
        self.branches = {}      # epd -> {san: entry}, both chairs
        self.owner = {}         # (epd, side) -> the chapter, deviation or sideline that teaches it
        sides = {line.get("side", op["orientation"]) for line in op["lines"]}
        for side in sides:
            tree = Tree(op, side)
            for epd, moves in tree.moves.items():
                self.reached.setdefault(epd, tree.path.get(epd, []))
                if chess.Board(epd + " 0 1").turn == tree.side and moves:
                    self.moves.setdefault((epd, side), set()).update(moves)
                    self.owner.setdefault((epd, side), tree.owner.get(epd, ""))
        for prefix, entries in (op.get("branches") or {}).items():
            board = chess.Board()
            for san in prefix.split():
                board.push_san(san)
            self.branches[board.epd()] = {br["san"]: br for br in entries}

    def links_to(self, other_id):
        return any((br.get("see") or "").split("#")[0] == other_id
                   for entries in (self.op.get("branches") or {}).values() for br in entries)

    def explains(self, epd, san):
        return san in self.branches.get(epd, {})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--all", action="store_true", help="list every shared position, not just the deepest")
    args = ap.parse_args()

    here = Taught(opening(args.opening))
    start = chess.Board().epd()
    print(f"{here.op['name']} ({args.opening}): {len(here.reached)} positions\n")
    unexplained = 0
    for other_id in every_opening():
        if other_id == args.opening:
            continue
        there = Taught(opening(other_id))
        shared = [epd for epd in here.reached if epd in there.reached and epd != start]
        if not shared:
            continue
        deepest = max(shared, key=lambda e: len(here.reached[e]))
        links = ("links: by the build" if there.op["section"] == "traps" else
                 f"links: {'->' if here.links_to(other_id) else '  '} {'<-' if there.links_to(args.opening) else '  '}    ")
        tag = "" if other_id in ported() else "  (not on the site)"
        print(f"{other_id:<20} {there.op['section']:<9} {len(shared):>4} shared  {links}  deepest: "
              f"{numbered(here.reached[deepest])}{tag}")
        if args.all:
            for epd in sorted(shared, key=lambda e: len(here.reached[e])):
                print(f"      {numbered(here.reached[epd])}")
        for (epd, side), mine in here.moves.items():
            theirs = there.moves.get((epd, side))
            if not theirs or theirs & mine:
                continue
            path = here.reached[epd]
            explained = any(here.explains(epd, s) for s in theirs) or any(there.explains(epd, s) for s in mine)
            verdict = ("explained" if explained else "openings part here" if len(path) < PARTING
                       else "both fine" if both_fine(epd, mine, theirs) else "unexplained")
            unexplained += verdict == "unexplained"
            number = f"{len(path) // 2 + 1}.{'..' if len(path) % 2 else ''}"
            label = lambda moves: ", ".join(f"{number}{s}" for s in sorted(moves))
            print(f"    CONFLICT as {side} after {numbered(here.reached[epd]) or 'the start'}: this course plays "
                  f"{label(mine)} ({here.owner[(epd, side)]}), {other_id} plays {label(theirs)} "
                  f"({there.owner.get((epd, side), '')})  [{verdict}]")
    print(f"\n{unexplained} unexplained conflict(s)")


if __name__ == "__main__":
    main()

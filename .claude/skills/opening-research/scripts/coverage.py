#!/usr/bin/env python3
"""Which club replies a course has no answer for, and how often a club game stays in it.

    .venv/bin/python3 .claude/skills/opening-research/scripts/coverage.py london
    .venv/bin/python3 .claude/skills/opening-research/scripts/coverage.py london --moves 8 --share 5 --json out.json

No engine: it reads the course module, src/content/sidelines/<id>.json and the club counts
(_course.club_counts), so it takes seconds. Run it to design a course (write the main chapter,
then every row under GAPS is a chapter or sideline to add) and again as the course's final
metric.

WHAT IT MEASURES

Club games are followed from the starting position. Where the learner moves they play the course
(the chapters taught from the course's side, the authored answers to the opponent's deviations
and the generated sidelines). Where the opponent moves, every club reply is followed in
proportion to how often 1200-2000 players chose it:

  gaps        every reply that reaches a position the course doesn't teach, within the
              opponent's first --moves moves, chosen by at least --share % of the games at that
              position and in at least --games games, at a position at least --reach % of the
              course's club games get to (a decision point a learner will actually meet).
              The coverage bar is an empty list. sidelines.py fills it. The moves every
              chapter shares (1.d4 d5 2.c4 for the Queen's Gambit) are played, not sampled:
              1...Nf6 is another opening, not a gap in this one.
  replies     of all the club replies met in the first --moves opponent moves, the share that
              land in the course, weighted by how often the game gets there.
  games       where a club game is after --moves opponent moves: still in the course, left it
              (the opponent played something it doesn't teach) or ran past its end.
  book end    a club-weighted game played to the end: how often it reaches the end of the
              course rather than leaving it. Twice: from club games alone (every position with
              any club games is sampled), which is the coverage figure; and as the sparring
              partner plays it (trainer/src/lib/spar.ts), where under THIN club games it
              follows the course and can't leave, which is what sparring feels like. Then, of
              the games that leave, how many end on a move exits.py answered.
  engine-only chapters with no master games behind them (no `record`).
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _course import (THIN, Tree, club_counts, generated, move_label, numbered, opening)  # noqa: E402


def analyse(tree, counts, moves=6, share=5, min_games=25, reach=0.25):
    learner = tree.side
    opening_keys = tree.opening_positions()
    gaps = {}
    stats = {"covered": 0.0, "uncovered": 0.0, "left": 0.0, "ended": 0.0, "inside": 0.0, "thin": 0.0}

    def flow(board, path, weight, asked):
        epd = board.epd()
        if board.turn == learner:
            course = tree.learner_moves(epd)
            if not course:
                stats["ended"] += weight
                return
            total = sum(course.values())
            for san, w in course.items():
                b = board.copy()
                b.push_san(san)
                flow(b, path + [san], weight * w / total, asked)
            return
        if asked >= moves:
            stats["inside"] += weight
            return
        if not tree.goes_on(epd) and epd in tree.ends:
            stats["ended"] += weight
            return
        course = tree.learner_moves(epd)
        if epd in opening_keys and len(course) == 1:
            # The opening's own moves (1...d5 2.c4 in the Queen's Gambit) are the course's
            # definition, not a choice: another reply is another opening, as in sparring.
            ((san, _),) = course.items()
            b = board.copy()
            b.push_san(san)
            flow(b, path + [san], weight, asked + 1)
            return
        club = counts.get(epd)
        total = sum(club.values()) if club else 0
        if total < THIN:
            # Too few games to say: follow the course's own replies, as the sparring partner does.
            stats["thin"] += weight
            if not course:
                stats["ended"] += weight
                return
            n = sum(course.values())
            for san, w in course.items():
                b = board.copy()
                b.push_san(san)
                flow(b, path + [san], weight * w / n, asked + 1)
            return
        for reply, n in club.most_common():
            w = weight * n / total
            b = board.copy()
            b.push_san(reply)
            if b.epd() in tree:
                stats["covered"] += w
                flow(b, path + [reply], w, asked + 1)
                continue
            stats["uncovered"] += w
            stats["left"] += w
            if n / total * 100 >= share and n >= min_games:
                key = (epd, reply)
                # The route the course itself teaches to this position, not the move order this
                # club game took: a sideline grown from the gap replays it, and the trainer
                # only knows the lessons' own roads.
                gap = gaps.setdefault(key, {"moves": tree.path.get(epd, path), "reply": reply, "label": move_label(board, reply),
                                            "share": round(100 * n / total, 1), "games": n, "at": total,
                                            "reach": 0.0, "where": tree.owner.get(epd, "")})
                gap["reach"] += weight

    flow(chess.Board(), [], 1.0, 0)
    replies = stats["covered"] + stats["uncovered"]
    return {
        "gaps": sorted((g for g in gaps.values() if g["reach"] * 100 >= reach), key=lambda g: -g["reach"]),
        "replies_covered": 100 * stats["covered"] / replies if replies else 100.0,
        "games": {k: 100 * stats[k] for k in ("inside", "left", "ended", "thin")},
    }


def book_end(tree, counts, thin=THIN):
    """The sparring partner's game to its end: (P(book end), the exits by how often they end a game).

    Below `thin` club games the opponent follows the course, as the trainer does at THIN, so it
    can't leave there. thin=1 samples every position that has any club games: what club games
    alone say, the honest coverage figure."""
    learner = tree.side
    opening_keys = tree.opening_positions()
    exits = {}
    result = {"book": 0.0, "left": 0.0}

    def flow(board, path, weight, depth):
        if weight < 1e-7 or depth > 80:
            result["book"] += weight
            return
        epd = board.epd()
        if board.turn == learner:
            course = tree.learner_moves(epd)
            if not course:
                result["book"] += weight
                return
            total = sum(course.values())
            for san, w in course.items():
                b = board.copy()
                b.push_san(san)
                flow(b, path + [san], weight * w / total, depth + 1)
            return
        course = {}
        for san, w in tree.learner_moves(epd).items():
            b = board.copy()
            b.push_san(san)
            if tree.goes_on(b.epd()):
                course[san] = (w, b)
        club = counts.get(epd)
        total = sum(club.values()) if club else 0
        if epd in opening_keys and len(course) == 1:
            ((san, (_, b)),) = course.items()
            flow(b, path + [san], weight, depth + 1)
            return
        if total < thin:
            if not course:
                result["book"] += weight
                return
            n = sum(w for w, _ in course.values())
            for san, (w, b) in course.items():
                flow(b, path + [san], weight * w / n, depth + 1)
            return
        for reply, n in club.most_common():
            w = weight * n / total
            b = board.copy()
            b.push_san(reply)
            if tree.goes_on(b.epd()):
                flow(b, path + [reply], w, depth + 1)
            else:
                result["left"] += w
                key = (epd, reply)
                exits.setdefault(key, {"moves": path, "reply": reply, "label": move_label(board, reply),
                                       "share": round(100 * n / total, 1), "games": n, "reach": 0.0,
                                       "known": reply in tree.learner_moves(epd)})
                exits[key]["reach"] += w

    flow(chess.Board(), [], 1.0, 0)
    return 100 * result["book"], sorted(exits.values(), key=lambda e: -e["reach"])


def answered(exits, op_id):
    """Of the games that leave the course, the share whose exit has an engine answer (exits.py)."""
    answers = (generated("exits", op_id) or {}).get("positions", {})
    left = sum(e["reach"] for e in exits)
    hit = 0.0
    for e in exits:
        board = chess.Board()
        for san in e["moves"] + [e["reply"]]:
            board.push_san(san)
        hit += e["reach"] if board.epd() in answers else 0
    return 100 * hit / left if left else 100.0


def pct(x):
    return f"{x:.2f}%" if x < 1 else f"{x:.1f}%"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--moves", type=int, default=6, help="the opponent's first N moves are held to the bar")
    ap.add_argument("--share", type=float, default=5, help="a reply chosen this often (%%) needs an answer")
    ap.add_argument("--games", type=int, default=25, help="...in at least this many club games")
    ap.add_argument("--reach", type=float, default=0.25,
                    help="...at a position this share (%%) of the course's club games reach")
    ap.add_argument("--exits", type=int, default=15, help="how many sparring exits to list")
    ap.add_argument("--json", help="also write the whole report here")
    args = ap.parse_args()

    op = opening(args.opening)
    tree = Tree(op)
    counts, source = club_counts(args.opening, "design")
    report = analyse(tree, counts, args.moves, args.share, args.games, args.reach)
    spar_counts, spar_source = club_counts(args.opening, "spar")
    rate, exits = book_end(tree, spar_counts)
    honest, _ = book_end(tree, spar_counts, thin=1)
    engine_only = [line.get("slug") or line["name"] for line in op["lines"] + ([op["deep"]] if op.get("deep") else [])
                   if not line.get("record")]

    print(f"{op['name']} ({args.opening}), from {op['orientation']}'s chair")
    print(f"club counts: {source}\nsparring plays from: {spar_source}")
    print(f"course: {len(op['lines'])} chapters, {sum(len(v) for v in (op.get('branches') or {}).values())} "
          f"deviations, {sum(1 for s in tree.sidelines if s.get('line'))} sidelines with a line\n")
    g = report["games"]
    print(f"replies covered, first {args.moves} opponent moves: {pct(report['replies_covered'])}")
    print(f"club games after {args.moves} opponent moves: {pct(g['inside'])} still in the course, "
          f"{pct(g['left'])} left it, {pct(g['ended'])} ran past its end "
          f"({pct(g['thin'])} passed through positions with under {THIN} club games)")
    print(f"book end, club games alone: {pct(honest)} reach the end of the course (every position with club "
          f"games is sampled; the coverage figure to report)")
    print(f"book end as sparring plays it: {pct(rate)} (under {THIN} club games the opponent follows the course, "
          f"so {pct(rate - honest)} of it is that fallback), {pct(100 - rate)} leave, "
          f"{pct(answered(exits, args.opening))} of those on a move with the engine's answer")
    print(f"engine-only chapters (no master record): {', '.join(engine_only) or 'none'}\n")

    print(f"GAPS: replies chosen by {args.share:g}%+ ({args.games}+ games) in the opponent's first {args.moves} moves, "
          f"at positions {args.reach:g}%+ of games reach, with no answer ({len(report['gaps'])})")
    if not report["gaps"]:
        print("  none: the course meets the bar")
    for gap in report["gaps"]:
        print(f"  {gap['label']:<10} {gap['share']:>5.1f}% of {gap['at']:>6} games  position reached in {pct(100 * gap['reach']):>6}"
              f"  after {numbered(gap['moves'])}  [{gap['where']}]")

    print(f"\nSPARRING EXITS: where a club-weighted game leaves the course, most common first (top {args.exits})")
    for e in exits[:args.exits]:
        known = "  (the course names it, no answer)" if e["known"] else ""
        print(f"  {e['label']:<10} ends {pct(100 * e['reach']):>6} of games  {e['share']:>5.1f}% here, n={e['games']:<6}"
              f" after {numbered(e['moves'])}{known}")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({"opening": args.opening, "source": source, "moves": args.moves, "share": args.share,
                       "games_min": args.games, "reach": args.reach,
                       **report, "book_end": honest, "book_end_sparring": rate, "answered": answered(exits, args.opening), "exits": exits,
                       "engine_only": engine_only}, f, indent=1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Real traps in a course: common club moves that lose a lot, and whether a trap course covers them.

    nice -n 10 .venv/bin/python3 .claude/skills/opening-research/scripts/trap-scan.py london --lock .../.heavy.lock

A trap worth a course is a natural move club players really make that the engine says loses
heavily. This finds them in the games, not in a book: every position a club game reaches while
the learner plays the course (and one reply past it), within the first --moves moves and with at
least --min-games club games, has every move chosen by --share % of players (or --games games)
scored. A move that costs its player --drop centipawns or more and leaves them --lost or worse is
a candidate, searched again at depth 20 to confirm.

`to set` means the course's opponent makes the mistake and the learner punishes it; `to dodge`
means club players on the learner's side make it, so the course should steer around it. Each
candidate says two things, by position:

  trap course X     a trap course's lines reach the position after the mistake. The build links
                    it to the course on its own (relate_traps in src/build.py).
  NEW               no trap course does. A real one (it is: these are club games and the
                    engine's numbers) with enough games behind it is a candidate for a new trap
                    course: see the skill's "Trap courses" section.

and what the course itself does there: for a trap to set, whether it answers the mistake and
with the engine's move (`punishes it with 4.Qa4+`) or another (`answers with ..., engine
prefers ...`) or not at all; for one to dodge, the move it plays instead, or `THE COURSE PLAYS
IT`, which is a bug in the course.

Engine searches share .engine/sideline-cache.json with sidelines.py and exits.py. The list of
known traps (from Wikipedia and Wikibooks) is still yours to make; this only adds the ones the
games prove.
"""
import argparse
import fcntl
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _course import Tree, club_counts, every_opening, move_label, numbered, opening  # noqa: E402
from sidelines import SEARCH, Search                    # noqa: E402

SCREEN = 16


def region(tree, counts, moves, min_games):
    """Positions club games reach while the learner plays the course, with how often: {epd: (reach, path)}.

    Off the course by one reply too, because a trap is usually just past where the book ends."""
    found = {}

    def visit(board, path, weight):
        epd = board.epd()
        if len(path) >= 2 * moves:
            return
        reach, _ = found.get(epd, (0.0, path))
        found[epd] = (reach + weight, found.get(epd, (0, path))[1])
        club = counts.get(epd)
        total = sum(club.values()) if club else 0
        if epd not in tree or total < min_games:
            return
        if board.turn == tree.side:
            course = tree.learner_moves(epd)
            n = sum(course.values())
            for san, w in course.items():
                b = board.copy()
                b.push_san(san)
                visit(b, path + [san], weight * w / n)
            return
        for reply, n in club.items():
            b = board.copy()
            b.push_san(reply)
            visit(b, path + [reply], weight * n / total)

    visit(chess.Board(), [], 1.0)
    return found


def trap_positions():
    """Every position each trap course reaches: {epd: [trap ids]}."""
    out = {}
    for op_id in every_opening():
        op = opening(op_id)
        if op["section"] != "traps":
            continue
        for side in {line.get("side", op["orientation"]) for line in op["lines"]}:
            for epd in Tree(op, side).moves:
                out.setdefault(epd, set()).add(op_id)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--moves", type=int, default=8, help="scan the first N moves")
    ap.add_argument("--min-games", type=int, default=200, help="club games a position needs to be scanned")
    ap.add_argument("--share", type=float, default=3, help="score moves chosen this often (%%)...")
    ap.add_argument("--games", type=int, default=300, help="...or in this many games")
    ap.add_argument("--drop", type=int, default=200, help="centipawns a move must cost its player")
    ap.add_argument("--lost", type=int, default=150, help="...leaving them at least this far behind")
    ap.add_argument("--threads", type=int, default=1)
    ap.add_argument("--lock", help="a lock file to hold while the engine runs: the club counts come first, from "
                    "Lichess, and can take half an hour on a new course")
    args = ap.parse_args()

    op = opening(args.opening)
    tree = Tree(op)
    counts, source = club_counts(args.opening, "design")
    found = region(tree, counts, args.moves, args.min_games)
    traps = trap_positions()
    jobs = []
    for epd, (reach, path) in found.items():
        club = counts.get(epd)
        total = sum(club.values()) if club else 0
        if total < args.min_games:
            continue
        for san, n in club.items():
            if 100 * n / total >= args.share or n >= args.games:
                jobs.append((epd, path, reach, san, n, total))
    print(f"{op['name']}: {len(found)} positions in the first {args.moves} moves, "
          f"{len(jobs)} club moves to score ({source})", flush=True)

    lock = open(args.lock, "a") if args.lock else None
    if lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
    search = Search(args.threads)
    candidates = []
    try:
        for i, (epd, path, reach, san, n, total) in enumerate(jobs, 1):
            board = chess.Board(epd + " 0 1")
            board.fullmove_number = len(path) // 2 + 1
            sign = 1 if board.turn == chess.WHITE else -1
            after = board.copy()
            after.push_san(san)
            if after.is_game_over():
                continue
            for depth in (SCREEN, SEARCH):
                best = search.score(board, depth)[0]
                ev, pv = search.score(after, depth)
                drop = sign * (best - ev)
                if drop < args.drop or -sign * ev < args.lost:
                    break
            else:
                candidates.append({"epd": epd, "path": path, "reach": reach, "san": san, "n": n, "total": total,
                                   "best": best, "ev": ev, "drop": drop,
                                   "punish": after.variation_san(pv[:5]),
                                   "reply": after.san(pv[0]) if pv else None,
                                   "after": after.epd(), "mover": board.turn})
            if i % 100 == 0:
                print(f"  {i}/{len(jobs)} scored, {len(candidates)} candidates", flush=True)
    finally:
        search.quit()
        if lock:
            lock.close()

    learner = tree.side
    print(f"\nCANDIDATES: club moves that cost {args.drop}cp+ (depth {SEARCH}), most often met first\n")
    for c in sorted(candidates, key=lambda c: -c["reach"] * c["n"] / c["total"]):
        board = chess.Board(c["epd"] + " 0 1")
        board.fullmove_number = len(c["path"]) // 2 + 1
        role = "to set  " if c["mover"] != learner else "to dodge"
        covered = sorted(traps.get(c["after"], ()))
        status = f"trap course {', '.join(covered)}" if covered else "NEW"
        if c["mover"] != learner:
            after = board.copy()
            after.push_san(c["san"])
            answers = tree.learner_moves(c["after"])
            if not answers:
                course = "the course has no answer"
            elif c["reply"] in answers:
                course = f"the course punishes it with {move_label(after, c['reply'])}"
            else:
                course = (f"the course answers with {', '.join(move_label(after, m) for m in answers)}, "
                          f"the engine prefers {move_label(after, c['reply'])}")
        else:
            plays = tree.learner_moves(c["epd"])
            course = ("THE COURSE PLAYS IT" if c["san"] in plays else
                      f"the course plays {', '.join(move_label(board, m) for m in plays)}" if plays else
                      "the course never gets here")
        status += f"; {course}"
        print(f"  {role} {move_label(board, c['san']):<10} {100 * c['n'] / c['total']:>5.1f}% of {c['total']:>6} games, "
              f"met in {100 * c['reach'] * c['n'] / c['total']:.2f}% of course games  "
              f"costs {c['drop'] / 100:.1f}  [{status}]")
        print(f"           after {numbered(c['path']) or 'the start'}; punished by {c['punish']}")
    if not candidates:
        print("  none")

    print("\nTRAP COURSES THIS COURSE REACHES (by position, deepest shared ply):")
    reached = {}
    for epd in tree.moves:
        for trap in traps.get(epd, ()):
            reached[trap] = max(reached.get(trap, 0), len(tree.path.get(epd, [])))
    from build import TRAP_REACH
    for trap, depth in sorted(reached.items(), key=lambda kv: -kv[1]):
        print(f"  {trap:<20} {depth} plies{'  (linked by the build)' if depth >= TRAP_REACH else ''}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Map an opening from the Lichess explorer before writing a word of it: the course's research.

    .venv/bin/python3 .claude/skills/opening-research/scripts/dossier.py jobava --start d4 --system Nc3 Bf4
    .venv/bin/python3 .claude/skills/opening-research/scripts/dossier.py caro --side black --start e4 --system c6
    .venv/bin/python3 .claude/skills/opening-research/scripts/dossier.py jobava            # once the module exists
    .venv/bin/python3 .claude/skills/opening-research/scripts/dossier.py --pgn aRWPtH7a    # a master game's PGN

No engine and no lock: everything comes from the explorer and Lichess's cloud analyses
(_lichess.py), cached by position, so the first run takes minutes and a re-run seconds.

THE WALK

From the starting position, the --start moves are played as given (1.d4 for a d-pawn course,
1.e4 for a Black defence to it). Then:

  the opponent's move  every club reply chosen by --share % of the games there, while the
                       position it reaches still gets --reach % of the course's games. Reach is
                       the product of the club shares on the way, so it is "how many of my games
                       will look like this".
  the learner's move   one move, the first that applies: the course's own (when the module
                       exists), the next --system move (the opening's signature moves, within the
                       learner's first --by moves, unless the cloud says it costs an inaccuracy),
                       the masters' most played move (10+ games), the cloud's best.

It stops after the opponent's --moves th move. Positions are merged by EPD, so a transposition
adds its reach to the position it reaches.

WHAT IT PRINTS (and writes to .engine/dossier/<id>.json and .txt)

  the map         every opponent position with --show %+ reach: what club players choose there,
                  how they score from the learner's chair, the master record, the cloud's eval
                  and the learner's move with the reason it was chosen.
  chapters        replies that lead to a position reached in --chapter %+ of games: the main
                  roads, with a `record` ready to paste (from the masters explorer) and the
                  master games played there.
  traps           a club reply chosen by --share %+ that the cloud rates 1.5 pawns or more in
                  the learner's favour (a mistake to punish), and a move club players on the
                  learner's side choose 10%+ of the time that costs them that much (a trap to
                  dodge). Candidates only: trap-scan.py checks them at depth 20.
  choices         learner moves to look at: a --system move dropped for costing too much, a
                  masters move the cloud rates an inaccuracy below its own best, or nothing to go
                  on but the cloud.

The cloud's numbers are for choosing and are labelled as such. What the course ships is scored
by position-evals.py, verify-branches.py and the other engine scripts at one depth.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
from _engine import ROOT                                # noqa: E402
from _lichess import Club, Cloud, Masters, pgn          # noqa: E402

INACCURACY = 50         # engine/marks.py's band, in centipawns
SWING = 150             # what a trap candidate must cost its player
DODGE_SHARE = 10        # % of club players on the learner's side who must choose a move to dodge
MASTER_GAMES = 10       # below this many master games a "most played" move means little


def load_course(op_id):
    try:
        from _course import Tree, opening
        return Tree(opening(op_id), with_sidelines=False)
    except ModuleNotFoundError:
        return None


def pov(cp, side):
    return None if cp is None else (cp if side == chess.WHITE else -cp)


def score(row, side):
    """The learner's score from a [san, white, draws, black] row, as a percentage."""
    _, w, d, b = row
    n = w + d + b
    mine = w if side == chess.WHITE else b
    return 100 * (mine + d / 2) / n if n else None


class Walk:
    def __init__(self, args, side, course):
        self.args, self.side, self.course = args, side, course
        self.club, self.masters, self.cloud = Club(args.since, args.until), Masters(), Cloud(patient=False)
        self.nodes = {}

    def eval(self, board):
        row = self.cloud.lookup(board.epd())
        return (pov(row["cp"], self.side), row["depth"], row["pv"]) if row else (None, None, None)

    def learner_move(self, board, node):
        """The move the course plays here, and why that one."""
        epd = board.epd()
        if self.course is not None and self.course.learner_moves(epd):
            moves = self.course.learner_moves(epd)
            return max(moves, key=moves.get), "course"
        here, _, _ = node["cloud"]
        mine = sum(1 for i, _ in enumerate(node["path"]) if (i % 2 == 0) == (self.side == chess.WHITE))
        played = set(node["path"][(0 if self.side == chess.WHITE else 1)::2])
        if mine < self.args.by:
            for san in self.args.system:
                if san in played:
                    continue
                try:
                    move = board.parse_san(san)
                except ValueError:
                    continue
                after = board.copy()
                after.push(move)
                cost, _, _ = self.eval(after)
                if here is not None and cost is not None and here - cost >= INACCURACY:
                    node["flags"].append(f"system move {san} costs {(here - cost) / 100:.1f} (cloud)")
                    break
                return board.san(move), "system"
        _, _, line = node["cloud"]
        if node["masters"] is None and not line:
            node["masters"] = self.masters.lookup(epd)
        masters = node["masters"] or {"moves": []}
        if masters["moves"] and sum(masters["moves"][0][1:]) >= MASTER_GAMES:
            san = masters["moves"][0][0]
            after = board.copy()
            after.push_san(san)
            cost, _, _ = self.eval(after)
            if here is not None and cost is not None and here - cost >= INACCURACY:
                node["flags"].append(f"masters' {san} is {(here - cost) / 100:.1f} below the cloud's best")
            return san, "masters"
        if line:
            if node["masters"] is not None:
                node["flags"].append("no master games: the cloud's move")
            return board.san(chess.Move.from_uci(line[0])), "cloud"
        if masters["moves"]:
            node["flags"].append(f"{sum(masters['moves'][0][1:])} master games and no cloud analysis")
            return masters["moves"][0][0], "masters"
        if not node["club"]:
            node["club"] = self.club.results(epd)
        if node["club"]:
            node["flags"].append("no master games or cloud analysis: the club's most played move")
            return node["club"][0][0], "club"
        return None, None

    def visit(self, board, path, reach, forced, before):
        """One position: what it costs to know about it, and where the walk goes next.

        Only what the position needs is asked. The opponent's positions need the club's replies;
        their eval is the learner's position before (`before`), since the course plays a move the
        cloud rates within an inaccuracy of its best. The learner's need the masters and the cloud
        to choose a move; the masters and the club only where the map, the chapters and the dodge
        check look (--show %+ reach). Below that the cloud's move is good enough to walk on, and
        the explorer is the scarce one: it allows roughly 20 to 30 requests a minute."""
        epd = board.epd()
        learner = board.turn == self.side
        node = {"path": path, "ply": len(path), "reach": reach, "flags": [],
                "turn": "learner" if learner else "opponent", "club": [], "masters": None}
        if learner and not forced:
            node["cloud"] = self.eval(board)
            if reach * 100 >= self.args.show:
                node["masters"] = self.masters.lookup(epd)
                node["club"] = self.club.results(epd)
        else:
            known = self.cloud.known(epd)
            node["cloud"] = (pov(known["cp"], self.side), known["depth"], known["pv"]) if known else before
            if not learner:
                node["club"] = self.club.results(epd)
        self.nodes[epd] = node
        children = []
        if forced:
            b = board.copy()
            b.push_san(forced)
            node["chosen"] = (forced, "start")
            children.append((b, path + [forced], reach))
        elif learner:
            san, why = self.learner_move(board, node)
            node["chosen"] = (san, why)
            if san:
                b = board.copy()
                b.push_san(san)
                children.append((b, path + [san], reach))
            self.dodges(board, node)
        else:
            total = sum(sum(r[1:]) for r in node["club"])
            for row in node["club"]:
                share = 100 * sum(row[1:]) / total
                if share < self.args.share or 100 * reach * share / 100 < self.args.reach:
                    continue
                b = board.copy()
                b.push_san(row[0])
                children.append((b, path + [row[0]], reach * share / 100))
        return children

    def dodges(self, board, node):
        """Moves club players on the learner's side often choose here that lose material."""
        if node["reach"] * 100 < self.args.show:
            return
        here, _, _ = node["cloud"]
        total = sum(sum(r[1:]) for r in node["club"])
        for row in node["club"]:
            if not total or 100 * sum(row[1:]) / total < DODGE_SHARE or here is None:
                continue
            b = board.copy()
            b.push_san(row[0])
            after, _, _ = self.eval(b)
            if after is not None and here - after >= SWING:
                node.setdefault("dodge", []).append((row[0], 100 * sum(row[1:]) / total, here - after))

    def run(self):
        level = {chess.Board().epd(): (chess.Board(), [], 1.0, (None, None, None))}
        start = self.args.start
        last = len(start) + 2 * self.args.moves
        for ply in range(last):
            following = {}
            for epd, (board, path, reach, before) in level.items():
                if epd in self.nodes:
                    self.nodes[epd]["reach"] += reach
                    continue
                forced = start[ply] if ply < len(start) else None
                for b, p, r in self.visit(board, path, reach, forced, before):
                    key = b.epd()
                    if key in following:
                        following[key] = following[key][:2] + (following[key][2] + r, following[key][3])
                    else:
                        following[key] = (b, p, r, self.nodes[epd]["cloud"])
            level = following
            print(f"  ply {ply + 1}: {len(level)} positions, {self.club.asked + self.masters.asked + self.cloud.asked} "
                  f"requests so far", file=sys.stderr, flush=True)


def numbered(sans):
    return " ".join(f"{i // 2 + 1}.{san}" if i % 2 == 0 else (san if i else f"1...{san}") for i, san in enumerate(sans))


def label(path):
    """'3...e6' / '4.Nb5' for the last move of a path."""
    i = len(path) - 1
    return f"{i // 2 + 1}.{'..' if i % 2 else ''}{path[-1]}"


def report(walk, args, out):
    side = walk.side
    nodes = walk.nodes

    def say(text=""):
        print(text)
        out.append(text)

    def cp(v):
        return "  ?  " if v is None else f"{v / 100:+.2f}"

    root_games = walk.club.games(chess.Board().epd()) or 1
    say(f"{args.opening}: dossier from {'White' if side == chess.WHITE else 'Black'}'s chair, "
        f"start {numbered(args.start) or '(none)'}, system {' '.join(args.system) or '(none)'}")
    say(f"club: {walk.club.source}; masters: {walk.masters.source}; cloud: Lichess cloud analyses (research only)")
    say(f"walked {len(nodes)} positions to the opponent's move {args.moves}; replies chosen {args.share:g}%+, "
        f"positions reached {args.reach:g}%+; {walk.club.asked + walk.masters.asked + walk.cloud.asked} new requests")
    say()
    say(f"THE MAP: opponent positions reached in {args.show:g}%+ of the course's games")
    say("  reach   position                                    games    replies (share, learner's club score)")
    for epd, node in sorted(nodes.items(), key=lambda kv: (kv[1]["ply"], -kv[1]["reach"])):
        if node["turn"] != "opponent" or node["reach"] * 100 < args.show or node["ply"] < len(args.start):
            continue
        total = sum(sum(r[1:]) for r in node["club"])
        replies = ", ".join(f"{r[0]} {100 * sum(r[1:]) / total:.0f}% ({score(r, side):.0f})"
                            for r in node["club"][:6] if total and 100 * sum(r[1:]) / total >= 2)
        say(f"  {100 * node['reach']:5.1f}%  {numbered(node['path']):<42} {total:>8,}  {replies}")
        for row in node["club"]:
            if not total or 100 * sum(row[1:]) / total < args.share:
                continue
            board = chess.Board(epd + " 0 1")
            board.push_san(row[0])
            child = nodes.get(board.epd())
            if not child or not child.get("chosen"):
                continue
            san, why = child["chosen"]
            m = child["masters"] or {"white": 0, "draws": 0, "black": 0}
            mg = m["white"] + m["draws"] + m["black"]
            say(f"           {label(node['path'] + [row[0]]):<8} -> {(san or 'stop'):<6} [{why}]  masters {mg:,} games, "
                f"cloud {cp(child['cloud'][0])}" + (f"  ! {'; '.join(child['flags'])}" if child["flags"] else ""))
    say()

    say(f"CHAPTERS: replies leading to a position {args.chapter:g}%+ of games reach (longest road first within a move)")
    chapters = [(epd, n) for epd, n in nodes.items()
                if n["turn"] == "learner" and n["reach"] * 100 >= args.chapter and n["ply"] > len(args.start)]
    for epd, node in sorted(chapters, key=lambda kv: (kv[1]["ply"], -kv[1]["reach"])):
        record = walk.masters.record(epd, node["ply"])
        games = node["masters"]["games"][:3]
        say(f"  {100 * node['reach']:5.1f}%  {numbered(node['path'])}")
        say(f"          record {json.dumps(record) if record else 'none (engine-only: no master games)'}")
        for g in games:
            say(f"          game {g['id']}  {g['white']} - {g['black']}, {g['year']} ({g['result']})")
    say()

    say(f"TRAPS (candidates; trap-scan.py checks each at depth 20)")
    found = False
    for epd, node in sorted(nodes.items(), key=lambda kv: -kv[1]["reach"]):
        if node["turn"] == "opponent" and node["cloud"][0] is not None:
            total = sum(sum(r[1:]) for r in node["club"])
            for row in node["club"]:
                share = 100 * sum(row[1:]) / total if total else 0
                if share < args.share:
                    continue
                board = chess.Board(epd + " 0 1")
                board.push_san(row[0])
                child = nodes.get(board.epd())
                if child and child["cloud"][0] is not None and child["cloud"][0] - node["cloud"][0] >= SWING:
                    found = True
                    say(f"  set    {label(node['path'] + [row[0]]):<8} {share:4.0f}% of {total:,}, reach {100 * child['reach']:.2f}%, "
                        f"{(child['cloud'][0] - node['cloud'][0]) / 100:+.1f} for you  after {numbered(node['path'])}"
                        f"  (you: {child.get('chosen', (None,))[0]})")
        for san, share, cost in node.get("dodge", []):
            found = True
            say(f"  dodge  {label(node['path'] + [san]):<8} {share:4.0f}% of club players on your side, costs "
                f"{cost / 100:.1f}  after {numbered(node['path'])}  (course: {node['chosen'][0]})")
    if not found:
        say("  none above the bar")
    say()

    say("CHOICES TO CHECK")
    flagged = [n for n in nodes.values() if n["flags"] and n["reach"] * 100 >= args.show]
    for node in sorted(flagged, key=lambda n: -n["reach"]):
        say(f"  {100 * node['reach']:5.1f}%  after {numbered(node['path'])}: {'; '.join(node['flags'])}")
    if not flagged:
        say("  none")
    return root_games


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening", nargs="?")
    ap.add_argument("--side", choices=("white", "black"), help="the course's chair (default: the module's, else white)")
    ap.add_argument("--start", nargs="*", default=None, help="moves from the start played as given (default: the "
                    "first move every chapter shares)")
    ap.add_argument("--system", nargs="*", default=[], help="the learner's signature moves, played when legal")
    ap.add_argument("--by", type=int, default=4, help="--system moves are played within the learner's first N moves")
    ap.add_argument("--moves", type=int, default=8, help="walk to the opponent's Nth move")
    ap.add_argument("--share", type=float, default=3, help="follow replies chosen this often (%%)")
    ap.add_argument("--reach", type=float, default=0.25, help="...while the position gets this share (%%) of games")
    ap.add_argument("--show", type=float, default=1, help="the map lists positions this share (%%) of games reach")
    ap.add_argument("--chapter", type=float, default=5, help="a candidate chapter is reached this often (%%)")
    ap.add_argument("--since", help="first month of club games, YYYY-MM (default: the latest whole month)")
    ap.add_argument("--until", help="last month of club games, YYYY-MM")
    ap.add_argument("--pgn", metavar="ID", help="print one master game's PGN and stop")
    args = ap.parse_args()

    if args.pgn:
        print(pgn(args.pgn))
        return
    if not args.opening:
        ap.error("name the course")

    course = load_course(args.opening)
    side_name = args.side or (course.op["orientation"] if course else "white")
    side = chess.WHITE if side_name == "white" else chess.BLACK
    if args.start is None:
        if course:
            firsts = {line["moves"].split()[0] for line in course.op["lines"]}
            args.start = [firsts.pop()] if len(firsts) == 1 else []
        else:
            args.start = []

    started = time.time()
    walk = Walk(args, side, course)
    walk.run()
    out = []
    report(walk, args, out)
    print(f"\n{int(time.time() - started)} s", file=sys.stderr)

    folder = os.path.join(ROOT, ".engine", "dossier")
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, f"{args.opening}.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    with open(os.path.join(folder, f"{args.opening}.json"), "w", encoding="utf-8") as f:
        json.dump({"opening": args.opening, "side": side_name, "start": args.start, "system": args.system,
                   "club": walk.club.source, "masters": walk.masters.source,
                   "positions": {epd: {**n, "cloud": dict(zip(("cp", "depth", "pv"), n["cloud"]))}
                                 for epd, n in walk.nodes.items()}}, f, indent=1)
    print(f"wrote .engine/dossier/{args.opening}.txt and .json", file=sys.stderr)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Find where club players leave a course's chapters, and what the learner should do then.

    .venv/bin/python3 .claude/skills/opening-research/scripts/sidelines.py london

Needs .engine/club/<opening>.json from club-stats.py. Writes
src/content/sidelines/<opening>.json, which the build reads. Generated: never
edit it, re-run this.

THE ONE QUESTION

A system opening is mostly the same moves against anything, so the useful thing
to know about a reply is whether the move the learner would play on autopilot
(the chapter's next move) still holds up:

  keep     it does. Nothing new to learn.
  answer   it costs at least INACCURACY. There is a move to learn.
  dodge    it costs at least TRAP. The natural move walks into something.
  set      the reply itself costs the opponent at least MISTAKE and leaves the
           learner clearly better. A mistake club players really make.
  chapter  the reply reaches a position another chapter already teaches.

The bands are marks.py's, so this and the move icons can't disagree. One move is
checked, at depth 20, which is what catches a tactic like 2...h5 3.e3 e5; it does
not replay the setup any further than that.

Lines come from the authored branch when there is one, and from Stockfish's
principal variation when there isn't. Ranking needs nothing else: `coverage` is
every club reply in the first MOVES opponent moves, weighted by how often the
game gets there when the learner plays the course, and credited to the chapter or
sideline that teaches it, so what a learner has studied just adds up.
"""
import argparse
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
import chess.engine                                     # noqa: E402
from _engine import ROOT, engine_path                   # noqa: E402
from engine.marks import INACCURACY                     # noqa: E402

MATE = 10000
MOVES = 5           # opponent moves per chapter on the page
COMMON = 0.03       # share of the position's games
ENOUGH = 25         # games, below which a percentage is noise
PLENTY = 2000       # games that matter however small their share of a huge position
SET_SHARE = 0.01    # a one-off blunder isn't a trap to set
RARE_ENOUGH = 20    # games for a rare reply that might still be a trap
TRAP = 150
MISTAKE = 100
CLEARLY = 100
SEARCH = 20
SCREEN = 14
LEARNER_MOVES = 3


class Search:
    """Stockfish, with every answer kept in .engine/sideline-cache.json so a re-run is cheap."""

    def __init__(self, threads):
        self.eng = chess.engine.SimpleEngine.popen_uci(engine_path())
        self.eng.configure({"Threads": threads, "Hash": 512})
        self.name = self.eng.id.get("name", "Stockfish")
        self.path = os.path.join(ROOT, ".engine", "sideline-cache.json")
        self.cache = {}
        if os.path.exists(self.path):
            with open(self.path, encoding="utf-8") as f:
                self.cache = json.load(f)

    def score(self, board, depth=SEARCH, move=None):
        """White's score, and the principal variation."""
        key = f"{board.epd()}|{depth}|{move.uci() if move else ''}"
        if key not in self.cache:
            limit = chess.engine.Limit(depth=depth)
            info = self.eng.analyse(board, limit, root_moves=[move] if move else None)
            self.cache[key] = [info["score"].white().score(mate_score=MATE), [m.uci() for m in info.get("pv", [])]]
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(self.cache, f)
        ev, pv = self.cache[key]
        return ev, [chess.Move.from_uci(m) for m in pv]

    def quit(self):
        self.eng.quit()


def play(moves):
    board = chess.Board()
    for san in moves:
        board.push_san(san)
    return board


def line_from_pv(board, pv):
    """SAN from a principal variation, cut to end on the learner's move, at most three of them."""
    learner = board.turn
    sans, seen = [], 0
    b = board.copy()
    for move in pv[:LEARNER_MOVES * 2 - 1]:
        sans.append(b.san(move))
        seen += b.turn == learner
        b.push(move)
    while sans and len(sans) % 2 == 0:
        sans.pop()
    return sans


def slug_for(board_before, reply, taken):
    number = board_before.fullmove_number
    clean = re.sub(r"[^a-z0-9]+", "", reply.lower())
    slug = base = f"leaves-{number}-{clean}"
    n = 2
    while slug in taken:
        slug, n = f"{base}-{n}", n + 1
    taken.add(slug)
    return slug


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--threads", type=int, default=2)
    args = ap.parse_args()

    from importlib import import_module
    op = import_module(f"content.openings.{args.opening}").OPENING
    with open(os.path.join(ROOT, ".engine", "club", f"{args.opening}.json"), encoding="utf-8") as f:
        club = json.load(f)
    positions = club["positions"]
    learner = chess.WHITE if op["orientation"] == "white" else chess.BLACK
    sign = 1 if learner == chess.WHITE else -1

    chapters = op["lines"]
    every_line = chapters + ([op["deep"]] if op.get("deep") else [])
    owner = {}          # position -> the chapter that teaches it
    course_move = {}    # position -> the learner's move there
    for line in every_line:
        board = chess.Board()
        owner.setdefault(board.epd(), line["slug"])
        for san in line["moves"].split():
            if board.turn == learner:
                course_move.setdefault(board.epd(), san)
            board.push_san(san)
            owner.setdefault(board.epd(), line["slug"])

    authored = {}       # (position, reply) -> branch
    studied_moves = {}  # position -> learner moves any authored branch plays there
    for prefix, entries in (op.get("branches") or {}).items():
        base = play(prefix.split())
        for br in entries:
            authored[(base.epd(), br["san"])] = br
            b = base.copy()
            for san in [br["san"]] + br.get("line", "").split():
                if b.turn == learner:
                    studied_moves.setdefault(b.epd(), set()).add(san)
                b.push_san(san)

    search = Search(args.threads)
    items, moments, taken, seen = [], [], set(), set()

    def build_item(before, moves, reply, count, total, chapter, moment, auto):
        after = before.copy()
        reply_move = after.parse_san(reply)
        after.push(reply_move)
        share = count / total
        common = (share >= COMMON and count >= ENOUGH) or count >= PLENTY
        entry = {"moves": " ".join(moves), "reply": reply, "pct": round(100 * share),
                 "games": count, "at": total, "chapter": chapter, "moment": moment}
        target = owner.get(after.epd())
        if target and chapter is not None:
            return {**entry, "kind": "chapter", "target": target} if common else None

        branch = authored.get((before.epd(), reply))
        auto_move = None
        if auto:
            try:
                auto_move = after.parse_san(auto)
            except ValueError:
                auto_move = None

        def judge(depth):
            best_ev, best_pv = search.score(after, depth)
            auto_ev = search.score(after, depth, auto_move)[0] if auto_move else None
            cost = sign * (best_ev - auto_ev) if auto_ev is not None else None
            their_cost = sign * (best_ev - search.score(before, depth)[0])
            if their_cost >= MISTAKE and sign * best_ev >= CLEARLY:
                kind = "set"
            elif cost is None:
                kind = "answer"
            elif cost >= TRAP:
                # Taking back after a capture is an answer: nothing was hidden.
                kind = "answer" if before.is_capture(reply_move) else "dodge"
            elif cost >= INACCURACY:
                kind = "answer"
            else:
                kind = "keep"
            return kind, best_ev, best_pv, auto_ev

        # Rare replies only earn a place by being dangerous, or a mistake people really make.
        def earns_a_place(kind):
            return common or kind == "dodge" or (kind == "set" and share >= SET_SHARE)

        if not common and not branch and not earns_a_place(judge(SCREEN)[0]):
            return None
        kind, best_ev, best_pv, auto_ev = judge(SEARCH)
        if not earns_a_place(kind):
            return None

        if branch and branch.get("line"):
            line = branch["line"].split()
        elif kind == "keep" and auto_move:
            b = after.copy()
            first = b.san(auto_move)
            b.push(auto_move)
            _, pv = search.score(b, SCREEN + 2)
            line = [first] + line_from_pv(b, pv)[:4]
            while len(line) % 2 == 0:
                line.pop()
        else:
            line = line_from_pv(after, best_pv)
        if not line:
            return None
        best_san = after.san(best_pv[0]) if best_pv else None
        return {**entry, "kind": kind, "auto": auto if auto_move else None, "autoEv": auto_ev,
                "best": best_san, "bestEv": best_ev, "line": " ".join(line), "authored": bool(branch)}

    def add(item, before):
        if item:
            item["slug"] = slug_for(before, item["reply"], taken)
            items.append(item)
            print(f"  {item['kind']:8} {before.fullmove_number}...{item['reply']:7} {item['pct']:>3}% "
                  f"n={item['games']:<6} auto {item.get('auto')} {item.get('autoEv')} "
                  f"best {item.get('best')} {item.get('bestEv')}", flush=True)

    # The chapters, one opponent move at a time.
    for line in chapters:
        moves = line["moves"].split()
        board = chess.Board()
        asked = 0
        for i, san in enumerate(moves):
            if board.turn != learner:
                counts = positions.get(board.epd())
                if asked >= MOVES or not counts:
                    board.push_san(san)
                    continue
                total = sum(counts.values())
                prior = moves[i - 1] if i else ""
                number = board.fullmove_number
                white = f"{number}.{prior}" if learner == chess.WHITE else f"{number}.{san}"
                label = f"{white} {san}" if learner == chess.WHITE else white
                moments.append({"chapter": line["slug"], "index": asked, "label": label,
                                "leave": 100 - round(100 * counts.get(san, 0) / total)})
                auto = moves[i + 1] if i + 1 < len(moves) else None
                for reply, count in sorted(counts.items(), key=lambda kv: -kv[1]):
                    if reply == san or count < RARE_ENOUGH:
                        continue
                    result = board.copy()
                    result.push_san(reply)
                    if result.epd() in seen:
                        continue
                    seen.add(result.epd())
                    add(build_item(board, moves[:i], reply, count, total, line["slug"], asked, auto), board)
                asked += 1
            board.push_san(san)

    # Off the chapters: mistakes players make after sidelines the course knows about.
    def walk(board, moves, depth):
        epd = board.epd()
        counts = positions.get(epd)
        if not counts or depth > MOVES:
            return
        total = sum(counts.values())
        if total < ENOUGH * 4:
            return
        if board.turn == learner:
            for san, count in counts.items():
                if san in studied_moves.get(epd, ()) or san == course_move.get(epd):
                    b = board.copy()
                    b.push_san(san)
                    walk(b, moves + [san], depth)
            return
        for reply, count in sorted(counts.items(), key=lambda kv: -kv[1]):
            if count < ENOUGH:
                continue
            b = board.copy()
            b.push_san(reply)
            if b.epd() not in seen and count / total >= COMMON:
                seen.add(b.epd())
                item = build_item(board, moves, reply, count, total, None, None, course_move.get(epd))
                if item and item["kind"] == "set":
                    add(item, board)
            walk(b, moves + [reply], depth + 1)

    walk(chess.Board(), [], 0)

    # What each chapter and sideline teaches, weighted by how often it comes up.
    sideline_owner = {}
    sideline_move = {}
    for item in items:
        if item["kind"] == "chapter":
            continue
        board = play(item["moves"].split())
        board.push_san(item["reply"])
        sideline_owner.setdefault(board.epd(), item["slug"])
        for san in item["line"].split():
            if board.turn == learner:
                sideline_move.setdefault(board.epd(), san)
            board.push_san(san)
            sideline_owner.setdefault(board.epd(), item["slug"])

    credit = {}
    total_flow = [0.0]

    def flow(board, weight, depth):
        epd = board.epd()
        if board.turn == learner:
            san = course_move.get(epd) or sideline_move.get(epd)
            if not san:
                return
            b = board.copy()
            b.push_san(san)
            flow(b, weight, depth)
            return
        counts = positions.get(epd)
        if not counts or depth >= MOVES:
            return
        total = sum(counts.values())
        for reply, count in counts.items():
            b = board.copy()
            b.push_san(reply)
            w = weight * count / total
            total_flow[0] += w
            who = owner.get(b.epd()) or sideline_owner.get(b.epd())
            if who:
                credit[who] = credit.get(who, 0) + w
                flow(b, w, depth + 1)

    flow(chess.Board(), 1.0, 0)
    coverage = {who: round(100 * w / total_flow[0], 2) for who, w in sorted(credit.items())}
    name = search.name
    search.quit()

    out = os.path.join(ROOT, "src", "content", "sidelines", f"{args.opening}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    items.sort(key=lambda it: (it["kind"] in ("keep", "chapter"), -it["pct"], -it["games"]))
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"engine": name, "depth": SEARCH, "generated": time.strftime("%Y-%m-%d", time.gmtime()),
                   "source": club["source"], "scanned": club["scanned"], "games": club["games"],
                   "elo": club["elo"], "moments": moments, "coverage": coverage, "sidelines": items},
                  f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {os.path.relpath(out, ROOT)}: {len(items)} sidelines, "
          f"{sum(coverage.values()):.0f}% of club replies taught")


if __name__ == "__main__":
    main()

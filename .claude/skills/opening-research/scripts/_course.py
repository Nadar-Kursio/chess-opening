"""A course as the trainer plays it, and the club counts beside it, for the course-planning scripts.

coverage.py, overlap.py, trap-scan.py and exits.py all ask the same two things: which positions
does the course teach from the learner's chair, and what do club players play in them. The tree
here is the one the trainer's sparring partner walks (trainer/src/lib/course.ts buildTree): the
chapters taught from the course's side, the opponent's authored deviations with their answers,
and the generated sidelines. The learner's own alternatives are not in it, because the trainer
never asks for them. Positions are EPD, so transpositions meet.
"""
import json
import os
from collections import Counter
from importlib import import_module

import chess

from _engine import ROOT

# Mirrors BRANCH_WEIGHT in trainer/src/lib/course.ts: only used where club games are too few.
LINE_WEIGHT = 3
BRANCH_WEIGHT = {"playable": 2, "inaccuracy": 1, "blunder": 1}
BRANCH_LINE_WEIGHT = 2
SIDELINE_WEIGHT = 1
# trainer/src/lib/spar.ts THIN: below this many club games the opponent follows the course.
THIN = 20


def opening(op_id):
    return import_module(f"content.openings.{op_id}").OPENING


def every_opening():
    return import_module("content.openings").ORDER


def generated(folder, op_id):
    path = os.path.join(ROOT, "src", "content", folder, f"{op_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def colour(name):
    return chess.WHITE if name == "white" else chess.BLACK


def numbered(sans):
    """'1.d4 d5 2.Bf4' for a list of SAN from the starting position."""
    return " ".join(f"{i // 2 + 1}.{san}" if i % 2 == 0 else san for i, san in enumerate(sans))


def move_label(board, san):
    """'3...Bd6' / '4.Nf3' for a move from this position."""
    return f"{board.fullmove_number}.{'..' if board.turn == chess.BLACK else ''}{san}"


class Tree:
    """Every position the course teaches from one chair, with the moves it plays or expects there."""

    def __init__(self, op, side=None, with_sidelines=True, sidelines=None):
        self.op = op
        self.side = colour(side or op["orientation"])
        self.moves = {}      # epd -> {san: weight}
        self.sev = {}        # (epd, san) -> the authored severity of an opponent deviation
        self.owner = {}      # epd -> where the course first reaches it
        self.path = {}       # epd -> SAN from the start, by the first route found
        self.ends = set()    # positions a chapter, deviation or sideline stops at
        for line in op["lines"] + ([op["deep"]] if op.get("deep") else []):
            if colour(line.get("side", op["orientation"])) != self.side:
                continue
            self.walk(chess.Board(), [], line["moves"].split(), LINE_WEIGHT, f"chapter {line.get('slug') or line['name']}")
        for prefix, entries in (op.get("branches") or {}).items():
            base = chess.Board()
            for san in prefix.split():
                base.push_san(san)
            if base.turn == self.side or base.epd() not in self.moves:
                continue
            for br in entries:
                b = base.copy()
                self.sev[(b.epd(), br["san"])] = br["severity"]
                self.add(b, prefix.split(), br["san"], BRANCH_WEIGHT[br["severity"]], f"deviation {move_label(b, br['san'])}")
                b.push_san(br["san"])
                self.walk(b, prefix.split() + [br["san"]], br.get("line", "").split(), BRANCH_LINE_WEIGHT,
                          f"deviation {move_label(base, br['san'])}")
        self.sidelines = []
        if with_sidelines and self.side == colour(op["orientation"]):
            self.sidelines = sidelines if sidelines is not None else \
                (generated("sidelines", op["id"]) or {}).get("sidelines", [])
            for item in self.sidelines:
                if not item.get("line"):
                    continue
                prefix = item["moves"].split()
                b = chess.Board()
                for san in prefix:
                    b.push_san(san)
                self.walk(b, prefix, [item["reply"]] + item["line"].split(), SIDELINE_WEIGHT, f"sideline {item['slug']}")

    def add(self, board, path, san, weight, where):
        epd = board.epd()
        self.owner.setdefault(epd, where)
        self.path.setdefault(epd, list(path))
        moves = self.moves.setdefault(epd, {})
        moves[san] = moves.get(san, 0) + weight

    def walk(self, board, path, sans, weight, where):
        path = list(path)
        for san in sans:
            self.add(board, path, san, weight, where)
            board.push_san(san)
            path.append(san)
        epd = board.epd()
        self.owner.setdefault(epd, where)
        self.path.setdefault(epd, path)
        self.moves.setdefault(epd, {})
        self.ends.add(epd)

    def __contains__(self, epd):
        return epd in self.moves

    def goes_on(self, epd):
        return bool(self.moves.get(epd))

    def learner_moves(self, epd):
        return self.moves.get(epd, {})

    def opening_positions(self):
        """Positions every chapter from this chair passes through (spar.ts sharedOpening)."""
        lines = [line["moves"].split() for line in self.op["lines"]
                 if colour(line.get("side", self.op["orientation"])) == self.side]
        shared = {chess.Board().epd()}
        board = chess.Board()
        for i in range(min(map(len, lines)) if lines else 0):
            if len({tuple(m[:i + 1]) for m in lines}) > 1:
                break
            board.push_san(lines[0][i])
            shared.add(board.epd())
        return shared


def club_counts(op_id, source="design"):
    """Club move counts by position, and a sentence saying where they came from.

    Two files can hold them. .engine/club/<id>.json (club-stats.py) has every position in the
    first moves of games in this opening, so a reply the course doesn't answer yet can be
    followed. src/content/club/<id>.json (club-moves.py) is committed and is what the sparring
    partner plays from, but only holds positions the course already reaches, from every game that
    reaches them. `spar` reads it alone, exactly what the trainer has. `design` (what sidelines.py decides with) takes whichever file has more games at
    each position: club-stats.py keeps only games where the course's side plays its --must moves,
    so a sideline where the learner answers differently (1.d4 b6 2.e4 in the London) is thin
    there and thick in the other. Shares are taken within one position, so mixing the two per
    position is sound."""
    files = {"content": os.path.join(ROOT, "src", "content", "club", f"{op_id}.json"),
             "engine": os.path.join(ROOT, ".engine", "club", f"{op_id}.json")}
    order = {"design": ["engine", "content"], "spar": ["content"]}[source]
    counts, used = {}, []
    for name in order:
        if not os.path.exists(files[name]):
            continue
        with open(files[name], encoding="utf-8") as f:
            data = json.load(f)
        for epd, moves in data["positions"].items():
            if not moves:
                continue
            if epd not in counts or (source == "design" and sum(moves.values()) > sum(counts[epd].values())):
                counts[epd] = Counter(moves)
        used.append(f"{os.path.relpath(files[name], ROOT)} ({data['source']}, {data['games']:,} games)")
    if not used:
        raise SystemExit(f"no club counts for {op_id}: run club-stats.py (see the skill) first")
    return counts, " and ".join(used)

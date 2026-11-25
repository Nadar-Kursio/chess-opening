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


def club_window(op_id):
    """The months of club games a course's numbers come from, as (since, until).

    CLUB_MONTHS=2026-10 or 2026-08:2026-10 when asked for; otherwise the window the course's
    committed club file was made from, so regenerating one file never quietly mixes in a newer
    month; otherwise (None, None), the latest month the explorer has."""
    asked = os.environ.get("CLUB_MONTHS")
    if asked:
        since, _, until = asked.partition(":")
        return since, until or since
    committed = generated("club", op_id) or {}
    return tuple(committed["window"]) if committed.get("window") else (None, None)


def club_counts(op_id, source="design"):
    """Club move counts by position, and a sentence saying where they came from.

    `design` (what coverage.py, sidelines.py and trap-scan.py decide with) asks the Lichess
    explorer, a position at a time and cached (_lichess.Club): every game in the course's window,
    whichever move order reached the position, so a reply the course doesn't answer yet can be
    followed as far as anyone played it. `spar` reads src/content/club/<id>.json (club-moves.py)
    alone, which is exactly what the trainer's sparring partner has. Both answer .get(epd) with a
    Counter of SAN to games, or None."""
    if source == "design":
        from _lichess import Club
        club = Club(*club_window(op_id))
        return club, club.source
    data = generated("club", op_id)
    if not data:
        raise SystemExit(f"no src/content/club/{op_id}.json: run club-moves.py (see the skill) first")
    counts = {epd: Counter(moves) for epd, moves in data["positions"].items() if moves}
    return counts, f"src/content/club/{op_id}.json ({data['source']}, {data['games']:,} games)"


def club_header(op_id, club=None):
    """What a generated file says about its club numbers: source, window, scanned, games, elo.

    `scanned` is every game in the window (the starting position's count) and `games` the ones
    that reach the position every chapter from the course's chair shares, 1.d4 for the London."""
    from _lichess import Club, RATINGS
    club = club or Club(*club_window(op_id))
    op = opening(op_id)
    side = colour(op["orientation"])
    lines = [line["moves"].split() for line in op["lines"] if colour(line.get("side", op["orientation"])) == side]
    board = chess.Board()
    for i in range(min(map(len, lines)) if lines else 0):
        if len({line[i] for line in lines}) > 1:
            break
        board.push_san(lines[0][i])
    return {"source": club.source, "window": [club.since, club.until],
            "scanned": club.games(chess.Board().epd()), "games": club.games(board.epd()),
            "elo": [RATINGS[0], RATINGS[-1] + 200]}

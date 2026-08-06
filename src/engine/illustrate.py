"""Boards for prose, derived from the moves the prose already names.

Course text is written the way a chess book is written -- the claims carry
their moves inline: "3...a6 4.Ba4 d6 ... 8.Qxd4?? c5!". This module is the
machine that finds those runs, anchors each one to a known position, and
replays it move by move on a real board, so a page can put the position beside
the sentence that talks about it and make the notation itself the control.

It serves any prose surface the same way -- the opening lesson today, an
article or a plan card tomorrow. A caller builds a seed pool with
`position_seeds` (or any {depth: [Board]} of its own), hands each text to an
`Illustrator`, and emits what comes back: the text cut into segments around
its moves, plus the board records the segments point into. One Illustrator per
board -- texts that share it share one seed pool and one story, which is how a
card of several paragraphs stays one sequence.

Anchoring works from the move number: "8.Qxd4" claims a position with White to
move at move eight, and the candidates for that position are, in order, the
positions this illustrator's earlier runs just built (a refutation like "play
8.Bd5 instead" branches off the trap it refutes, not off the main line) and
then the seed pool. The first candidate the whole run replays from legally is
the anchor. A run that replays from nowhere ships as plain prose with a
warning, never as a guessed board -- the boards here carry the same promise as
every other board on the page.

A run may also outrun its own story: "2...g6?? loses the rook to 3.Qxe5+,
3...Nf6?? is mate" reads as one numbered sequence, but 3...Nf6 answers a
different position than 3.Qxe5+ leaves. When a run stops replaying mid-way,
the part that replayed is kept and the rest re-anchors on its own number.
"""
import re

import chess

from engine.board import board_array

_SAN = (r"(?:O-O-O|O-O|[KQRBN][a-h1-8]?x?[a-h][1-8]"
        r"|[a-h]x[a-h][1-8](?:=[QRBN])?|[a-h][1-8](?:=[QRBN])?)[+#]?")
# "8." claims White's move, "8..." Black's. The tail lookahead keeps a move out
# of the middle of a longer word or a square-run like "Nb1-d2-f1-g3", which
# names squares, not moves.
_NUMBERED = re.compile(rf"(?<![\w.])(\d{{1,2}})(\.\.\.|\.) ?({_SAN})([!?]{{0,2}})(?![\w=–-])")
# A bare move only counts glued to the move before it ("5.exd5 Nxd5?!") --
# anywhere else "d5" is a square being talked about, not a move being played.
_BARE = re.compile(rf"({_SAN})([!?]{{0,2}})(?![\w=–-])")
_GLUE = re.compile(r"\s+")


def plays_moves(text):
    """Whether the text contains anything the illustrator would read as a move."""
    return bool(_NUMBERED.search(text) or _BARE.search(text))


def position_seeds(moves_lists):
    """Every position the given lines pass through, keyed by depth, deduped,
    in authored order -- the anchor candidates for a run's first move."""
    seeds, seen = {}, set()
    for moves in moves_lists:
        board = chess.Board()
        for depth, san in enumerate([None] + moves.split()):
            if san:
                try:
                    board.push_san(san)
                except ValueError:
                    break
            key = (depth, board.fen())
            if key not in seen:
                seen.add(key)
                seeds.setdefault(depth, []).append(board.copy())
    return seeds


def _tokens(text):
    """Every move the prose plays, in reading order, with its span kept."""
    out, pos = [], 0
    while True:
        m = _NUMBERED.search(text, pos)
        if not m:
            return out
        out.append({"span": (m.start(), m.end()), "no": int(m.group(1)),
                    "black": m.group(2) == "...", "san": m.group(3)})
        pos = m.end()
        while True:
            glue = _GLUE.match(text, pos)
            b = glue and _BARE.match(text, glue.end())
            if not b:
                break
            out.append({"span": (b.start(), b.end()), "san": b.group(1)})
            pos = b.end()


def _advance(claim):
    """The half-move after this one: (8, White) -> (8, Black) -> (9, White)."""
    no, black = claim
    return (no + 1, False) if black else (no, True)


def _runs(tokens):
    """Group tokens into claimed sequences by their numbering.

    A bare token always rides the token it is glued to; a numbered token
    continues the run only when it is the exact successor ("4...d6" after
    "4.Ba4"), otherwise it opens a run of its own. Whether a claimed sequence
    really is one is the replay's question, not the numbering's.
    """
    runs, run, expect = [], [], None
    for t in tokens:
        if "no" in t:
            claim = (t["no"], t["black"])
            if run and claim == expect:
                run.append(t)
            else:
                if run:
                    runs.append(run)
                run = [t]
            expect = _advance(claim)
        elif run:
            run.append(t)
            expect = _advance(expect)
    if run:
        runs.append(run)
    return runs


class Illustrator:
    """One board being written onto: its positions, chips and seed pool."""

    def __init__(self, seeds, warn, where):
        self.boards = []            # emitted board records
        self.chips = []             # (start, end, board index) in text order
        self.local = []             # (depth, chess.Board) this board reached
        self.hero = None
        self._best = 0
        self.found = self.resolved = 0
        self._seed_pool = seeds
        self._warn = warn
        self._where = where

    def _seeds(self, depth):
        # Newest local position first: a refutation answers the run it sits
        # next to, and only then the caller's own seed pool.
        for d, board in reversed(self.local):
            if d == depth:
                yield board
        yield from self._seed_pool.get(depth, [])

    def _replay(self, run):
        """The first seed the run replays from, with how far it got."""
        target = None, []
        depth = (run[0]["no"] - 1) * 2 + (1 if run[0]["black"] else 0)
        for seed in self._seeds(depth):
            board, got = seed.copy(), []
            for t in run:
                try:
                    move = board.parse_san(t["san"])
                except ValueError:
                    break
                board.push(move)
                got.append((move, board.copy()))
            if len(got) == len(run):
                return depth, seed, got
            if len(got) > len(target[1]):
                target = seed, got
        return depth, target[0], target[1]

    def take(self, text, run):
        self.found += 1
        depth, seed, got = self._replay(run)
        if not got:
            start, end = run[0]["span"]
            self._warn(f"{self._where}: '{text[start:end]}' replays from no "
                       "known position — left as prose")
            return
        self.resolved += 1
        anchor = len(self.boards)
        self.boards.append({"fen": board_array(seed), "from": None, "to": None,
                            "num": "", "turn": "w" if seed.turn else "b", "p": None})
        self.local.append((depth, seed))
        prev = anchor
        for t, (move, board) in zip(run, got):
            depth += 1
            here = len(self.boards)
            self.boards[prev]["n"] = here
            mover = "b" if board.turn else "w"
            record = {"fen": board_array(board),
                      "from": chess.square_name(move.from_square),
                      "to": chess.square_name(move.to_square),
                      "num": f"{(depth + 1) // 2}.{'' if mover == 'w' else '..'}{t['san']}",
                      "turn": mover, "p": prev}
            if board.is_check():
                record["check"] = True
            self.boards.append(record)
            self.chips.append((*t["span"], here))
            self.local.append((depth, board))
            prev = here
        if len(got) > self._best:
            self._best, self.hero = len(got), prev
        # What the numbering claimed past the replay re-anchors on its own
        # number; a bare tail has no number to re-anchor with.
        rest = run[len(got):]
        if rest and "no" in rest[0]:
            self.take(text, rest)

    def illustrate(self, text):
        """Cut one text around the moves that replayed. Boards and the seed
        pool accumulate across calls, so several texts sharing an illustrator
        share one board and one story."""
        self.chips = []
        for run in _runs(_tokens(text)):
            self.take(text, run)
        return self.segments(text)

    def segments(self, text):
        """The text cut around its chips, nothing added, nothing lost."""
        seg, pos = [], 0
        for start, end, board in self.chips:
            if start > pos:
                seg.append(text[pos:start])
            seg.append({"b": board, "t": text[start:end]})
            pos = end
        if pos < len(text):
            seg.append(text[pos:])
        return seg

    def finish(self, record):
        """Fold the boards into the record being emitted, when any run landed."""
        if self.boards:
            record["boards"] = self.boards
            record["hero"] = self.hero
        return record

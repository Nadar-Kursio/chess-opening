#!/usr/bin/env python3
"""Generate the engine tree a line ships for Explore mode.

    .venv/bin/python3 .claude/skills/opening-research/scripts/engine-tree.py ruylopez \
        --moves "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7"

Writes src/content/explore/<opening>.json, which the build inlines. Nothing here
runs during a build: this takes an hour and the build takes half a second, so the
tree is generated once, committed, and read as data.

WHAT IT PRODUCES

One node per position. A node carries the board, and every legal move from it
with the eval after that move and the engine's continuation. That shape is what
lets the browser answer "they played something else" for *any* legal move rather
than only the ones somebody wrote a paragraph about -- one MultiPV search at a
position prices every reply to it at once, which is the whole reason this is
affordable.

Two kinds of node:

  spine    a position on the line itself. Searched at --depth.
  answer   the position after the opponent leaves the line. Searched at
           --answer-depth, and only for the --expand best deviations, because a
           MultiPV-all search is minutes of engine time and there are thirty of
           them at every ply.

An unexpanded deviation is not a gap in the answer: it still carries its eval and
the engine's punishment, priced in the same search as every other reply. What it
does not carry is a sandbox -- you can read what the engine does about it, and
you cannot then play a fourth thing yourself and be told what that is worth.

RESUMING

Every search is cached by position under --cache, so a re-run after a crash, a
tweak to the tree shape or a longer spine only pays for what it has not already
searched. Delete the cache to re-search at a new depth -- entries are keyed by
depth too, so a depth change re-searches on its own, but the stale entries stay.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chess                                            # noqa: E402
import chess.engine                                     # noqa: E402
from _engine import ROOT, engine_path                   # noqa: E402
from engine.board import board_array                    # noqa: E402

# How far into a line the engine's continuation is kept. Eight plies is four
# moves each -- long enough to show why a deviation is bad and short enough that
# the reader is still looking at the same position when it ends.
PV_PLIES = 8

MATE = 10000

# Every move at this position keeps its continuation.
ALL = 10 ** 6


def analyse(eng, board, depth, cache):
    """Every legal move from this position, priced, best first.

    One MultiPV-all search. The alternative -- a separate search per move --
    costs the same nodes several times over and gives the engine no way to share
    what it learns between them.
    """
    key = f"{board.epd()}|{depth}"
    if key in cache:
        return cache[key]

    count = board.legal_moves.count()
    info = eng.analyse(board, chess.engine.Limit(depth=depth), multipv=count)
    out = []
    for one in info:
        pv = one.get("pv") or []
        if not pv:
            # A mate score can come back without a line. The move is then missing
            # from the position's list, and the browser reads that list as the
            # legal moves -- so it is said rather than swallowed.
            print(f"      no line for one of {count} moves at {board.epd()}", flush=True)
            continue
        work = board.copy()
        san = work.san(pv[0])
        work.push(pv[0])
        rest = work.variation_san(pv[1:PV_PLIES + 1]) if len(pv) > 1 else ""
        score = one["score"].white()
        out.append({
            "s": san,
            "f": chess.square_name(pv[0].from_square),
            "o": chess.square_name(pv[0].to_square),
            "v": score.score(mate_score=MATE),
            "n": score.mate(),
            "p": strip_numbers(rest),
        })
    cache[key] = out
    return out


def strip_numbers(variation):
    """'23...Nc6 24.Bb1' -> 'Nc6 Bb1'.

    The page numbers the plies itself, from the ply the line is actually on --
    which is not the one python-chess counts from when the variation starts
    mid-game.
    """
    return " ".join(tok.split(".")[-1] for tok in variation.split() if tok.strip("."))


def played(board, move, san):
    """One move, in the shape the browser needs to put it on a board.

    The page has no chess rules in it and is not getting any: `f` and `o` say
    which piece moves where, and the three optional keys say what else the move
    disturbs -- the rook a castle drags along, the square an en-passant capture
    empties, the piece a promotion leaves behind. Applying that is four lines of
    array writes, which is a very different thing from knowing the rules.
    """
    out = {"s": san,
           "f": chess.square_name(move.from_square),
           "o": chess.square_name(move.to_square)}
    if board.is_castling(move):
        rank = move.to_square & ~7
        short = chess.square_file(move.to_square) > chess.square_file(move.from_square)
        out["r"] = [chess.square_name(rank + (7 if short else 0)),
                    chess.square_name(rank + (5 if short else 3))]
    elif board.is_en_passant(move):
        out["x"] = chess.square_name(move.to_square + (-8 if board.turn == chess.WHITE else 8))
    if move.promotion:
        piece = chess.piece_symbol(move.promotion)
        out["q"] = piece.upper() if board.turn == chess.WHITE else piece
    if board.gives_check(move):
        out["k"] = 1
    return out


def variation(board, sans):
    """Replay a cached SAN continuation into browser-shaped moves."""
    work = board.copy()
    out = []
    for san in sans.split():
        move = work.parse_san(san)
        out.append(played(work, move, san))
        work.push(move)
    return out


def decorate(board, moves, pv_for):
    """The emitted move list for one position, from what the search returned.

    `pv_for` is how many of them keep the engine's continuation. On the line
    itself that is all of them -- every reply the opponent might choose is a
    deviation somebody has to be answered about. In the position a deviation
    reaches it is the top few, because there the question has turned round: the
    reader is choosing, and what they need is the right move and why, not a
    refutation of each of the thirty wrong ones.
    """
    out = []
    for i, entry in enumerate(moves):
        move = board.parse_san(entry["s"])
        record = played(board, move, entry["s"])
        record["v"] = entry["v"]
        if entry.get("n") is not None:
            record["n"] = entry["n"]
        if i < pv_for and entry.get("p"):
            after = board.copy()
            after.push(move)
            record["p"] = variation(after, entry["p"])
        out.append(record)
    return out


class Tree:
    """Positions, deduplicated, with the moves between them.

    Keyed by EPD for the same reason the build's branches are: the Chigorin and
    its deep dive share twenty-two plies, and a tree that stored those twice
    would ship them twice and let the two copies disagree.
    """

    def __init__(self, eng, depth, answer_depth, cache, flush):
        self.eng = eng
        self.depth = depth
        self.answer_depth = answer_depth
        self.cache = cache
        self.flush = flush
        self.nodes = []
        self.index = {}         # epd -> index into self.nodes
        self.searched = 0

    def node(self, board, depth, pv_for):
        """The node for this position, searched if it has not been already."""
        epd = board.epd()
        if epd in self.index:
            return self.index[epd]

        started = time.time()
        moves = analyse(self.eng, board, depth, self.cache)
        best = moves[0] if moves else {"v": 0, "n": None}
        i = len(self.nodes)
        self.index[epd] = i
        record = {
            "b": board_array(board),
            "t": "w" if board.turn == chess.WHITE else "b",
            "d": depth,
            "v": best["v"],
            "m": decorate(board, moves, pv_for),
        }
        if best.get("n") is not None:
            record["n"] = best["n"]
        if board.is_check():
            record["x"] = 1
        self.nodes.append(record)
        self.searched += 1
        print(f"  [{self.searched:>4}] {len(moves):>2} moves  d{depth}  "
              f"{time.time() - started:>5.1f}s  {epd.split(' ')[0][:28]}…", flush=True)
        # Written as we go rather than at the end. A run is an hour long, and one
        # that dies at fifty minutes should cost fifty minutes of nothing.
        if self.searched % 10 == 0:
            self.flush()
        return i

    def expand(self, parent, san, board, depth, pv_for):
        """Attach the position after `san` as a child of `parent`."""
        entry = next((m for m in self.nodes[parent]["m"] if m["s"] == san), None)
        if entry is None:
            return None                     # an illegal move; the caller reports it
        if "c" in entry:
            return entry["c"]
        work = board.copy()
        work.push_san(san)
        entry["c"] = self.node(work, depth, pv_for)
        return entry["c"]


ANSWER_PVS = 5


def build(tree, moves, expand, learner):
    """Walk the line, pricing every position on it and the best deviations from it.

    `learner` is the side the reader plays. Only the *opponent's* moves get their
    deviations expanded into sandboxes: a deviation by the reader is a move they
    chose to look at and can read the engine's answer to, while a deviation by
    the opponent is a position they have to actually play from.
    """
    board = chess.Board()
    spine = [tree.node(board, tree.depth, ALL)]
    for ply, san in enumerate(moves, 1):
        here = spine[-1]
        if board.turn != learner:
            wanted = [m["s"] for m in tree.nodes[here]["m"] if m["s"] != san][:expand]
            print(f"— ply {ply}: expanding {len(wanted)} deviations from "
                  f"{'' if board.turn == chess.WHITE else '…'}{san}", flush=True)
            for other in wanted:
                tree.expand(here, other, board, tree.answer_depth, ANSWER_PVS)
        # Through expand(), not node(), so the line's own move is linked to the
        # position it reaches like every other move is. Playing the book move in
        # the browser is then the same operation as playing anything else, and
        # walking back onto the line needs no case of its own.
        spine.append(tree.expand(here, san, board, tree.depth, ALL))
        board.push_san(san)
    return spine


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening", help="the opening id, e.g. ruylopez")
    ap.add_argument("--moves", required=True, help="the line to cover, space-separated SAN")
    ap.add_argument("--depth", type=int, default=18, help="search depth on the line itself")
    ap.add_argument("--answer-depth", type=int, default=16,
                    help="search depth in the positions a deviation reaches")
    ap.add_argument("--expand", type=int, default=8,
                    help="how many deviations per opponent move get a sandbox")
    ap.add_argument("--threads", type=int, default=3)
    ap.add_argument("--cache", default=os.path.join(ROOT, ".engine", "tree-cache.json"))
    args = ap.parse_args()

    moves = args.moves.split()
    board = chess.Board()
    for i, san in enumerate(moves, 1):
        try:
            board.push_san(san)
        except Exception as e:
            raise SystemExit(f"ply {i} '{san}': {e}")
    from importlib import import_module
    op = import_module(f"content.openings.{args.opening}").OPENING
    learner = chess.WHITE if op["orientation"] == "white" else chess.BLACK

    cache = {}
    if os.path.exists(args.cache):
        with open(args.cache, encoding="utf-8") as f:
            cache = json.load(f)
        print(f"cache: {len(cache)} positions already searched")

    def flush():
        os.makedirs(os.path.dirname(args.cache), exist_ok=True)
        with open(args.cache, "w", encoding="utf-8") as f:
            json.dump(cache, f)

    eng = chess.engine.SimpleEngine.popen_uci(engine_path())
    eng.configure({"Threads": args.threads, "Hash": 1024})
    name = eng.id.get("name", "Stockfish")
    started = time.time()
    tree = Tree(eng, args.depth, args.answer_depth, cache, flush)
    try:
        spine = build(tree, moves, args.expand, learner)
    finally:
        eng.quit()
        flush()

    out = os.path.join(ROOT, "src", "content", "explore", f"{args.opening}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    payload = {
        "engine": name,
        "depth": args.depth,
        "answerDepth": args.answer_depth,
        "generated": time.strftime("%Y-%m-%d", time.gmtime()),
        "nodes": tree.nodes,
        "spines": [{"moves": " ".join(moves), "at": spine}],
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))
    mins = (time.time() - started) / 60
    print(f"\nwrote {os.path.relpath(out, ROOT)}  "
          f"{len(tree.nodes)} positions, {os.path.getsize(out) // 1024} KB, "
          f"{tree.searched} searched in {mins:.0f} min")


if __name__ == "__main__":
    main()

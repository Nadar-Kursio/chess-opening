#!/usr/bin/env python3
"""Check the arithmetic and the legality of moves cited in authored prose.

    .venv/bin/python3 .claude/skills/opening-research/scripts/verify-prose.py scotch
    … verify-prose.py italian --counts        # also dump counts for claim words

Needs no engine. Two things nothing else in the repo looks at:

MOVES CITED IN PROSE. The build parses `moves` and `line`; a move named in a
`why`, a note or a plan card is never touched. Both of these shipped:

    "Not 6...Nf6, which allows Bg5"   -- Black's own queen was on f6
    "6.Bxc5 wins a piece"             -- White's own knight blocked e3-c5

A numbered move is a claim about a specific position, so it can be checked. Bare
moves are used only to follow a variation the prose is spelling out: "8.Bxd5 Qf6
9.Qg3+" is checked as a sequence, not three claims about the main line.

CLAIM WORDS. "the bishop pair", "an open file", "a queenside majority", "a pawn
up" are the sentences that go wrong, and they go wrong by arithmetic rather than
judgement. `--counts` prints what is actually on the board next to every sentence
that uses one, so the author compares numbers instead of remembering them.

Exits non-zero if a cited move is illegal.
"""
import argparse
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import chess                                       # noqa: E402
from _engine import numbered, opening              # noqa: E402

SAN = r"(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x?[a-h][1-8](?:=[QRBN])?|[a-h][1-8])"
# A numbered move: the number and the dots say which position it claims to be.
NUMBERED = re.compile(rf"\b(\d{{1,3}})\.(\.\.\.|\.\.)?\s?({SAN})([!?+#]*)")
# A bare move directly after another move, which is how prose spells a variation.
# No \A: it anchors to the start of the string, not to the `pos` given to match().
BARE = re.compile(rf" ({SAN})([!?+#]*)")

# Prose sometimes names a move in order to say it cannot be played, or to name a
# threat that is answered rather than allowed. Both are facts worth stating -- four
# lines in this course turn on one -- so a cue in the SAME SENTENCE as the citation
# excuses it.
#
# Sentence scope is what makes this safe rather than a way of losing findings. A
# whole-text search let "The threat is not mate" one sentence later excuse a move
# that was blocked by White's own knight, and "cannot take" is not a cue at all:
# it describes a bad move, not an impossible one, and that distinction is exactly
# where a real error was hiding.
DELIBERATE = ("legal", "impossible", "threat", "stop", "prevent",
              "does not exist", "unavailable", "no longer available")
# A terminator only ends a sentence after a letter -- "19.Qd3" and "18...h6" are
# full of dots that end nothing.
SENTENCE = re.compile(r"(?<=[a-z)\]])[.!?;:]\s")

CLAIM_WORDS = ("bishop pair", "two bishops", "open file", "open files", "half-open",
               "majority", "a piece for", "a piece up", "pawn up", "pawns up",
               "pawn down", "pawns down", "passed pawn", "passer", "a clean pawn",
               "material is level", "material comes out level")

# A sentence about who covers what is checkable square by square, and it is where
# the errors that survive everything else live: "the bishop on b7 guards g2" (it is
# blocked by Black's own knight -- the guard is the rook on g8), "four attackers on
# f4" (three), "the last square for the bishop" (it had six).
GEOMETRY_WORDS = ("guard", "defend", "attack", "cover", "hits", "hit ", "hold",
                  "protect", "control", "undefended", "unprotected")
SQUARE = re.compile(r"\b([a-h][1-8])\b")
VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}


def board_at(moves, ply):
    """The position after `ply` plies of `moves`, or None if it does not get there."""
    board = chess.Board()
    for i, san in enumerate(moves.split()):
        if i >= ply:
            break
        try:
            board.push_san(san)
        except ValueError:
            return None
    return board if board.ply() == ply else None


def sentence_at(text, pos):
    """The sentence `pos` falls in — the scope a legality cue has to appear in."""
    bounds = [0] + [m.end() for m in SENTENCE.finditer(text)] + [len(text)]
    for start, stop in zip(bounds, bounds[1:]):
        if start <= pos < stop:
            return text[start:stop].strip()
    return text


def cited_moves(text, moves, loose=False):
    """Yield (claim, problem, sentence) for every numbered move in `text` that is illegal.

    `moves` may be one sequence or several. `theory` and `progression` belong to
    the whole opening, so they get every line as a candidate and are checked
    `loose`: a citation is reported only when it fails to continue a variation the
    text has already established. A bare "the Traxler 4...Bc5" in a list of names
    is not a claim about any position on the page, and treating it as one reported
    fourteen sound sentences as errors.

    A move number names a position, but prose does not stay on one line: it says
    "the automatic 4.d4 exd4 5.Nxd4?? … if you play 4.d4 the follow-up is 5.O-O",
    doubling back to offer a second fifth move. So this keeps every position the
    text has established at each move number, plus the authored line's own, and
    reports a citation only when it is illegal from all of them. Checking against
    the authored line alone called nine sound sentences wrong.
    """
    sequences = [moves] if isinstance(moves, str) else list(moves)
    seen = {}               # ply -> boards the text has established there
    chain = None            # ([boards], next_ply) for the variation being spelled out
    end = 0

    def remember(boards):
        for board in boards:
            seen.setdefault(board.ply(), []).append(board.copy())

    def advance(boards, san):
        """Every board that accepts `san`, plus the reason if none do.

        All of them, deliberately. When several lines reach the same move number
        the first one that happens to accept a move is not necessarily the one the
        sentence is about -- "in the Sämisch, 9.g4" is legal in the Classical too,
        and judging the follow-up from there reported a sound trap as broken.
        """
        out, problem = [], "illegal"
        for board in boards:
            work = board.copy()
            try:
                work.push_san(san)
            except ValueError as e:
                problem = str(e).split(" in ")[0]
                continue
            out.append(work)
        return out[:8], problem

    for m in NUMBERED.finditer(text):
        num, dots, san, _ = m.groups()
        ply = 2 * (int(num) - 1) + (2 if dots else 1)
        continues = bool(chain and chain[1] == ply and m.start() >= end)
        bases = list(chain[0]) if continues else []
        bases += seen.get(ply - 1, [])
        for sequence in sequences:
            if (line := board_at(sequence, ply - 1)) is not None:
                bases.append(line)
        if not bases:
            chain = None
            continue            # nothing reaches that move number; nothing to say
        played, problem = advance(bases, san)
        if not played:
            if not loose or continues:
                yield f"{num}.{'..' if dots else ''}{san}", problem, sentence_at(text, m.start())
            chain = None
            continue
        remember(played)
        chain, end = (played, ply + 1), m.end()
        # Follow the variation while the prose keeps handing over moves.
        while (nxt := BARE.match(text, end)):
            step, _ = advance(played, nxt.group(1))
            if not step:
                break           # ordinary prose that happens to look like a move
            played = step
            remember(played)
            chain, end = (played, played[0].ply() + 1), nxt.end()


def balance(board):
    """Material from White's point of view, in pawns. 'A piece up' should be 3."""
    return sum(VALUES[p] * (len(board.pieces(p, chess.WHITE)) - len(board.pieces(p, chess.BLACK)))
               for p in VALUES)


def guards(board, text):
    """Who attacks each square the text names, so 'X guards Y' can be checked."""
    out = []
    for name in dict.fromkeys(SQUARE.findall(text)):
        square = chess.parse_square(name)
        w = sorted(chess.square_name(s) for s in board.attackers(chess.WHITE, square))
        b = sorted(chess.square_name(s) for s in board.attackers(chess.BLACK, square))
        piece = board.piece_at(square)
        out.append(f"{name}[{piece.symbol() if piece else '-'}] W:{','.join(w) or '-'} "
                   f"B:{','.join(b) or '-'}")
    return out


def counts(board):
    """The facts the claim words get wrong, as one line."""
    out = []
    for colour, who in ((chess.WHITE, "W"), (chess.BLACK, "B")):
        pawns = sorted(chess.square_name(s) for s in board.pieces(chess.PAWN, colour))
        wing = {"q": [p for p in pawns if p[0] < "d"], "k": [p for p in pawns if p[0] > "e"]}
        out.append(f"{who}: {len(pawns)}p ({''.join(sorted(p[0] for p in pawns))}) "
                   f"q{len(wing['q'])}/{len(set(p[0] for p in wing['q']))}f "
                   f"k{len(wing['k'])}/{len(set(p[0] for p in wing['k']))}f "
                   f"{len(board.pieces(chess.BISHOP, colour))}B"
                   f"{len(board.pieces(chess.KNIGHT, colour))}N"
                   f"{len(board.pieces(chess.ROOK, colour))}R"
                   f"{len(board.pieces(chess.QUEEN, colour))}Q")
    out.append(f"balance {balance(board):+d}")
    files = []
    for f in range(8):
        w = any(board.piece_at(chess.square(f, r)) == chess.Piece(chess.PAWN, chess.WHITE)
                for r in range(8))
        b = any(board.piece_at(chess.square(f, r)) == chess.Piece(chess.PAWN, chess.BLACK)
                for r in range(8))
        if not w and not b:
            files.append(f"{chr(97 + f)}:open")
        elif not w:
            files.append(f"{chr(97 + f)}:W-half")
        elif not b:
            files.append(f"{chr(97 + f)}:B-half")
    return "  ".join(out) + ("   " + " ".join(files) if files else "   no open files")


def texts(op):
    """Yield (where, moves, ply, text) for every piece of authored prose.

    `theory` and `progression` are checked against line 0's moves from the
    starting position, because they belong to the opening rather than to a ply.
    That is enough: a trap spells its own sequence out from move one, so the
    first citation establishes the variation and the rest follow it. These two
    were unchecked for a long time, and `theory.traps` is nothing *but* move
    sequences -- two false refutations were found hiding there.
    """
    main = [l["moves"] for l in op["lines"]] + ([op["deep"]["moves"]] if op.get("deep") else [])
    theory = op.get("theory") or {}
    for key in ("big_idea", "structure", "who"):
        if theory.get(key):
            yield f"theory.{key}", main, 0, theory[key]
    for key in ("white_plans", "black_plans", "traps"):
        for n, item in enumerate(theory.get(key) or []):
            yield f"theory.{key}[{n}]", main, 0, item
    prog = op.get("progression") or {}
    for key in ("arc", "study", "next"):
        if isinstance(prog.get(key), str):
            yield f"progression.{key}", main, 0, prog[key]
    for n, stage in enumerate(prog.get("stages") or []):
        for key in ("when", "goal", "drill", "mistake", "ready"):
            if stage.get(key):
                yield f"progression[{n}].{key}", main, 0, stage[key]
        for m, item in enumerate(stage.get("learn") or []):
            yield f"progression[{n}].learn[{m}]", main, 0, item

    for i, line in enumerate(op["lines"] + [op["deep"]]):
        label = f"line {i}" if i < len(op["lines"]) else "deep"
        plies = len(line["moves"].split())
        yield f"{label} intro", line["moves"], 0, line.get("note", "")
        for ply, note in sorted(line["notes"].items()):
            yield f"{label} note {ply}", line["moves"], ply, note
        plan = line.get("plan") or {}
        for key in ("point", "endgame"):
            if plan.get(key):
                yield f"{label} plan {key}", line["moves"], plies, plan[key]
        for n, nxt in enumerate(plan.get("next") or []):
            yield f"{label} plan next {n}", line["moves"], plies, nxt
    for prefix, entries in (op.get("branches") or {}).items():
        base = len(prefix.split())
        for br in entries:
            seq = " ".join([prefix, br["san"], br.get("line", "")]).split()
            yield (f"branch {prefix.split()[-1]}→{br['san']}", " ".join(seq),
                   base + 1, br.get("why", ""))
    for game in op.get("games") or []:
        for ply, note in sorted((game.get("notes") or {}).items()):
            yield f"game {game['id']} note {ply}", game["moves"], ply, note


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("opening")
    ap.add_argument("--counts", action="store_true",
                    help="print board counts beside every sentence using a claim word")
    args = ap.parse_args()

    op = opening(args.opening)
    bad = stated = claims = 0
    for where, moves, ply, text in texts(op):
        if not text:
            continue
        loose = not isinstance(moves, str)
        for claim, why, sentence in cited_moves(text, moves, loose=loose):
            if any(word in sentence.lower() for word in DELIBERATE):
                stated += 1
                print(f"-- {where}: cites {claim}, illegal, and the sentence says so.")
                continue
            bad += 1
            print(f"!! {where}: cites {claim}, which is illegal there — {why}")
            print(f"   {sentence[:200]}")
        if args.counts:
            low = text.lower()
            hits = [w for w in CLAIM_WORDS if w in low]
            geometry = [w for w in GEOMETRY_WORDS if w in low]
            if hits or geometry:
                claims += 1
                board = board_at(moves, ply)
                seq = moves.split()
                at = numbered(ply, seq[ply - 1]) if 0 < ply <= len(seq) else "start"
                print(f"\n-- {where} @ {at}   [{', '.join(hits + geometry)}]")
                if board is None:
                    print("   position not reachable")
                else:
                    print(f"   {counts(board)}")
                    for row in guards(board, text)[:8]:
                        print(f"      {row}")
                print(f"   {text[:200]}")

    print(f"\n{bad} cited move(s) illegal, {stated} more the text calls illegal on purpose."
          + (f"  {claims} sentence(s) with a claim word — check each against the counts."
             if args.counts else "  Add --counts to audit the claim words too."))
    raise SystemExit(1 if bad else 0)


if __name__ == "__main__":
    main()

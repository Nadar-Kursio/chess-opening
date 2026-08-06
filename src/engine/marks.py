"""Classify every scored move the way chess.com annotates a game.

A mark is derived, never authored: it is arithmetic over the Stockfish scores
in src/content/evals/ plus a material reading of the move itself, so it carries
the engine's authority and nothing else. The cost of a move is what it did to
the score from its player's point of view, and the bands are the ones the
research skill already calibrates severities on -- the same numbers the web
app's evalSeverity uses, so the tape's icon and the coach's sentence can never
disagree about how bad a move was.

Two marks are earned rather than avoided:

  great      -- the accurate reply to a blunder. With one score per position
                there is no multipv "only move" to detect; what CAN be read off
                the numbers is that the opponent just handed the game over and
                this move banked it, which is the moment a learner most needs
                pointed at in a trap line.
  brilliant  -- a sound sacrifice: the move offers at least a minor piece's
                worth of material (a pawn sac is a gambit, not a brilliancy)
                and the score holds anyway. Material is read by a static
                exchange on the arrival square, python-chess supplying
                legality, so a pinned defender or a protected-by-tactics piece
                is judged by what can actually be captured.

Positions the eval files do not cover get no mark at all -- half a subtraction
is not a cost, exactly the EvalMove rule in the browser.
"""
import chess

MARKS = ("brilliant", "great", "inaccuracy", "blunder")

# The severity bands, in centipawns of cost. HOLD is the noise floor between
# two depth-20 searches: a "sacrifice" that also drops half a pawn is just a
# mistake wearing a costume, so brilliant and great demand the score stand
# still within it. The last two read the position rather than the move, from
# its player's side: past LOSING nothing is brilliant -- a queen flung at a
# king that already has you mated is despair, not a sacrifice -- and past
# DECIDED an extra half-pawn dropped is bookkeeping, not a lesson, though a
# full blunder still earns its mark.
BLUNDER = 300
INACCURACY = 50
HOLD = 30
LOSING = 90
DECIDED = 250

# Pawn units for the exchange reading. The king's value never enters a total --
# it can capture but not be captured -- so it only needs to sort last when
# choosing the cheapest attacker.
VALUE = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
         chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 100}

# A minor piece for a pawn is the smallest deficit that reads as a sacrifice.
SAC = 2


def _capture(board, frm, to):
    piece = board.piece_type_at(frm)
    if piece == chess.PAWN and chess.square_rank(to) in (0, 7):
        return chess.Move(frm, to, promotion=chess.QUEEN)
    return chess.Move(frm, to)


def _exchange(board, square):
    """Best material the side to move wins by starting captures on `square`.

    The classic static exchange: each side captures with its cheapest legal
    attacker and either side may stop when continuing loses. Never negative --
    declining the exchange is always available.
    """
    victim = board.piece_type_at(square)
    if victim is None:
        return 0
    for frm in sorted(board.attackers(board.turn, square),
                      key=lambda s: VALUE[board.piece_type_at(s)]):
        move = _capture(board, frm, square)
        if not board.is_legal(move):
            continue        # pinned, or a king walking into a defended square
        work = board.copy(stack=False)
        work.push(move)
        return max(0, VALUE[victim] - _exchange(work, square))
    return 0


def sacrifice(board, move):
    """Whether `move` offers at least a minor piece's worth of material.

    `board` is the position BEFORE the move. What the move captured, minus the
    best exchange the opponent can now start on the arrival square: -2 or worse
    means the piece is given, not traded. The score deciding whether the gift
    was sound is classify()'s half of the verdict.
    """
    if board.is_en_passant(move):
        taken = VALUE[chess.PAWN]
    else:
        victim = board.piece_type_at(move.to_square)
        taken = VALUE[victim] if victim else 0
    work = board.copy(stack=False)
    work.push(move)
    return taken - _exchange(work, move.to_square) <= -SAC


def _cost(before, after):
    """What the move between two scored plies cost its player, in centipawns.

    Positive means the player of `after` gave something away; the sign flip is
    because scores are always from White's point of view. Plain `ev` arithmetic
    is enough even at the board's edge: position-evals.py writes mates
    saturated, +/-(10000 - n), so a mate delivered outranks mate-in-one
    outranks every centipawn score without a special case here.
    """
    swing = after["ev"] - before["ev"]
    return -swing if after["turn"] == "w" else swing


def classify(plies, sacs, before=None):
    """Hang a `mark` on every ply that earned one.

    `sacs[i]` says whether plies[i]'s move offered material. plies[0] is never
    marked: a line's is the starting position, and a branch's first move
    already carries its authored, engine-verified severity -- a second, cruder
    verdict beside it could only agree or embarrass it. `before` is the scored
    position a branch answers, so the branch move's cost still exists and its
    refutation can earn the great mark.
    """
    costs = [None] * len(plies)
    if before is not None and "ev" in before and "ev" in plies[0]:
        costs[0] = _cost(before, plies[0])
    for i in range(1, len(plies)):
        if "ev" not in plies[i - 1] or "ev" not in plies[i]:
            continue
        cost = _cost(plies[i - 1], plies[i])
        costs[i] = cost
        pov = 1 if plies[i]["turn"] == "w" else -1
        if cost <= HOLD and sacs[i] and pov * plies[i]["ev"] >= -LOSING:
            plies[i]["mark"] = "brilliant"
        elif cost <= HOLD and costs[i - 1] is not None and costs[i - 1] >= BLUNDER:
            plies[i]["mark"] = "great"
        elif cost >= BLUNDER:
            plies[i]["mark"] = "blunder"
        elif cost >= INACCURACY and pov * plies[i - 1]["ev"] > -DECIDED:
            plies[i]["mark"] = "inaccuracy"

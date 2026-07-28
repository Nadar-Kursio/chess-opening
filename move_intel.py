"""
Generate accurate, engine-derived instructional data for every move:
  - arrows: {f, t, k}  where k in {move, atk, chk, def, ctrl}
  - tactics: a short plain-language "what this move does" line
All derived from python-chess on the position AFTER the move, so it is always correct.
"""
import chess

PIECE_NAME = {
    chess.PAWN: "pawn", chess.KNIGHT: "knight", chess.BISHOP: "bishop",
    chess.ROOK: "rook", chess.QUEEN: "queen", chess.KING: "king",
}
VALUE = {chess.PAWN:1, chess.KNIGHT:3, chess.BISHOP:3, chess.ROOK:5, chess.QUEEN:9, chess.KING:100}

# The squares we care about for "controls a key central square"
CENTER = {chess.C4, chess.D4, chess.E4, chess.F4, chess.C5, chess.D5, chess.E5, chess.F5,
          chess.D3, chess.E3, chess.D6, chess.E6}
CENTER_PRIORITY = [chess.D5, chess.E5, chess.D4, chess.E4, chess.C5, chess.F5,
                   chess.C4, chess.F4, chess.D6, chess.E6, chess.D3, chess.E3]


def move_data(board_before, move):
    """board_before is the position BEFORE `move`. Returns (arrows, tactics_string)."""
    mover = board_before.turn                       # color that is moving
    board = board_before.copy()
    board.push(move)                                # now board is AFTER the move

    frm = chess.square_name(move.from_square)
    to_sq = move.to_square
    to = chess.square_name(to_sq)
    piece = board.piece_at(to_sq)                   # the moved piece (after promotion if any)

    arrows = [{"f": frm, "t": to, "k": "move"}]
    attacks_sqs, defends_sqs, control_sqs = [], [], []
    check = board.is_check()

    # What does the moved piece now hit from its new square?
    for s in board.attacks(to_sq):
        tgt = board.piece_at(s)
        sn = chess.square_name(s)
        if tgt is None:
            if s in CENTER:
                control_sqs.append(s)
            continue
        if tgt.color != mover:
            # attacking an enemy piece
            if tgt.piece_type == chess.KING:
                # handled by check flag; still draw a check arrow
                if check:
                    arrows.append({"f": to, "t": sn, "k": "chk"})
            else:
                arrows.append({"f": to, "t": sn, "k": "atk"})
                attacks_sqs.append((s, tgt))
        else:
            # defending a friendly piece -- only note it if that piece is under enemy fire
            if board.is_attacked_by(not mover, s) and tgt.piece_type != chess.KING:
                arrows.append({"f": to, "t": sn, "k": "def"})
                defends_sqs.append((s, tgt))

    # Control arrows: keep the board clean -- at most 2, most-central first
    control_sqs = [s for s in CENTER_PRIORITY if s in control_sqs][:2]
    for s in control_sqs:
        arrows.append({"f": to, "t": chess.square_name(s), "k": "ctrl"})

    # ---- Build the plain-language summary ----
    parts = []
    if check:
        parts.append("gives check")
    if attacks_sqs:
        # flag genuine threats (attacks an undefended piece, or a bigger piece)
        labels = []
        for s, tgt in attacks_sqs:
            name = PIECE_NAME[tgt.piece_type]
            defended = board.is_attacked_by(not mover, s)
            hanging = (not defended) or (VALUE[tgt.piece_type] > VALUE[piece.piece_type])
            sn = chess.square_name(s)
            labels.append(f"the {name} on {sn}" + (" (undefended!)" if hanging and not defended else ""))
        parts.append("attacks " + _join(labels))
    if defends_sqs:
        labels = [f"the {PIECE_NAME[t.piece_type]} on {chess.square_name(s)}" for s, t in defends_sqs]
        parts.append("defends " + _join(labels))
    if control_sqs:
        parts.append("controls " + _join([chess.square_name(s) for s in control_sqs]))

    if not parts:
        # fall back to a principle-based description
        ptype = piece.piece_type
        if ptype == chess.KING and abs(move.from_square % 8 - move.to_square % 8) == 2:
            tactics = "castles — tucks the king to safety and connects the rooks"
        elif ptype in (chess.KNIGHT, chess.BISHOP):
            tactics = "develops a piece toward the centre"
        elif ptype == chess.PAWN:
            tactics = "a quiet pawn move, shoring up the structure"
        else:
            tactics = "a repositioning move"
    else:
        tactics = _cap(_join_parts(parts))
    return arrows, tactics


def _join(items):
    items = list(items)
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return items[0] + " and " + items[1]
    return ", ".join(items[:-1]) + ", and " + items[-1]


def _join_parts(parts):
    # parts like ["gives check", "attacks ...", "controls ..."]
    if len(parts) == 1:
        return parts[0]
    return "; ".join(parts)


def _cap(s):
    return s[0].upper() + s[1:] if s else s

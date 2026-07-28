import chess


def board_array(board):
    """Return 64-char string, rank8->rank1, uppercase=white, '.'=empty."""
    out = []
    for rank in range(7, -1, -1):
        for f in range(8):
            p = board.piece_at(chess.square(f, rank))
            out.append(p.symbol() if p else ".")
    return "".join(out)

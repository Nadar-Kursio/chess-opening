import json, chess
from data_common import COMMON
from data_white_e4 import WHITE_E4
from data_white_d4 import WHITE_D4
from data_black_e4 import BLACK_E4
from data_black_d4 import BLACK_D4
from data_prog_white import PROG_WHITE
from data_prog_black import PROG_BLACK
from data_deep import DEEP
from data_four_knights import FOUR_KNIGHTS, DEEP_FOUR_KNIGHTS, PROG_FOUR_KNIGHTS
from move_intel import move_data
WHITE_E4 = WHITE_E4 + [FOUR_KNIGHTS]
DEEP = {**DEEP, "fourknights": DEEP_FOUR_KNIGHTS}
PROG = {**PROG_WHITE, **PROG_BLACK, "fourknights": PROG_FOUR_KNIGHTS}

ALL = WHITE_E4 + WHITE_D4 + BLACK_E4 + BLACK_D4


# --- Alignment corrections found by auditing every annotation against its move ---
# value: list of (min_note_key, shift) applied to keys >= min_note_key
SHIFTS = {
 ("italian",0):[(0,1)], ("italian",1):[(0,1)], ("italian",2):[(0,1)],
 ("ruylopez",0):[(0,1)], ("ruylopez",1):[(0,1)], ("ruylopez",2):[(0,1)],
 ("scotch",0):[(0,1)], ("scotch",1):[(0,1)], ("scotch",2):[(0,1)],
 ("queensgambit",1):[(11,1)],
 ("sicilian",2):[(0,1)],
 ("kid",0):[(23,1)],
}

EXTRA = {
 ("italian",1,6): "Black mirrors. Both bishops now stare at the opponent's weakest square, f7 and f2. This is the Giuoco Piano — and the position White wants for the Evans.",
 ("italian",1,18): "The only square. Now White plays Re1, Ba3 and Nbd2 with a raging initiative. Practically speaking, most club players lose this as Black.",
 ("ruylopez",1,6): "The Morphy Defence. Black puts the question to the bishop first — which is exactly what invites the Exchange Variation.",
 ("queensgambit",1,11): "Development. White is in no hurry: every piece has an obvious square and there is nothing to attack.",
 ("catalan",1,5): "The Catalan move. Instead of Nc3, White prepares the fianchetto so the g2-bishop can pressure the queenside for the rest of the game.",
 ("catalan",1,6): "Black takes the classical centre.",
 ("catalan",1,7): "The Catalan bishop takes its post. From here it eyes d5, c6, b7 and a8 — permanently.",
 ("catalan",1,8): "Development.",
 ("catalan",1,9): "Development, adding pressure to d5.",
 ("catalan",1,10): "King safety.",
 ("catalan",1,11): "King safety. Now Black must decide: take on c4 (Open) or hold the centre (Closed).",
 ("catalan",2,5): "The Catalan setup. White fianchettoes before committing the queen's knight.",
 ("sicilian",2,9): "Development, guarding e4 and eyeing d5 — the square the whole Sveshnikov is about.",
 ("kid",0,23): "White gets on with it. The bishop clears the way for Rc1, b4 and c5. Nobody is defending: White has counted the tempi and believes the queenside break arrives first.",
}

START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

def board_array(board):
    """Return 64-char string, rank8->rank1, uppercase=white, '.'=empty."""
    out = []
    for rank in range(7, -1, -1):
        for f in range(8):
            p = board.piece_at(chess.square(f, rank))
            out.append(p.symbol() if p else ".")
    return "".join(out)

errors = []
out = []

for op in ALL:
    if op["id"] in DEEP:
        d = DEEP[op["id"]]
        main = op["lines"][0]["moves"].split()
        deep = d["moves"].split()
        assert deep[:len(main)] == main, f"deep prefix mismatch for {op['id']}"
        mrules = SHIFTS.get((op["id"], 0), [(0, 0)])
        inherited = {}
        for k, v in op["lines"][0].get("notes", {}).items():
            sh = 0
            for mink, s_ in mrules:
                if k >= mink: sh = s_
            inherited[k + sh] = v
        for (oid, lidx, ply_), txt in EXTRA.items():
            if oid == op["id"] and lidx == 0:
                inherited[ply_] = txt
        merged = dict(inherited); merged.update(d["notes"])
        op = dict(op)
        op["lines"] = op["lines"] + [{"name": d["name"], "note": d["note"],
                                      "moves": d["moves"], "notes": merged,
                                      "inherit": op["id"]}]
    op_out = dict(op)
    lines_out = []
    for li, line in enumerate(op["lines"]):
        sans = line["moves"].split()
        raw = line.get("notes", {})
        rules = SHIFTS.get((op["id"], li), [(0, 0)])
        notes = {}
        for k, v in raw.items():
            sh = 0
            for mink, s in rules:
                if k >= mink:
                    sh = s
            notes[k + sh] = v
        board = chess.Board()
        plies = [{
            "san": "", "fen": board_array(board), "from": None, "to": None,
            "note": "The starting position. White moves first — and that single tempo is the whole reason opening theory exists.",
            "num": "", "turn": "w"
        }]
        for i, san in enumerate(sans):
            try:
                mv = board.parse_san(san)
            except Exception as e:
                errors.append(f"{op['id']} / line {li} '{line['name']}' / ply {i+1} '{san}': {e}")
                break
            mover = "w" if board.turn == chess.WHITE else "b"
            arrows, tactics = move_data(board, mv)   # board is the position BEFORE the move
            board.push(mv)
            ply = i + 1
            movenum = (ply + 1) // 2
            label = f"{movenum}." + ("" if mover == "w" else "..") + san
            note = notes.get(ply)
            note = EXTRA.get((op["id"], li, ply), note)
            if not note:
                note = COMMON.get(f"{ply}:{san}")
            if not note:
                note = None
            plies.append({
                "san": san, "fen": board_array(board),
                "from": chess.square_name(mv.from_square),
                "to": chess.square_name(mv.to_square),
                "note": note, "num": label, "turn": mover,
                "check": board.is_check(),
                "arrows": arrows, "tactics": tactics,
            })
        lines_out.append({
            "name": line["name"],
            "note": line.get("note", ""),
            "plies": plies,
        })
    op_out["lines"] = lines_out
    op_out["progression"] = PROG[op["id"]]
    out.append(op_out)

if errors:
    print("=== ILLEGAL MOVES FOUND ===")
    for e in errors:
        print(" ", e)
else:
    print("All moves legal.")

missing = 0
total = 0
for op in out:
    for line in op["lines"]:
        for p in line["plies"][1:]:
            total += 1
            if not p["note"]:
                missing += 1
                print("  no note:", op["id"], "|", line["name"], "|", p["num"])
print(f"{total} moves, {missing} without commentary")

data_str = json.dumps(out, separators=(",", ":"))
with open("openings.json", "w") as f:
    f.write(data_str)
print("wrote openings.json", len(data_str) // 1024, "KB")

# Inject the data into the HTML template to produce the final, shippable app.
with open("shell.html") as f:
    shell = f.read()
if "__DATA__" not in shell:
    raise SystemExit("shell.html is missing the __DATA__ placeholder")
final = shell.replace("__DATA__", data_str)
with open("chess-opening-course.html", "w") as f:
    f.write(final)
print("wrote chess-opening-course.html", len(final) // 1024, "KB")

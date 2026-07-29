"""Pawn structures as first-class, shared entities.

A structure belongs to no single opening -- several openings reach the same one,
which is the entire point of the card. A line points at a structure by id from
its `plan`; the reverse list, which openings reach a structure, is DERIVED by the
build from those pointers and never written down here, because a hand-written
copy goes stale the first time a line moves.

`also_in` is different, and is authored: it names openings in this course that
reach the same structure but do not yet carry a plan card pointing at it. It is
the cross-reference that makes the structure worth having -- study the isolani
once and it pays out in the Panov, the Queen's Gambit Accepted and the Nimzo
Rubinstein -- and it cannot be derived until those openings are wired up.

`fen` is an ordinary FEN, copy-pasteable from any analysis board. The build turns
it into the same 64-character string every other board on the page uses, so a
structure renders through the existing board with no new code.
"""

STRUCTURES = [

    {
        "id": "open-game-small-centre",
        "name": "The Open Game small centre (d3/e4 vs d6/e5)",
        "tier": "Foundation",
        "taxonomy": "No canonical name in Flores Rios or Soltis — both taxonomies are built around 1.d4 structures and the Open Sicilian. Call it what the players call it: the Pianissimo centre.",
        "fen": "r1bq1rk1/bpp1nppp/p2p1n2/4p3/2B1P3/2PP1N1P/PP1N1PP1/R1BQR1K1 w - - 1 10",
        "white_plans": [
            "Finish the knight tour Nb1–d2–f1–g3 before touching a pawn. Three slow moves that decide the next thirty.",
            "Play d3–d4 only when every piece already supports it. Until then the pawn on d3 is doing its job by standing still.",
            "a4 and b4 on the other wing once Black commits to the kingside. Two weaknesses beat one.",
            "h3 always: it takes g4 away from the c8-bishop and gives the king air. This is not a wasted move, it is the cheapest insurance in chess.",
        ],
        "black_plans": [
            "Mirror the tour with ...Nc6–e7–g6, then ...c6 and ...d5 to break in the centre.",
            "...Ba7 or ...Bb6 in advance, so that White's d4 never comes with tempo.",
            "...Be6 to trade the Italian bishop, accepting a backward e-pawn for the light squares.",
            "...a6 and ...b5 for queenside space while White is busy on the other side.",
        ],
        "key_squares": ["d5", "f5", "d4", "g3", "a7–g1 diagonal"],
        "pawn_breaks": ["White: d3–d4, and much later f2–f4 or a2–a4",
                        "Black: ...d6–d5, and ...f7–f5 once the knight reaches g6"],
        "pitfalls": [
            "Playing d4 the moment it is legal. In this structure d4 is a reward, not a move.",
            "Attacking with two pieces. Count attackers against defenders before you commit the h-pawn.",
            "Trading the light-squared bishop for nothing. It is the reason this opening exists.",
        ],
        "endgame_note": "Queenless, this structure favours whoever has the better minor piece, not whoever has more space. A knight on d5 or f5 outweighs a bishop staring at its own pawn chain.",
        "also_in": [
            "fourknights — Morphy Defense, Tarrasch Variation reaches the identical d3+e4 vs d6+e5 skeleton.",
            "fourknights — Spanish Four Knights (Metger) is the same structure one move before White commits to d4.",
            "ruylopez — every Anti-Marshall and d3 Ruy arrives here; the Closed Ruy passes through it on the way to d4.",
        ],
    },

    {
        "id": "italian-big-centre",
        "name": "The Italian/Spanish big centre (c3+d4+e4 vs d6+e5)",
        "tier": "Structure",
        "taxonomy": "Soltis groups this with the classical King's-pawn centres; Flores Rios does not cover it. It is the single most common structure in the whole 1.e4 e5 world.",
        "fen": "r1bq1rk1/bpp1nppp/p2p1n2/4p3/2BPP3/2P2N1P/PP1N1PP1/R1BQR1K1 b - - 0 10",
        "white_plans": [
            "Keep the tension. Whoever resolves it first usually helps the other side.",
            "d4–d5 closes the centre and hands you the kingside: after that, Ng3, Nf5 and the f- or g-pawn.",
            "dxe5 opens the game and is right only when your pieces are better placed than Black's — count first.",
            "a4 and b4 on the queenside once the centre is locked. The pawns point that way; follow them.",
        ],
        "black_plans": [
            "...exd4 followed by ...d5, the standard freeing operation, timed for when White's rook has left e1.",
            "...c6 and ...Qc7, the standard post: pressure on the c-file, support for e5, out of the rooks' way.",
            "...Ne7–g6 and ...h6 to hold the kingside before White's knight arrives on g3.",
            "...Be6 to trade the Italian bishop while the centre is still closed enough to survive fxe6.",
        ],
        "key_squares": ["d5", "f5", "c4", "e5", "b5"],
        "pawn_breaks": ["White: d4–d5 (closing), dxe5 (opening), a2–a4 and b2–b4, later f2–f4",
                        "Black: ...exd4, ...d6–d5, ...c7–c5 against a locked centre"],
        "pitfalls": [
            "Releasing the tension because it feels uncomfortable. Discomfort is the position, not a problem in it.",
            "Playing d5 with the queenside undeveloped — you have just handed Black the c5 square and a free hand.",
            "Forgetting that after d4–d5 the c1-bishop has no future until you play c3–c4 and b2–b4.",
        ],
        "endgame_note": "With queens off, the extra central pawn tells: White's d4+e4 gives an extra tempo in every pawn race and a shelter for the king on e3. Trade into it when Black's pieces are passive, avoid it when Black has the bishop pair.",
        "also_in": [
            "ruylopez — Closed Ruy Lopez (Chigorin) reaches an identical White skeleton (a2,b2,c3,d4,e4,f2,g2,h3); Black differs only by ...b5 and ...c5.",
            "fourknights — Caro Variation (Graz) reaches the identical White skeleton, move for move.",
            "fourknights — Spanish Four Knights (Metger) reaches it with doubled c-pawns after ...Bxc3 bxc3.",
        ],
    },

    {
        "id": "broad-centre-open-c-file",
        "name": "The pawn duo with the c-file open (d4+e4 vs d6)",
        "tier": "Plans",
        "taxonomy": "The 'classical centre' of the older literature. Neither Flores Rios nor Soltis gives it a chapter, because it is a transitional structure — but it is where the Italian and the Ruy Lopez both end up.",
        "fen": "r1bq1rk1/bpp1nppp/p2p1n2/8/2BPP3/5N1P/PP1N1PP1/R1BQR1K1 b - - 0 11",
        "white_plans": [
            "Rc1 and Rc3, using the file the c-pawn vacated when it recaptured on d4.",
            "d4–d5 to gain space and lock Black's bishop out, then play on the queenside where the pawns point.",
            "e4–e5 only with a knight ready to land on e4 or d6 behind it.",
            "Bb3 and Qd3, the battery on the a2–g8 diagonal that Black's ...d6 cannot cover.",
        ],
        "black_plans": [
            "...c6 and ...d5, the freeing break — it is the only one, so White should prevent it and Black should prepare it.",
            "...Nb6 or ...Na5 to hit the c4-bishop and win the d5 square outright.",
            "Blockade on d5 with a knight. A blockading knight in front of a duo is worth more than the pawn it stops.",
        ],
        "key_squares": ["d5", "c5", "e5", "c6"],
        "pawn_breaks": ["White: d4–d5, e4–e5, b2–b4–b5",
                        "Black: ...c7–c6 and ...d6–d5, ...b7–b5"],
        "pitfalls": [
            "Advancing the duo without pieces behind it — two pawns on d5 and e5 with nothing supporting them are two targets.",
            "Leaving the c-file to a black rook. If Black gets ...Rc8 in first, the file is a liability not an asset.",
        ],
        "endgame_note": "The half-open c-file plus the duo usually means a healthy queenside majority. Simplify toward a rook endgame and push the majority; the extra central pawn covers the squares your king needs to march through.",
        "also_in": [
            "ruylopez — the Chigorin deep dive reaches exactly this White skeleton (a2,b2,d4,e4,f2,g2,h3) after ...cxd4 cxd4; Black's half-open file is the c-file rather than the e-file.",
            "scotch — the Classical Variation arrives at a related version with e4 against ...d6 and no d-pawn.",
        ],
    },

    {
        "id": "isolani",
        "name": "The Isolani — White's isolated queen's pawn on d4",
        "tier": "Structure",
        "taxonomy": "A named chapter in both Flores Rios (Chess Structures) and Soltis (Pawn Structure Chess). The single most transferable structure in this whole course.",
        "fen": "r1bq1rk1/ppp2ppp/2n5/3n4/2BP4/5N2/PP1N1PPP/R2Q1RK1 w - - 2 11",
        "white_plans": [
            "Attack now. The isolated pawn is an engine in the middlegame and a liability in the endgame, so the clock is running.",
            "Take d5 and e5 with pieces: Ne5, Bd3, Qd3 or Qc2 aiming at h7, Rd1 behind the pawn.",
            "The d4–d5 break at the right moment — the pawn stops being weak the instant it advances.",
            "Avoid every queen trade that is not part of a concrete win.",
        ],
        "black_plans": [
            "Blockade d5 with a knight, then trade every other piece. A blockaded isolani is just a weak pawn.",
            "...Be6 and ...Rc8, pressing on c-file and d-file at once.",
            "Head for the endgame. Every trade helps the side playing against the isolani.",
        ],
        "key_squares": ["d5 (the blockade square)", "e5", "c5", "h7"],
        "pawn_breaks": ["White: d4–d5", "Black: ...b7–b5–b4 or ...f7–f6 to undermine an e5 knight"],
        "pitfalls": [
            "Defending the d-pawn with pieces. It does not need defending yet — it needs the game to be decided before it does.",
            "Trading a pair of knights 'to simplify'. Every trade brings the endgame you lose closer.",
            "As Black: taking the pawn too early and letting the pieces flood in. Blockade first, win it later.",
        ],
        "endgame_note": "This is the whole point of the structure. With queens and a pair of rooks off, the d4-pawn is simply weak and the blockading knight is simply strong. If you have the isolani, your endgame plan is to not reach one.",
        "also_in": [
            "italian — reached directly from the Giuoco Piano main line 5.d4 exd4 6.cxd4 Bb4+ 7.Bd2 Bxd2+ 8.Nbxd2 d5 9.exd5 Nxd5.",
            "carokann — the Panov-Botvinnik Attack ends on the identical White skeleton (a2,b2,d4,f2,g2,h2).",
            "queensgambit — the Queen's Gambit Accepted ends on the same skeleton with the a-pawn on a4.",
            "nimzo — the Rubinstein Variation (4.e3) ends on the identical White skeleton.",
        ],
    },

    {
        "id": "evans-open-lines",
        "name": "The gambit imbalance — open lines for two pawns",
        "tier": "Plans",
        "taxonomy": "Not a pawn structure in the taxonomic sense, and it would be dishonest to pretend otherwise. It is a material-for-time imbalance, and it needs its own card because the plans are nothing like the Italian's.",
        "fen": "r1b1k1nr/pppp1ppp/2n3q1/b3P3/2B5/1Qp2N2/P4PPP/RNB2RK1 w kq - 1 10",
        "white_plans": [
            "Re1 and Ba3 — the two files and diagonals that Black's king cannot cover.",
            "Nbd2–e4 or –c4, bringing the last piece before the first threat.",
            "e4–e5 as a wedge: it takes f6 and d6 from Black's pieces and it is worth more than the pawn it costs.",
            "Never recapture on c3 if recapturing costs a tempo. You bought time; do not spend it buying a pawn back.",
        ],
        "black_plans": [
            "Give one pawn back to finish developing. ...d6 and ...Nge7 is worth more than a pawn on c3.",
            "Trade queens at any cost. Every trade is worth half a pawn to the defender.",
            "Get the king off e8 — long castling is often better here, because White's pieces all point at the kingside.",
        ],
        "key_squares": ["f7", "e5", "a3–f8 diagonal", "the e-file"],
        "pawn_breaks": ["White: e4–e5, and f2–f4–f5 once the rooks are in",
                        "Black: ...d7–d5 to blunt the c4-bishop, ...f7–f6 to challenge the e5 wedge"],
        "pitfalls": [
            "Attacking before Nb1 has moved. The gambit is a development lead — an undeveloped piece is a returned pawn.",
            "Treating the gambit as a trick. At any decent level these are real openings with real theory and Black's defences hold.",
        ],
        "endgame_note": "There is no good endgame here for White, which is the honest evaluation of every gambit ever played. Your endgame plan is to have won by then.",
        "also_in": [
            "No other opening in this course reaches this imbalance. The Evans is on its own, which is part of why it is a surprise weapon rather than a repertoire.",
        ],
    },
]

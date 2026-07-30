OPENING = {
    "id": "scotch",
    "name": "Scotch Game",
    "eco": "C44–C45",
    "section": "white-e4",
    "orientation": "white",
    "tagline": "Open the centre on move three. Far less theory than the Ruy, and it fights for an advantage immediately.",
    "level": "Beginner → Master",
    "theory": {
        "big_idea": "White plays d4 at once, exchanges in the centre and gets an open position with a small development lead. Where the Ruy Lopez builds pressure over thirty moves, the Scotch resolves the central tension immediately. The trade-off: releasing the tension gives Black clear equalising targets, so White's edge is small — but the positions are easy to understand and there is far less to memorise.",
        "structure": "After 3...exd4 4.Nxd4, White has a pawn on e4 against Black's pawn on d6/d7 — a small space edge and a half-open d-file. In the Mieses main line, White's three queenside pawns stand on three files and Black's three stand on two, so Black can never make a passed pawn there; nobody has the bishop pair, because 5.Nxc6 is knight for knight. Be honest about the size of it: bare kings and those six pawns is a draw, and what you really own is a pawn on c6 that needs a piece to defend it for the rest of the game.",
        "white_plans": [
            "Occupy the centre with e4–e5 gaining space and driving Black's knight away.",
            "Play against the doubled c-pawns: your three queenside pawns stand on three files and Black's three stand on two, so trade pieces and make Black babysit c6.",
            "In the Mieses, castle kingside opposite Black's king and work with the two long diagonals — Bg2 at c6, Bb2 at e5 and g7. The pawn moves g3, h4 and f4 are there to develop and to hold e5, not to storm a king that is on the other wing.",
            "In the 4...Bc5 lines, kick the bishop with Nb3 or hold the knight with Be3 and c3, then castle and play f4 to win the tempo back.",
        ],
        "black_plans": [
            "4...Bc5 hitting the knight on d4 and provoking a concession; then ...Qf6 and quick development.",
            "4...Nf6 aiming for the Mieses lines, where ...Qe7, ...Ba6 and ...O-O-O all pile onto White's e5-pawn.",
            "Break with ...d5 as soon as possible to free the position — the standard antidote to a space advantage.",
            "Target the e5-pawn with ...Qe7, then ...f6 and ...Rhe8 — and hit the pawn on c4 with ...Ba6 on the way.",
        ],
        "traps": [
            "4.Nxd4 Qh4 5.Nc3 Bb4 6.Be2 Qxe4 7.Nb5 Bxc3+ 8.bxc3 Kd8 — Black really does win the e4-pawn, and you are playing a gambit for the black king on d8, not refuting anything. What you must not play is 5.Nf5, when 5...Qxe4+ 6.Ne3 gives the pawn away for nothing at all.",
            "In the Scotch Gambit (4.Bc4), 4...Bc5 5.Nxd4?? drops a piece to 5...Bxd4, because the knight on c6 recaptures on d4 and the queen cannot. Play 5.c3. And 5.Ng5 Nh6 6.Nxf7 Nxf7 7.Bxf7+ Kxf7 8.Qh5+ g6 9.Qxc5 comes out dead level — a knight and a bishop for two pawns and the bishop back — so it is a trade, not an attack.",
            "4...Bc5 5.Nxc6 is not an error, it is the Intermezzo Variation and Kasparov's own choice. Black's move is the in-between 5...Qf6; the mistake is 5...dxc6 6.Qxd8+ Kxd8, which costs the right to castle for nothing.",
        ],
        "who": "Play this if you want an open, principled 1.e4 opening without memorising a Ruy Lopez encyclopaedia. Kasparov revived it at world-championship level in the 1990s.",
    },
    "lines": [
        {
            "name": "Mieses Variation — Main Line",
            "note": "The modern main line. White gains space with e5 and plays against the doubled c-pawns.",
            "moves": "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O g3",
            "tier": "Foundation",
            "drill": True,
            "plan": {
                "structure": 'mieses-wedge',
                "tier": 'Structure',
                "point": "Ten moves and the position is already unbalanced on purpose. Black's queenside pawns stand on two files — a7, c7 and c6 — while yours stand on three, and that difference does not go away for the rest of the game. Count the pieces before you decide who is better: two bishops and a knight each, seven pawns each, and Black's rook on d8 sits behind Black's own pawn on d7, so the half-open d-file is yours and not Black's. Neither side is attacking a king yet; both sides are arguing about the pawn on e5, which your queen on e2 defends once and Black's queen on e7 attacks once.",
                "next": [
                    '11.Bg2 next, always. The bishop is not developing — it is joining an attack on c6, and c6 has exactly one pawn left that can defend it, the one on d7. Every attacker you add to c6 makes ...d5 and ...d6 harder to play, and those are the only moves that free Black.',
                    'Then O-O and Bb2, and only then think about a pawn move. Both your bishops end up on the long diagonals pointing at the king Black has just committed to the queenside.',
                    'Expect ...f6 and ...Re8 against the e5-pawn. Meet it with Nd2–f3 rather than f4: the pawn on e5 is worth holding while it cramps Black, and worth giving up the moment your pieces get squares out of it.',
                ],
                "endgame": 'This is the endgame you are playing for, and it is smaller than it looks. Three queenside pawns on three files against three on two files means Black can never make a passed pawn there — but neither can you on your own: strip the board to kings and those six pawns and it is a dead draw. The edge is that you can play on both wings and Black cannot, and that c6 ties a piece down. What flips it is ...d5 — once cxd5 is answered by ...cxd5 the doubling is gone and Black is simply equal. Stop it, or make Black pay a piece\'s worth of time to play it.',
            },
            "notes": {
                5: "The Scotch. White strikes at once instead of building slowly. Black almost has to take, because 3...d6 4.dxe5 gives White a clear space edge.",
                6: "Accepting. Black is a pawn up for exactly one move — 4.Nxd4 takes it straight back — and what White is really buying is a pawn on e4 with nothing opposite it.",
                7: "Recapturing with the knight. It looks great on d4 — but it is also a target, and much of the theory revolves around chasing it.",
                8: "Hitting e4 and heading into the sharpest line.",
                9: "White voluntarily trades on c6 to damage Black's structure and gain a tempo for e4–e5.",
                10: "Forced: 5...dxc6? 6.Qxd8+ Kxd8 gives White a risk-free endgame edge and Black loses castling rights.",
                11: "Kicking the knight and grabbing serious space. This pawn will be both White's pride and White's biggest weakness for the rest of the game.",
                12: "The star move. Black pins the e5-pawn against the white king along the e-file, so the knight on f6 cannot simply be captured.",
                13: "The main answer: White unpins by stepping the queen onto the same file, so exf6 becomes legal again. 7.Qd4 and 7.Bf4 also hold the pawn; e2 is the accurate square because the queen also supports c4.",
                14: "The knight jumps to the strong central outpost, attacking nothing yet but sitting beautifully.",
                15: "White challenges the knight immediately. It has to decide: b6 (passive) or the sharp lines after ...Ba6.",
                16: "Both hitting c4 and preparing ...O-O-O. Black's bishop is unusually active for a Scotch.",
                17: "Propping c4 up with a pawn so the queen is free to leave e2 later. While she is the only defender, the bishop on a6 has your c-pawn pinned to her — cxd5 would lose the queen to ...Bxe2.",
                18: "Black castles long and the game becomes a race: White attacks the queenside where Black's king is, Black attacks the e5-pawn and the kingside.",
                19: "Preparing Bg2 to hit c6 and contest the long diagonal. A rich, unbalanced middlegame with chances for both.",
            },
        },
        {
            "name": "Classical Variation — 4...Bc5",
            "note": "Black's most natural reply: develop with tempo by hitting the d4-knight.",
            "moves": "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6 O-O d6 Nd2",
            "tier": "Structure",
            "drill": True,
            "plan": {
                "tier": 'Structure',
                "point": "No doubled pawns, no material imbalance and no open files — this is the quiet half of the Scotch. Your assets are a pawn on e4 against a pawn on d6, a knight on d4 that c3 holds forever, and a black king still standing on e8 with the queen out on g6. Black's asset is that nothing is wrong with the position.",
                "next": [
                    '11.f3 or 11.Kh1 first. The queen on g6 is looking at g2 and the c8-bishop wants g4 or h3; one quiet move takes the whole annoyance away, and there is nothing you need to hurry for.',
                    'Then f4, hitting the e5-knight with the pawn you were saving. It gains space and it gains a tempo, and after the knight moves the f-file is a second front.',
                    'If Black takes on d4 and you recapture cxd4, you own the classical pawn duo on d4 and e4 with the c-file half-open — that is a different and better game, so do not avoid the trade. Note the order Black has to get right: with the pawn already on d6 the knight on e5 has a defender, and ...Bxd4 is fine. One move earlier, before ...d6, the same trade loses a piece — see the deviations after 9.O-O.',
                ],
                "endgame": 'Small and durable: the extra central pawn and the half-open d-file against a pawn on d6 that has no easy way forward. Trade into a rook ending and press d6; the one thing you must not allow is ...d5 played for free, because after it Black has no weakness at all and nothing is left to press.',
            },
            "notes": {
                8: "Developing with an attack on the knight. White has to decide: defend it (5.Be3), retreat it (5.Nb3) or trade it (5.Nxc6). All three are real lines; only 5.Nb5 and 5.Nf5 are mistakes.",
                9: "The best answer: White defends the knight and offers a trade of the strong bishop.",
                10: "Black avoids the trade and eyes both f2 and the b2/d4 squares. The queen is active here rather than exposed.",
                11: "Supporting d4 permanently, so the tension resolves in White's favour.",
                12: "The g8-knight, not the c6-knight — the disambiguation is the whole point, because the knight on c6 has to stay and keep hitting d4. Note that f6 is not even available: Black's own queen is standing on it. From e7 the knight supports a later ...d5.",
                13: "Back to the Italian diagonal, hitting f7 and controlling d5.",
                14: "Black jumps in to hit the bishop and swap off White's most dangerous piece.",
                15: "Sidestepping. White keeps every piece and prepares f4 to kick the knight later.",
                16: "The queen slides off the f-file to a safe active square, eyeing g2.",
                17: "Castling into the position. The engine calls it dead level — what White owns is the half-open d-file and a black king that has not moved yet, and the point of castling first is that the king now guards g2.",
                18: "Black solidifies the knight and prepares to develop the last bishop — and it is not optional. Without a pawn on d6 the knight on e5 has no defender, and 9...Bxd4 10.cxd4 would simply trap it.",
                19: "The knight heads to f3 or b3 to challenge Black's active pieces. Balanced but rich.",
            },
        },
        {
            "name": "Scotch Gambit",
            "note": "Instead of recapturing on d4, White develops the bishop and plays for a rapid attack. Excellent at club level.",
            "moves": "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5 Bb5 Ne4 Nxd4 Bd7 Bxc6 bxc6 O-O Bc5",
            "tier": "Plans",
            "drill": True,
            "plan": {
                "tier": 'Plans',
                "point": "The gambit has turned into a structure. You gave the pawn back on move seven and took the c6-pawn's future instead: Black has doubled c-pawns and the bishop pair, you have two knights, a wedge on e5 and every piece on a useful square. Material is level, so read the position as a normal middlegame with one long-term asset each.",
                "next": [
                    '10.Be3 to challenge the bishop on c5, and take with the bishop if Black trades — a bishop on d4 in front of doubled c-pawns is exactly the piece this structure wants.',
                    '10.Nd2 and 11.f3 is the other plan: the knight on e4 is Black\'s best piece and it has no pawn to support it, so make it move or trade it.',
                    'Do not commit the c-pawn early. From c2 it covers b3 and d3 and keeps both jobs available — c3 to prop a knight on d4, or c4 to hit d5 — and which one you need depends on which of Black\'s two pawn groups turns into the target.',
                ],
                "endgame": 'Your three queenside pawns stand on three files, Black\'s three stand on two, so Black can never make a passed pawn on that wing — but do not overrate it: three against three on the same files is a draw all by itself, and the edge only becomes real when a piece or the e5-pawn joins in. Black\'s compensation is the bishop pair and the pawn on d5, and both need pieces on the board to mean anything — so count trades. If you can reach a knight-against-bishop ending with the doubled pawns still doubled, you are the one with something to play for.',
            },
            "notes": {
                7: "The Scotch Gambit. White declines to regain the pawn immediately and hurls a piece into the game aiming at f7.",
                8: "The most played reply, counterattacking e4. 4...Bc5 is just as good and it defends d4 a second time — which is why the answer there is 5.c3 and never 5.Nxd4, a move that simply drops a piece to 5...Bxd4.",
                9: "Kicking the knight and grabbing space. This is a real gambit now — White may not get the d4-pawn back at all.",
                10: "The correct counter. Black hits back in the centre and refuses to let White's attack build.",
                11: "Pinning the c6-knight so that the e5-pawn holds. A sharp and necessary move.",
                12: "The knight finds a great outpost in the middle of the board.",
                13: "Finally regaining the pawn. Material is level and both sides have active pieces.",
                14: "Unpinning and connecting the pieces.",
                15: "White resolves the tension, giving Black doubled c-pawns.",
                16: "Taking with the pawn, keeping both bishops and accepting the doubled c-pawns. 8...Bxc6 looks like the opposite bargain — clean pawns, one bishop — but it is not on offer: 9.Nxc6! bxc6 doubles them anyway and takes a bishop off with them. That is why the pawn recapture is the move, and it is a structural choice rather than a tactic.",
                17: "Castling and completing development. White plays against the doubled pawns; Black has the bishop pair and central pawns.",
                18: "Black develops with tempo on the d4-knight and the game is roughly balanced, but sharp.",
            },
        },
    ],
    "deep": {
        "name": "Deep dive — the opposite-castling race",
        "note": "Both kings are committed. Watch White build slowly on the long diagonal while Black works to undermine the e5-pawn.",
        "moves": "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O g3 Nb6 Bg2 Qe6 O-O Kb7 Nd2 Be7 Bb2 Rhe8 Rfe1 f6 Nf3 fxe5 Nxe5",
        "tier": "Plans",
        "drill": True,
        "plan": {
            "structure": 'mieses-wedge',
            "tier": 'Plans',
            "point": "Seventeen moves, one pawn traded, and the entire middlegame turned on the square e5 — which is now occupied by a knight instead of a pawn, hitting c6, d7, f7 and g6 from a post no black pawn can ever challenge. Six pawns each, two bishops and a knight each, material dead level: what is left is your three kingside pawns against two, and a doubled c-pawn whose last pawn defender is the one on d7 — so the move that frees Black is also the move that abandons c6.",
            "next": [
                'Keep the knight on e5, or trade it only for a piece that was defending c6. Everything you own points at that pawn: two bishops down the long diagonals, the queen behind them if you want it.',
                'Rad1 and Qf3 or Qc2, and make Black hold both c6 and d7 with pieces. The rook on the d-file is what stops the freeing move.',
                'The freeing move is ...d5. Answer cxd5 and Black answers ...cxd5, and the doubled pawn is gone along with everything you were playing against — so it is the only thing you have to prevent. Do that and the position plays itself.',
            ],
            "endgame": 'Rooks and one minor piece each is the ending to steer for: three kingside pawns against two makes a passer, and Black spends the time stopping it rather than pushing the queenside. Knight against bishop suits you here, because Black\'s pawns cover neither c5 nor e5 and the bishop has nothing to bite on.',
        },
        "notes": {
            20: "The knight steps back rather than be traded on d5. From b6 it hits c4 and watches the queenside.",
            21: "The bishop takes the long diagonal, pointing through the doubled pawn on c6 at b7 and a8 — the corner Black's king has just moved next to.",
            22: "The queen steps up one square. She stays on the e-file and keeps the pawn attacked, and she stops blocking the f8-bishop's road to e7.",
            23: "White castles at last. Opposite wings, and the race begins.",
            24: "Tucking the king onto the square the b-pawn vacated. In opposite-castling positions one prophylactic king move is almost always worth it.",
            25: "The last piece develops, heading for f3 or e4 to shore up e5.",
            26: "Development, and it takes the a3–f8 diagonal away before Ba3 can ever come — the move that beat Karpov at Tilburg is now permanently unavailable.",
            27: "The second bishop takes the other long diagonal. The two are doing different jobs: Bg2 works on c6, Bb2 works on e5 and g7.",
            28: "The rook comes to the e-file behind its own bishop, so it is a third piece committed to e5 rather than a third attacker yet. ...f6 is what opens the file for it.",
            29: "White contests the same file. Notice that neither side has thrown a single pawn at the enemy king — in the Scotch the fight is over e5 first.",
            30: "The undermining move. If Black wins e5, White's space advantage disappears and the doubled pawns stop mattering.",
            31: "White reinforces. The e5-pawn is the entire argument of the position.",
            32: "Black cashes in and opens the f-file toward White's king.",
            33: "White recaptures with the knight, which lands centrally hitting c6, d7 and f7. Material is level, the structures are unequal, and the whole middlegame turned on one pawn. That is the Scotch in miniature.",
        },
    },
    # Deviations, keyed by the position they answer rather than by a ply number.
    # All four Scotch lines share the first six plies, so the early sets fire in
    # every one of them; the sets from ply 7 on belong to a single branch of the
    # tree, because 4.Nxd4 and 4.Bc4 never meet again.
    "branches": {

        # ── ply 4 · the one game in five that never reaches the Scotch ──────────
        "e4 e5 Nf3": [
            {"san": "Nf6", "severity": "playable", "tier": "Mastery",
             "name": "Petrov (Russian) Defence",
             "why": "The most common way a prepared opponent sidesteps everything you have learned: Black hits e4 instead of defending e5, and there is no Scotch to be had. Take the pawn — 3.Nxe5 d6 4.Nf3 Nxe4 5.d4 — and you get an open, symmetrical game. You need one line here, because no amount of Scotch preparation applies.",
             "line": "Nxe5 d6 Nf3 Nxe4 d4 Be7"},
            {"san": "d6", "severity": "playable", "tier": "Foundation",
             "name": "Philidor Defence",
             "why": "The second most common amateur reply, and the friendliest one for you: 3.d4 is exactly the move you wanted to play anyway. Black has a cramped but solid position and the c8-bishop is behind its own pawn — space and a free hand for you, no theory required.",
             "line": "d4 Nf6 Nc3 Nbd7 Bc4 Be7"},
            {"san": "d5", "severity": "inaccuracy", "tier": "Structure",
             "name": "Elephant Gambit",
             "why": "A pawn offered for very little. 3.exd5 and then 4.Qe2!, the simple move: it hits the pawn Black has just pushed past and refuses every trick. Black wins d5 back in a few moves and is a tempo behind with nothing to show for it. Do not get greedy with 3.Nxe5 — it is playable, and all of this gambit's tactics live there.",
             "line": "exd5 e4 Qe2 Nf6 Nc3 Be7"},
            {"san": "f5", "severity": "inaccuracy", "tier": "Mastery",
             "name": "Latvian Gambit",
             "why": "The mirror of the King's Gambit, and it costs Black more than it costs you. 3.Nxe5! Qf6 4.d4 d6 5.Nc4 fxe4 — the pawn count comes out level and nothing else does: Black's king has no shelter, the queen is out on f6 blocking the knight, and you are two developing moves ahead. What you must not do is grab with 3.exf5, which opens a file toward your own king for no reason.",
             "line": "Nxe5 Qf6 d4 d6 Nc4 fxe4"},
            {"san": "f6", "severity": "inaccuracy", "tier": "Foundation",
             "name": "Damiano Defence",
             "why": "The f-pawn cannot defend e5, and the reason is a sequence worth knowing by heart: 3.Nxe5! and taking is fatal — 3...fxe5 4.Qh5+ Ke7 5.Qxe5+ Kf7 6.Bc4+ gives up a knight for two pawns and a black king with nothing left to hide behind, which is four pawns' worth on any measure. Black's only move is 3...Qe7, and after 4.Nf3 d5 Black does get the pawn back — the engine still gives you a pawn and a half, because the queen has been pushed out on move three and the king has a pawn on f6 instead of shelter.",
             "line": "Nxe5 fxe5 Qh5+ Ke7 Qxe5+ Kf7 Bc4+"},
        ],

        # ── ply 5 · your own third move: four openings, one position ────────────
        "e4 e5 Nf3 Nc6": [
            {"san": "Bb5", "severity": "playable", "tier": "Foundation",
             "name": "Ruy Lopez",
             "why": "The most respected reply there is, and the opposite philosophy: the Ruy keeps the central tension for thirty moves precisely so that Black has to keep answering for the e5-pawn. Better long-term pressure, roughly ten times the theory.",
             "line": "Nf6 O-O Nxe4 Re1 Nd6",
             "see": "ruylopez"},
            {"san": "Bc4", "severity": "playable", "tier": "Foundation",
             "name": "Italian Game",
             "why": "The Scotch's natural partner. The bishop aims at f7 instead of leaning on the knight, and the game is slower and quieter than anything here — the Giuoco Pianissimo can go fifteen moves without a capture. Learn both and you choose the character of the game on move three.",
             "line": "Nf6 d3 Bc5 c3 a6",
             "see": "italian"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "name": "Four Knights Game",
             "why": "Symmetrical, sound and very small. Worth knowing because the Scotch transposes into it: 3.d4 exd4 4.Nxd4 Nf6 5.Nc3 is the Four Knights, Scotch Variation, and you may end up there whether or not you meant to.",
             "line": "Nf6 Bb5 Bb4 O-O O-O Re1",
             "see": "fourknights"},
            {"san": "c3", "severity": "playable", "tier": "Mastery",
             "name": "Ponziani Opening",
             "why": "Preparing d4 rather than playing it. The problem is 3...d5!, which uses the tempo you spent: after 4.Qa4 Bd7 5.exd5 Nd4 Black is comfortable. Perfectly legal, and the reason the Scotch exists is that d4 works immediately.",
             "line": "d5 Qa4 Bd7 exd5 Nd4 Qd1"},
        ],

        # ── ply 6 · after 3.d4 — Black almost has to take ───────────────────────
        "e4 e5 Nf3 Nc6 d4": [
            {"san": "d6", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Holding the pawn instead of taking. The answer is not the trade — it is 4.d5!, kicking the knight and taking the whole centre: 4...Nce7 5.c4 g6 6.c5 and Black has a Philidor with three tempi missing. Whenever Black declines in the centre, gain space rather than resolve it.",
             "line": "d5 Nce7 c4 g6 c5 Bg7"},
            {"san": "Nxd4", "severity": "inaccuracy", "tier": "Structure",
             "name": "Lolli Variation",
             "why": "Black trades the knight that was defending e5 so that your queen can come to the middle of the board: 4.Nxd4 exd4 5.Qxd4 and she is safe there, because the piece that hits d4 from c6 is exactly the one Black has just given away. Chasing her now costs Black another developing move.",
             "line": "Nxd4 exd4 Qxd4 Qf6 Qc4 c6"},
            {"san": "Nf6", "severity": "inaccuracy", "tier": "Structure",
             "why": "Development with a threat, one move too soon. 4.d5! is the point — the knight on c6 has to move and every square is worse than the one it left, and once it goes, 5.Nxe5 takes the pawn Black declined to capture. Count the defenders of e5 before you develop away from it.",
             "line": "d5 Nb8 Nxe5 Qe7 Nd3"},
            {"san": "Bb4+", "severity": "inaccuracy", "tier": "Foundation",
             "why": "A check that helps you: 4.c3! and the bishop has to move again while your pawn takes the square Black's knight wanted. After 4...Bd6 5.Bd3 the bishop stands in front of its own d-pawn and the c8-bishop is boxed in behind it.",
             "line": "c3 Bd6 Bd3 Nge7 d5 Nb8"},
        ],

        # ── ply 7 · your own fourth move: the three Scotches ────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4": [
            {"san": "Nxd4", "severity": "playable", "tier": "Foundation",
             "why": "The Scotch proper. Take the pawn back with the knight, accept that it will be attacked, and play for the small structural edge that comes out of 5.Nxc6. Nine games in ten in this opening start here.",
             "line": "Nf6 Nxc6 bxc6 e5 Qe7 Qe2",
             "see": "scotch#mieses"},
            {"san": "Bc4", "severity": "playable", "tier": "Plans",
             "name": "Scotch Gambit",
             "why": "Leave the pawn and develop at f7 instead. You often get the pawn back anyway a few moves later, and in the meantime every piece you own is doing something. Excellent at club level and completely sound.",
             "line": "Nf6 e5 d5 Bb5 Ne4 Nxd4",
             "see": "scotch#scotch-gambit"},
            {"san": "c3", "severity": "playable", "tier": "Mastery",
             "name": "Göring Gambit",
             "why": "Offer the pawn back at once for a lead in development — the Danish Gambit's cousin. Accepted, 4...dxc3 5.Nxc3 leaves the c- and d-files half-open for your rooks and a tempo in hand; the engine still calls it level, so the compensation is real and no more than that. Declined with 4...d5! Black equalises, and that is the honest verdict. One trap to bank: 4...Bb4+?? loses a piece outright to 5.cxb4, because the pawn on c3 is the thing doing the capturing.",
             "line": "dxc3 Nxc3 Bc5 Bc4 d6 O-O Nf6"},
            {"san": "Ng5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The move that scores well against unprepared opponents and loses a tempo against everyone else. There is no sacrifice on f7 to prepare — the bishop is still on f1 — so after 4...Be7! the knight has to come home and Black is a pawn up with a developed piece. Do not play the pattern without the pieces that make it work.",
             "line": "Be7 Nf3 Nf6 Nbd2 O-O Bd3"},
            {"san": "Qxd4", "severity": "blunder", "tier": "Foundation",
             "why": "The recapture that gives up the queen for a knight. 4...Nxd4! — the knight on c6 has been guarding that square since move two, which is the entire reason 4.Nxd4 is the move. Count what is looking at a square before you put your queen on it.",
             "line": "Nxd4 Nxd4 Bc5"},
        ],

        # ── ply 8 · after 4.Nxd4 — everything Black is allowed to play ──────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4": [
            {"san": "Nf6", "severity": "playable", "tier": "Foundation",
             "name": "Schmidt Variation",
             "why": "The main move: Black hits e4 and heads for the Mieses lines. This is the position you should know best, because it is the one you will reach most often and the only one where the structure is decided by force.",
             "line": "Nxc6 bxc6 e5 Qe7 Qe2 Nd5",
             "see": "scotch#mieses"},
            {"san": "Bc5", "severity": "playable", "tier": "Foundation",
             "name": "Classical Variation",
             "why": "The other main move, and the more natural-looking one: Black develops and asks the knight a question in the same breath. You have three good answers — 5.Be3 defends it, 5.Nb3 retreats it, 5.Nxc6 trades it — and the only bad ones are 5.Nb5 and 5.Nf5.",
             "line": "Be3 Qf6 c3 Nge7 Bc4 Ne5",
             "see": "scotch#classical"},
            {"san": "Qh4", "severity": "inaccuracy", "tier": "Structure",
             "name": "Steinitz Variation",
             "why": "Black really does win the e4-pawn: 5.Nc3 Bb4 6.Be2 Qxe4 7.Nb5! Bxc3+ 8.bxc3 Kd8 and it is gone for good. What it costs is the right to castle and a great deal of time, and a century of practice says that is the worse end of the deal — the engine agrees, by about half a pawn. Play 5.Nc3 without hesitating, and never 5.Nf5, which gives the pawn away without the compensation.",
             "line": "Nc3 Bb4 Be2 Qxe4 Nb5 Bxc3+ bxc3 Kd8"},
            {"san": "Bb4+", "severity": "playable", "tier": "Plans",
             "name": "Malaniuk Variation",
             "why": "An odd-looking check that is perfectly sound. 5.c3! is the answer — the bishop must move again and your pawn takes the square the knight would otherwise have wanted, so you have gained a tempo and lost the c3 square. A fair trade, and after 5...Bc5 6.Nxc6 bxc6 you are in a Mieses structure a move up.",
             "line": "c3 Bc5 Nxc6 bxc6 Bd3 Qh4"},
            {"san": "Nxd4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Trading the knight so your queen has to come to d4 — except that here it wants to. 5.Qxd4 and the queen sits in the centre with nothing to chase her: Black has traded off the one piece that could have.",
             "line": "Qxd4 Qf6 Qe3 Bb4+ c3 Be7"},
            {"san": "Qf6", "severity": "playable", "tier": "Structure",
             "why": "The queen defends the knight and eyes d4 and f2 at once. It is respectable, and the simplest answer is to step out of the way: 5.Nf3 or 5.Nb3, keeping the knight and making Black find something for the queen to do next.",
             "line": "Nf3 Bb4+ c3 Bc5 Be2 h6"},
            {"san": "d6", "severity": "playable", "tier": "Foundation",
             "why": "Solid and slow: it stops e4–e5 for good and shuts the c8-bishop in behind its own pawn. 5.Nc3 and 6.Bb5 — you have a free hand and Black has a piece to untangle. Nothing to punish and nothing to fear.",
             "line": "Nc3 Nf6 Bb5 Bd7 Bxc6 bxc6"},
            {"san": "g6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The Dragon set-up, and the most respectable of Black's sidelines: the bishop goes to g7 and leans on d4 from a distance instead of hitting it. It costs about three-quarters of a pawn, and the reason is that you get a free hand to build the attack: 5.Nc3, 6.Be3, 7.Qd2 and O-O-O, with f3 and g4 to follow. If you know the Yugoslav Attack, you already know this position.",
             "line": "Nc3 Bg7 Be3 Nf6 Qd2 O-O"},
            {"san": "Nge7", "severity": "inaccuracy", "tier": "Mastery",
             "why": "The knight develops without walking into e5 and without blocking the f8-bishop — and it stops defending e5's replacement, the knight on c6. 5.Nc3! and Black more or less has to play 5...Nxd4 6.Qxd4, which is the Lolli position a tempo worse: your queen sits on d4 and the piece that could have chased her is off the board.",
             "line": "Nc3 Nxd4 Qxd4 Nc6 Qe3 Bb4"},
        ],

        # ── ply 9 · your own fifth move against 4...Nf6 ─────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6": [
            {"san": "Nxc6", "severity": "playable", "tier": "Foundation",
             "why": "The Mieses. Trade first, then push: the point of taking on c6 is not the trade, it is that Black's recapture is forced and 6.e5 arrives with a tempo. Doubled c-pawns for Black, a pawn on e5 for you, and a structure that lasts to the endgame.",
             "line": "bxc6 e5 Qe7 Qe2 Nd5 c4",
             "see": "scotch#mieses"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "name": "Four Knights, Scotch Variation",
             "why": "A transposition, not a concession: this is the Four Knights Game, and after 5...Bb4 6.Nxc6 bxc6 7.Bd3 d5 8.exd5 cxd5 Black gets the doubled c-pawns cured and you get a comfortable, tiny edge. Worth knowing as your quiet option when you do not want the Mieses race.",
             "line": "Bb4 Nxc6 bxc6 Bd3 d5 exd5",
             "see": "fourknights"},
            {"san": "Nb5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Heading for c7 with a threat that is not one. 5...Nxe4! and there is nothing behind the knight on b5: 6.Nxc7+ is answered by 6...Qxc7, so the fork wins nothing at all and Black keeps the centre pawn.",
             "line": "Nxe4 Bf4 Bb4+ c3 Ba5 Nd2"},
            {"san": "e5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Pushing before trading, and the difference is one pawn: 5...Nxe5! — the knight on c6 simply takes, because nothing defends the pawn. The knight on d4 covers f5 and e6 and not the square in front of it. Play 5.Nxc6 first; removing that knight is what makes 6.e5 strong as well as legal.",
             "line": "Nxe5 Qe2 Qe7 Bf4 d6 Nc3"},
        ],

        # ── ply 10 · which pawn takes back on c6 ────────────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6": [
            {"san": "bxc6", "severity": "playable", "tier": "Foundation",
             "why": "The right recapture, and effectively forced: it keeps a pawn on d7, and that pawn is the only thing stopping 6.Qxd8+. Black accepts doubled c-pawns because the alternative costs the right to castle.",
             "line": "e5 Qe7 Qe2 Nd5 c4 Ba6"},
            {"san": "dxc6", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The tidy-looking recapture that costs the right to castle: 6.Qxd8+! Kxd8 7.Nc3 and Black has an endgame a shade worse — king on d8, rooks unable to connect, no counterplay anywhere. Healthy pawns are the compensation, and half a pawn's worth of evaluation says it is not quite enough.",
             "line": "Qxd8+ Kxd8 Nc3 Be6 f3 Nd7"},
        ],

        # ── ply 11 · your own sixth move ────────────────────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6": [
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "The quiet version, and a completely respectable one: hold e4 with a piece, castle, and let Black cure the doubled pawns with ...d5 while you take a small lead in development instead. Choose it when you do not want the opposite-castling race that 6.e5 invites.",
             "line": "d5 exd5 cxd5 O-O Be7 h3"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "why": "Development first, and it transposes straight into the Four Knights, Scotch Variation: 6...Bb4 7.Bd3 d5 8.exd5 and Black's doubled pawn is cured at the price of an isolated one. Sound, simple, and much less to remember than the Mieses.",
             "line": "Bb4 Bd3 O-O O-O d5 exd5",
             "see": "fourknights"},
            {"san": "Nd2", "severity": "playable", "tier": "Plans",
             "why": "A move-order refinement: the knight is going to d2 anyway in most Mieses lines, so playing it now keeps e5 in reserve until Black has committed. Slightly slower and slightly safer.",
             "line": "Bc5 e5 Qe7 Qe2 Nd5 Qe4"},
        ],

        # ── ply 12 · after 6.e5 — the e-pawn is the whole argument ──────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5": [
            {"san": "Nd5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The knight goes to the outpost without pinning the e5-pawn first, which is the one detail that makes the whole system work. 7.c4! now comes for free and the knight has to move again: Black has spent a tempo to be kicked, and your extra space is unchallenged.",
             "line": "c4 Nb6 Be3 d6 exd6 cxd6"},
            {"san": "Ne4", "severity": "inaccuracy", "tier": "Structure",
             "why": "The knight jumps forward instead of back, and there is no pawn to support it out there. 7.Nd2! challenges it at once and every trade helps you, because Black's remaining pieces are the ones that have to babysit c6.",
             "line": "Nd2 Nc5 Nb3 Qe7 f4 g6"},
            {"san": "Ng8", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Retreating all the way home to keep everything defended. It is not losing anything, it is losing the game one tempo at a time: 7.Nc3 and 8.Bd3 and you have a free move to spend somewhere on the board while Black's knight starts again.",
             "line": "Nc3 d5 Bd3 Ne7 O-O Nf5"},
        ],

        # ── ply 13 · after 6...Qe7 — the pin that has to be answered ────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7": [
            {"san": "Qd4", "severity": "playable", "tier": "Structure",
             "why": "The other way to unpin: the queen holds e5 from d4 instead of stepping onto the file. It works and it is a shade less accurate than 7.Qe2, because on e2 the queen also supports c4 — which is the move that makes Black's knight decide.",
             "line": "d6 Nd2 Nd5 Nf3 f6 Qc4"},
            {"san": "Bf4", "severity": "playable", "tier": "Plans",
             "why": "Defending the pawn with a piece and developing at the same time. Reasonable, and note what it gives up: with the queen still on d1 the b2-pawn is loose, so 7...Nd5 8.Bg3 Qb4+ is an annoying line you have to be ready for.",
             "line": "Nd5 Bg3 Qb4+ Nd2 Qxb2 Rb1"},
            {"san": "Nd2", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Development that forgets what the pin was for. 7...Qxe5+! and the pawn is gone with check — the whole point of 6...Qe7 was that e5 is attacked and the knight on f6 cannot be taken. Answer the pin before you develop.",
             "line": "Qxe5+ Be2 Bc5 Nc4 Qe7 O-O"},
        ],

        # ── ply 14 · after 7.Qe2 — two ways for Black to lose a piece ───────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2": [
            {"san": "Ng8", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The knight retreats rather than jumping to d5, and now nothing at all is happening on the board except that you are two developing moves ahead. 8.Nd2 and 9.Nf3, then h4 and g3 — take your time, there is nothing Black can do quickly.",
             "line": "Nd2 g6 Nf3 f6 h4 Bg7"},
            {"san": "Ne4", "severity": "blunder", "tier": "Foundation",
             "why": "The knight steps onto the file the queens are already sharing. 8.Qxe4! and it is simply a piece: nothing on the board defends e4, and Black's queen on e7 is looking at the square through your own pawn on e5.",
             "line": "Qxe4 f6 Be2 d5 Qa4"},
            {"san": "Qe6", "severity": "blunder", "tier": "Structure",
             "why": "The queen steps off the file and the pin dissolves with it — which means the pawn on e5 is free to capture and the knight on f6 is defended by nothing. 8.exf6! and after 8...gxf6 you have won a knight for a pawn, with Black's kingside in ruins as well.",
             "line": "exf6 gxf6 Nc3 Rb8 b3"},
        ],

        # ── ply 16 · after 8.c4 — why the bishop must go to a6 and not b7 ───────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4": [
            {"san": "Nb6", "severity": "playable", "tier": "Foundation",
             "why": "The safe retreat, and Karpov's choice against Kasparov in the sixteenth game of the 1990 world championship — which Kasparov won after a hundred and two moves. Black gives up the outpost and with it the need for the ...Ba6 pin, so the game turns slow: 9.Nc3 or 9.Nd2, then b3, Bb2 and g3, and your extra space is the only thing on the board.",
             "line": "Nc3 Qe6 Qe4 d5 exd6 Qxe4+"},
            {"san": "Nb4", "severity": "inaccuracy", "tier": "Structure",
             "why": "The knight goes forward to a square where a pawn can hit it. 9.a3! Na6 10.b4 and the knight is on the rim with c5 taken away from it for good, while your queenside pawns have gained two free moves in the direction they were going anyway.",
             "line": "a3 Na6 b4 g6 g3 Bg7"},
            {"san": "Bb7", "severity": "blunder", "tier": "Structure",
             "why": "The natural-looking bishop move that loses a piece, and the reason 8...Ba6 is the move: from a6 the bishop pins the c4-pawn against your queen on e2, so the knight on d5 is defended by that pin and nothing else. On b7 the bishop is blocked by Black's own pawn on c6 — it does not see d5 at all — so 9.cxd5 simply takes the knight.",
             "line": "cxd5 cxd5 Nd2 g6 Nf3"},
        ],

        # ── ply 18 · after 9.b3 — Black's four set-ups ──────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3": [
            {"san": "g6", "severity": "playable", "tier": "Plans",
             "why": "The move Karpov chose against Kasparov at Tilburg in 1991: keep the king in the centre for now, fianchetto, and decide later which way to castle. It is the soundest of Black's set-ups here. Kasparov answered 10.f4 and 11.Ba3, going straight at the bishop on f8 — step through that game, it is the clearest attacking model this opening has.",
             "line": "f4 f6 Ba3 Qf7 Qd2 Nb6",
             "see": "scotch#kasparov-karpov"},
            {"san": "f6", "severity": "playable", "tier": "Structure",
             "why": "Challenging the pawn at once, before castling. 10.Ba3! is the answer — you trade off the bishop that would otherwise defend Black's dark squares, and after 10...Qf7 11.Bxf8 Rxf8 Black has to recapture with a rook and the king never gets comfortable.",
             "line": "Ba3 Qf7 Bxf8 Rxf8 Qb2 Ne7"},
            {"san": "Nb6", "severity": "playable", "tier": "Foundation",
             "why": "The knight steps back before being asked, giving up the d5 outpost and taking the sting out of its own bishop on a6. It costs a little time and gives up nothing else: 10.Bb2 and 11.g3, and you are into the same fianchetto structures with a tempo in hand.",
             "line": "Bb2 g6 g3 Bg7 Bg2 O-O"},
        ],

        # ── ply 19 · after 9...O-O-O — two pawn moves that lose the thread ──────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O": [
            {"san": "Bb2", "severity": "playable", "tier": "Foundation",
             "why": "The other move order, and just as good: the bishop takes the long diagonal a move before g3. The only difference is that 10...Nf4 becomes possible — answer 11.Qe3, and once the knight commits to e6 the a7-pawn has no defender at all.",
             "line": "Nf4 Qe3 Ne6 Qxa7 Bb7 Nd2"},
            {"san": "a4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Throwing a pawn at the king before a single piece is developed, and it hands Black the initiative — two pawns' worth of it: 10...Nb4! 11.g3 Nd3+ and you cannot take. 12.Qxd3 Qxe5+! and the rook on a1 has no defender on the long diagonal that your own b3 opened, so 13.Be2 Bb4+ 14.Bd2 Bxd2+ 15.Qxd2 Qxa1+ costs a rook. You have to walk with 12.Kd2 instead. In the Scotch the attack comes from the two bishops on the long diagonals, not from the a-pawn.",
             "line": "Nb4 g3 Nd3+ Kd2 d5 Ba3"},
            {"san": "f4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Propping e5 up with a second pawn while the king is still on e1 and the rooks are still at home. 10...g5! hits back immediately and the f-file opens toward you rather than Black. This is the right idea about ten moves too early.",
             "line": "g5 fxg5 Bg7 Bb2 Nf4 Qe4"},
        ],

        # ── ply 20 · after 10.g3 — the deep dive's crossroads ───────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O g3": [
            {"san": "Re8", "severity": "playable", "tier": "Plans",
             "why": "Karpov's move in the fourteenth game of the 1990 world championship match: the rook lines up on the pawn before the knight decides anything. 11.Bb2 and 12.Nd2, and the game becomes a straight argument about e5 — Black adds attackers, you add defenders, and whoever runs out first loses the pawn.",
             "line": "Bb2 h5 Nd2 f6 Qf3 Nb6"},
            {"san": "f6", "severity": "playable", "tier": "Structure",
             "why": "The undermining move played at once. 11.Bg2! first — do not defend the pawn, develop behind it: after 11...fxe5 12.O-O the bishop on g2 is staring down the long diagonal at the doubled pawn on c6 and the a8 corner behind it, and Rfe1 comes next.",
             "line": "Bg2 fxe5 O-O Re8 Bb2 Nf6"},
            {"san": "g6", "severity": "playable", "tier": "Structure",
             "why": "The fianchetto after castling, which is Black's most solid arrangement: the bishop on g7 will hit e5 from a distance and cover the dark squares around the king. 11.Ba3! is the reply that matters — trade that bishop before it reaches g7.",
             "line": "Ba3 Nb4 Bb2 Bg7 f4 d6"},
            {"san": "Nb4", "severity": "inaccuracy", "tier": "Structure",
             "why": "The knight leaves the outpost to look for c2 and d3, and it does not get there: 11.Bb2 c5 12.Bg2 and Black has to give up the light-squared bishop or watch it get traded on b7 anyway. The knight on d5 was Black's best piece — moving it is the concession.",
             "line": "Bb2 c5 Bg2 Bb7 Bxb7+ Kxb7"},
        ],

        # ── ply 21 · after 10...Nb6 — where the light-squared bishop goes ───────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O g3 Nb6": [
            {"san": "Bb2", "severity": "playable", "tier": "Plans",
             "why": "The other bishop first. Taste rather than accuracy — both bishops belong on the long diagonals and the order rarely decides anything here. What it does change is that b2–c3–d4–e5 puts a piece behind the pawn everything is about, so ...f6 and ...d5 both come with a recapture ready.",
             "line": "d5 Bg2 dxc4 O-O Qe6 Rc1"},
            {"san": "Nd2", "severity": "playable", "tier": "Plans",
             "why": "The knight before the bishops, heading for f3 where it props up e5 — which is what Black is about to attack. Perfectly good, and it means ...f6 is answered by Bb2 and Bg2 rather than by anything forcing.",
             "line": "f6 Bb2 fxe5 Bg2 d5 O-O"},
            {"san": "Ba3", "severity": "inaccuracy", "tier": "Structure",
             "why": "The bishop tries the a3–f8 diagonal, which is the winning idea in the Kasparov–Karpov game — and it does not work here, because Black has not committed to ...g6 and ...f6 yet. 11...d6! blocks the diagonal and hits e5 in the same move, and after 12.exd6 cxd6 13.Qxe7 Bxe7 the doubled pawn is gone, the queens are off and the plan has cost you two tempi. Ba3 needs a bishop still sitting on f8 with no pawn able to shield it.",
             "line": "d6 Bb2 dxe5 Nd2 Nd7 Bh3"},
        ],

        # ── ply 22 · after 11.Bg2 — Black's four ways to hit e5 ─────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 O-O-O g3 Nb6 Bg2": [
            {"san": "f6", "severity": "playable", "tier": "Foundation",
             "why": "Straight at the pawn, without lining the rooks up first, and it wins it: 12.a4 fxe5 and you are a pawn down. That is the bargain the whole variation offers — 13.O-O and the engine still has you the better side, because Black's new pawn on e5 needs pieces to hold it and the bishop on g2 is looking through c6 at the a8 corner.",
             "line": "a4 fxe5 O-O d5 Qc2"},
            {"san": "Re8", "severity": "playable", "tier": "Foundation",
             "why": "Adding the attacker before pushing the pawn — the same idea as the main line's ...Rhe8, one move earlier. 12.Bb2 f6 13.O-O fxe5 and the pawn goes, exactly as it does in the deep dive; what you get for it is a knight coming to e5 instead, on a square no black pawn can ever contest.",
             "line": "Bb2 f6 O-O fxe5 Qc2"},
            {"san": "d5", "severity": "playable", "tier": "Structure",
             "why": "The freeing move played at once, and it is the sharpest thing in the position: 12.Ba3! Qe6 13.cxd5 and now the bishop on a6 and your queen on e2 are on the same diagonal with nothing between them, so 13...Bxe2 14.dxe6 trades the queens off inside the tactics. You come out of it a little better with the healthier pieces — but you have to see it before you play 11.Bg2.",
             "line": "Ba3 Qe6 cxd5 Bxe2 dxe6"},
            {"san": "Qb4+", "severity": "inaccuracy", "tier": "Structure",
             "why": "A check that abandons the pin on e5, which is the one thing Black's queen was doing on e7. 12.Nd2 and the check has cost Black more than it cost you: the queen is off the file, e5 is safe, and 13.O-O leaves her with nothing to do on b4.",
             "line": "Nd2 Re8 O-O f6 Nf3 fxe5"},
        ],

        # ══ CLASSICAL VARIATION ═════════════════════════════════════════════════

        # ── ply 9 · your own fifth move against 4...Bc5 ─────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5": [
            {"san": "Nxc6", "severity": "playable", "tier": "Structure",
             "name": "Intermezzo Variation",
             "why": "Trade the knight rather than defend it — and be ready for the in-between move: 5...Qf6! comes before the recapture, so answer with 6.Qf3 or 6.Qd2 and only then let Black take. This is Kasparov's own treatment; he played it against Short in the 1993 world championship match and against Yusupov, Topalov and Anand. Nothing is being won or lost here, the queens simply come off early.",
             "line": "Qf6 Qf3 bxc6 Nc3 d6 Be3"},
            {"san": "Nb3", "severity": "playable", "tier": "Structure",
             "name": "Potter Variation",
             "why": "Retreat and keep every piece. The knight on b3 covers c5 and d4 and gains a tempo on the bishop, and after 5...Bb6 6.Qe2 you have a slow, safe, level game — Carlsen's choice when he wants to grind rather than calculate; he played it four times in a row at the 2009 World Blitz. Do not expect an edge out of the opening here, expect a long game.",
             "line": "Bb6 Qe2 Nf6 Nc3 O-O Be3"},
            {"san": "Nf5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "It looks like a threat against g7 and it is not one. 5...d5! opens the c8-bishop's road to f5, and after 6.exd5 Bxf5 the knight has been traded for two of your tempi. It is a mistake rather than a disaster — about half a pawn — but two knight moves to reach a square where a bishop simply takes it is not how you play an open position.",
             "line": "d5 exd5 Bxf5 Qe2+ Nge7 dxc6"},
            {"san": "Nb5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "It looks like Nxc7+, forking the king and the a8-rook. It is not: the queen on d8 has covered c7 since the game started, so there is no threat to answer. 5...Nf6 and the knight on b5 does nothing while every black piece comes out with a purpose. Two knight moves spent on an empty square, in a position where the centre is already open.",
             "line": "Nf6 Bd3 d6 h3 Be6 Nd2"},
        ],

        # ── ply 10 · after 5.Be3 — the bishop on c5 is hanging ──────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3": [
            {"san": "Bb6", "severity": "playable", "tier": "Structure",
             "why": "Stepping the bishop out of the way rather than defending it with the queen. Perfectly sound and a shade passive: from b6 the bishop no longer presses on f2 or on your bishop on e3, which frees your knight — 6.Nf5!? is a genuine try, and after 6...d5 7.Nxg7+ Kf8 8.Nh5 you come out of it well.",
             "line": "Nf5 d5 Nxg7+ Kf8 Nh5 Qh4"},
            {"san": "d6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The pawn does defend the bishop — and it walks into a structural wreck: 6.Nxc6! bxc6 7.Bxc5 dxc5 and Black has three pawns on the c-file and no castling after 8.Qxd8+. Defending a piece is not the same as solving the problem.",
             "line": "Nxc6 bxc6 Bxc5 dxc5 Qxd8+ Kxd8"},
            {"san": "Nf6", "severity": "blunder", "tier": "Foundation",
             "why": "Developing while the bishop on c5 hangs, defended by nothing — and the move order matters, because 6.Bxc5 is not even legal: your own knight on d4 stands between the bishop and c5. 6.Nxc6! bxc6 clears the diagonal with a move Black has to answer, and then 7.Bxc5 wins the bishop. Black gets the e4-pawn back with 7...Nxe4, so call it a piece for a pawn. Look at what is hanging — and at what is in the way — before you develop the next piece.",
             "line": "Nxc6 bxc6 Bxc5 d6 Bd4"},
        ],

        # ── ply 11 · after 5...Qf6 — three attackers against two defenders ──────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6": [
            {"san": "Nc3", "severity": "blunder", "tier": "Foundation",
             "why": "The most natural move on the board and it loses a piece. Count d4: the bishop on c5, the knight on c6 and the queen on f6 all hit it — three attackers — while only the bishop on e3 and the queen on d1 defend it. 6...Bxd4! and there is no way back. 6.c3 exists precisely to supply the third defender.",
             "line": "Bxd4 Nd5 Qe5 Bxd4 Nxd4"},
            {"san": "Nb3", "severity": "inaccuracy", "tier": "Structure",
             "why": "Saving the knight and abandoning the bishop: 6...Bxe3 7.fxe3 Qh4+! and the king has to walk to d2, the e-pawns are a ruin and the e4-pawn falls next. If you are going to retreat the knight, do it on move five, before the queen reaches f6.",
             "line": "Bxe3 fxe3 Qh4+ Kd2 Nf6 Bd3"},
            {"san": "Nb5", "severity": "inaccuracy", "tier": "Structure",
             "name": "Blumenfeld Attack",
             "why": "It has a name, which is the only good thing about it: same idea as 6.Nb3, same problem. 6...Bxe3 7.fxe3 Qh4+ 8.g3 Qxe4 and the pawn is gone with your king still on e1. You do get 9.Nxc7+ Kd8 10.Nxa8 for the rook, and 10...Nf6 11.Nc3 Qxh1 takes it straight back — the whole sequence comes out about level, which is a poor return on a piece White never needed to move twice.",
             "line": "Bxe3 fxe3 Qh4+ g3 Qxe4"},
            {"san": "Nxc6", "severity": "inaccuracy", "tier": "Structure",
             "why": "Trading one move too late. With the queen already on f6 the in-between move belongs to Black: 6...Bxe3! 7.fxe3 dxc6 and you have doubled e-pawns, a king that has to be walked to safety by hand, and nothing to show for either. 5.Nxc6 was the moment; after 5.Be3 Qf6 the move is 6.c3.",
             "line": "Bxe3 fxe3 dxc6 Qd4 Qh4+ g3"},
        ],

        # ── ply 12 · after 6.c3 ─────────────────────────────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3": [
            {"san": "d6", "severity": "playable", "tier": "Foundation",
             "why": "Solid: the pawn covers c5 and e5 and opens the c8-bishop. 7.Na3! is the move that makes it slightly awkward — the knight develops without blocking the c-pawn, and from a3 it eyes b5 and c4.",
             "line": "Na3 Nxd4 Bxd4 Bxd4 cxd4 c6"},
            {"san": "Nxd4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Cashing in the tension and handing you the position the whole opening is trying to build: 7.cxd4! and there is your classical pawn duo on d4 and e4, with the c-file half-open for a rook. Black has traded a good knight for the structure you wanted.",
             "line": "cxd4 Bb6 Nc3 Ne7 a4 a5"},
        ],

        # ── ply 14 · after 7.Bc4 — Black's four sound tries ─────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4": [
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "King safety first, which is what Short and Kamsky both chose against Kasparov. 8.O-O and then a4 and Kh1 — a slow, healthy game where your extra space is the only asset either side has. Nothing to calculate and nothing to fear.",
             "line": "O-O Bb6 a4 d6 Kh1 Qg6"},
            {"san": "Qg6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The queen leaves f6 before the knight has come to e5, and the tactics turn: 8.Nxc6! Qxc6 9.Qh5! and f7 is attacked twice while the black king still sits on e8. The queen was doing a job on f6 — she was the third attacker of d4.",
             "line": "Nxc6 Qxc6 Qh5 Bxe3 Qxf7+ Kd8"},
        ],

        # ── ply 16 · after 8.Be2 — the knight on e5 has one bad idea ────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2": [
            {"san": "d6", "severity": "playable", "tier": "Foundation",
             "why": "Solidifying first and leaving the queen on g6 for later. Answer 9.O-O and you are straight back on the map — after 9...Qg6 10.f3 O-O 11.Nd2 this is the main line with the moves in a different order.",
             "line": "O-O Qg6 f3 O-O Nd2"},
            {"san": "Nd3+", "severity": "blunder", "tier": "Foundation",
             "why": "A check that gives the knight away: 9.Bxd3 and there is nothing behind it. The king on e1 looks awkward and it is perfectly safe — a check is only a threat if the checking piece survives.",
             "line": "Bxd3 d5 O-O dxe4 Bxe4"},
        ],

        # ── ply 17 · after 8...Qg6 — g2 needs a guard ──────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6": [
            {"san": "Nd2", "severity": "inaccuracy", "tier": "Structure",
             "why": "Development that leaves g2 hanging: 9...Qxg2! takes the pawn and hits the rook in the corner, so 10.Rf1 and Black is a pawn up for nothing. Castle first — 9.O-O — and g2 is guarded by the king, which is the whole reason the main line castles here.",
             "line": "Qxg2 Rf1 d5 Qa4+ Bd7 Qb3"},
            {"san": "Bh5", "severity": "blunder", "tier": "Structure",
             "why": "Chasing the queen off the g-file with the piece that was guarding g2. 9...Qxg2! and now 10.Bf3 Nxf3+ 11.Qxf3 Qxf3 12.Nxf3 has cost you a clean pawn and the whole kingside. The bishop belongs on e2 until the king is castled.",
             "line": "Qxg2 Bf3 Nxf3+ Qxf3 Qxf3 Nxf3"},
        ],

        # ── ply 18 · after 9.O-O — the knight on e5 has no defender yet ─────────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6 O-O": [
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "Castling instead of propping the knight up with ...d6. It is sound and it is level — 10.Nd2 and then Bh5 to ask the queen a question, and Black still owes the knight on e5 a defender before anything else can happen.",
             "line": "Nd2 d5 Bh5 Qf6 Qe2 Qh4"},
            {"san": "d5", "severity": "playable", "tier": "Structure",
             "why": "The freeing move played at once, and it invites a forced sequence rather than a positional game: 10.Bh5! and the queens come off by force — 10...Bg4 11.Bxg6 Bxd1 12.Bxf7+ Kxf7 13.Rxd1 and you are a pawn up with the black king on f7 and no castling. Know it before you play 9.O-O.",
             "line": "Bh5 Bg4 Bxg6 Bxd1 Bxf7+ Kxf7"},
            {"san": "Bxd4", "severity": "blunder", "tier": "Foundation",
             "why": "The trade that is fine one move later and costs a piece now. 10.cxd4! and the pawn attacks the knight on e5, which with Black's pawn still on d7 has nothing defending it: 10...Nd3 11.Bxd3 is simply a piece, and 10...N5c6 11.d5! chases it again — Ne5 12.f4 traps it, so it has to crawl back to d8 and the position falls apart anyway. This is exactly what 9...d6 is for.",
             "line": "cxd4 N5c6 d5 Ne5 f4"},
        ],

        # ── ply 19 · after 9...d6 — your tenth move decides the character ───────
        "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6 O-O d6": [
            {"san": "f4", "severity": "playable", "tier": "Plans",
             "why": "The sharpest move and a real pawn offer: 10...Qxe4 11.Bf2 Bxd4 12.cxd4 and your centre is one pawn on d4 rather than two. What you get for it is both bishops — Black's dark-squared bishop has gone — the half-open c-file that the c-pawn's recapture opened, and a black queen that needs three moves to get home. Carlsen played exactly this against Leko and won; step through it before you try it.",
             "line": "Qxe4 Bf2 Bxd4 cxd4 N5g6 Nc3",
             "see": "scotch#carlsen-leko"},
            {"san": "Kh1", "severity": "playable", "tier": "Foundation",
             "why": "The safe move: step off the a7–g1 diagonal that Black's bishop on c5 is already sitting on, so that nothing in the centre ever comes with a check attached. Then f3 or f4 at your leisure — nothing is going anywhere.",
             "line": "Qxe4 Nd2 Qg6 Bh5 Bg4 Qa4+"},
            {"san": "f3", "severity": "playable", "tier": "Structure",
             "why": "The most solid of the three: it takes g4 and e4 from Black's pieces in one move, and the pawn on f3 means ...Qxe4 is never on. Slower than 10.f4 and completely free of risk.",
             "line": "O-O Nd2 d5 a4 N5c6 Rc1"},
        ],

        # ══ SCOTCH GAMBIT ═══════════════════════════════════════════════════════

        # ── ply 8 · after 4.Bc4 — Black has to decide about the extra pawn ──────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4": [
            {"san": "Bc5", "severity": "playable", "tier": "Foundation",
             "name": "Haxo Gambit",
             "why": "Black adds a second defender to the d4-pawn, and this is the reason you have to know 5.c3!. Two things to bank: 5.Nxd4?? drops a piece to 5...Bxd4, and 5.Ng5 Nh6 6.Nxf7 Nxf7 7.Bxf7+ Kxf7 8.Qh5+ comes out dead level rather than as an attack. Play 5.c3 and take the centre.",
             "line": "c3 Nf6 e5 d5 Bb5 Ne4"},
            {"san": "Bb4+", "severity": "playable", "tier": "Structure",
             "name": "London Defence",
             "why": "Black grabs the c3 square before your pawn can have it. 5.c3! anyway — and after 5...dxc3 6.bxc3! rather than 6.Nxc3, the pawn on c3 hits the bishop, the b-file opens for your rook and your pawn on e4 has nothing opposing it. Sound, and the sort of position where knowing the plan beats knowing the moves.",
             "line": "c3 dxc3 bxc3 Ba5 O-O Bb6"},
            {"san": "Be7", "severity": "playable", "tier": "Structure",
             "name": "Benima Defence",
             "why": "Black gives the pawn straight back and just gets castled. 5.Nxd4 and you have an ordinary Scotch where your bishop is already on its best diagonal and Black's is on a square that attacks nothing. Comfortable, riskless, and a small permanent edge.",
             "line": "Nxd4 Nf6 Nc3 O-O O-O d6"},
            {"san": "Qf6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The queen holds the pawn and takes the square Black's own knight wanted. 5.O-O! — do not chase her, castle. Then 6.c3 either wins the d4-pawn back or leaves Black defending it with pieces, and either way your rook is on f1 while the black king is still on e8.",
             "line": "O-O d6 c3 Bg4 Qb3 Nge7"},
        ],

        # ── ply 9 · your own fifth move in the gambit ───────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6": [
            {"san": "O-O", "severity": "playable", "tier": "Plans",
             "why": "The double gambit: castle and offer e4 as well. 5...Nxe4 6.Re1 d5 7.Bxd5 Qxd5 8.Nc3 and every piece you own comes out with a threat. And if Black answers 5...Bc5, 6.e5 d5 7.exf6 dxc4 8.Re1+ is the Max Lange Attack. Sound, sharp, and a great deal more theory than 5.e5.",
             "line": "Nxe4 Re1 d5 Bxd5 Qxd5 Nc3"},
            {"san": "Nxd4", "severity": "playable", "tier": "Structure",
             "why": "Taking the pawn back and playing a normal Scotch. It is sound, and it hands Black the initiative for a moment: 5...Nxe4! 6.Bxf7+ Kxf7 7.Qh5+ g6 8.Qd5+ regains the piece, so the whole line is a forced sequence you have to know rather than a quiet option.",
             "line": "Nxe4 Bxf7+ Kxf7 Qh5+ g6 Qd5+"},
            {"san": "Ng5", "severity": "playable", "tier": "Foundation",
             "why": "Two attackers on f7 and no third one coming. 5...d5! is the answer and it is enough: the pawn blocks the bishop's diagonal, so the knight on g5 has nothing behind it. Playable, and it throws away the lead in development that the gambit was paid for.",
             "line": "d5 exd5 Qe7+ Kf1 Ne5 Qxd4"},
        ],

        # ── ply 10 · after 5.e5 — the knight has to move ────────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5": [
            {"san": "Ne4", "severity": "playable", "tier": "Structure",
             "why": "The knight goes forward instead of blocking with the d-pawn. It is the engine's preference and it needs an accurate answer: 6.Qe2! hits the knight and holds e5 at once, and after 6...Nc5 7.O-O the extra pawn on d4 is still yours to win back.",
             "line": "Qe2 Nc5 O-O Ne6 c3 d5"},
            {"san": "Ng4", "severity": "playable", "tier": "Structure",
             "why": "The knight hops to the edge of the kingside where nothing can chase it cheaply. 6.O-O and 7.Re1, and note what Black has given up: with the knight on g4 there is no ...d5 coming, so your pawn on e5 is a wedge rather than a target.",
             "line": "O-O Be7 Re1 d6 exd6 cxd6"},
            {"san": "Qe7", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Holding the knight with the queen, which puts her on the file your rook is heading for. 6.O-O! Ng4 7.Re1 and the queen is sitting behind your own e5-pawn — the moment that pawn moves or is traded she has to run, so every developing move you make comes with a question attached. Black should block with 5...d5 and keep the extra pawn.",
             "line": "O-O Ng4 Re1 Qc5 b3 b5"},
        ],

        # ── ply 11 · after 5...d5 — do not take the knight ──────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5": [
            {"san": "exf6", "severity": "blunder", "tier": "Foundation",
             "why": "Grabbing the knight and giving away the piece the gambit was played for: 6...dxc4! and after 7.fxg7 Bxg7 Black has the extra pawn from move three, both bishops and a pawn on c4 you have to spend time on. Material comes out level and the position does not. 6.Bb5! is the move.",
             "line": "dxc4 c3 Bg4 Qe2+ Be6 fxg7"},
            {"san": "Bb3", "severity": "inaccuracy", "tier": "Structure",
             "why": "Saving the bishop by retreating instead of by pinning, and it costs the initiative: after 6...Ne4 you can still win the d4-pawn back, but Black has a knight on a strong square and the better game. 6.Bb5 is the move because it pins the c6-knight to the king — with d7 empty that pin is absolute, and it is what makes the rest of the line work.",
             "line": "Ne4 O-O Bg4 Ba4 Nc5 Qxd4"},
        ],

        # ── ply 12 · after 6.Bb5 — the pin is on, and one check loses ───────────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5 Bb5": [
            {"san": "Nd7", "severity": "playable", "tier": "Structure",
             "why": "The engine's first choice, and the quietest: the knight steps back behind the pawn instead of jumping to e4, so the e5-pawn is attacked twice and defended once. 7.O-O and 8.Bxc6 bxc6 9.Nxd4, and you have the pawn back and the doubled pawns to play against. Less sharp than 6...Ne4 and just as sound.",
             "line": "O-O Be7 Bxc6 bxc6 Nxd4"},
            {"san": "Ng4", "severity": "inaccuracy", "tier": "Structure",
             "why": "The knight goes to the rim, where a pawn can reach it in one move. 7.h3! Nh6 8.Bxh6 gxh6 and Black's kingside is wrecked, after which 9.Qxd4 wins the pawn back with the better structure. The knight on g4 was never doing anything the knight on e4 does.",
             "line": "h3 Nh6 Bxh6 gxh6 Qxd4"},
            {"san": "Bb4+", "severity": "blunder", "tier": "Foundation",
             "why": "A check that loses a piece, and the mechanism is worth knowing: 7.c3! dxc3 8.bxc3 and the pawn hits the bishop, so it has to move again — except that every retreat along the diagonal lands it on a5, where its only defender is the knight on c6, and your bishop on b5 has that knight pinned to the king. 9.Qa4! and one of the two pieces drops; in practice Black gives the bishop up at once with 8...O-O 9.cxb4.",
             "line": "c3 dxc3 bxc3 O-O cxb4"},
        ],

        # ── ply 16 · after 8.Bxc6 — which piece takes back ──────────────────────
        "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5 Bb5 Ne4 Nxd4 Bd7 Bxc6": [
            {"san": "Bxc6", "severity": "playable", "tier": "Structure",
             "why": "Recapturing with the bishop to keep the pawns healthy — except it is not on offer. 9.Nxc6! bxc6 and the pawns are doubled anyway, and Black has given up a bishop to get there. Sound enough, and it is the reason the main line takes with the pawn: same structure, one more bishop.",
             "line": "Nxc6 bxc6 O-O Bc5 Nd2 Nxd2"},
        ],
    },
    "games": [
        {
            "id": 'kasparov-karpov-1991',
            "name": "Kasparov – Karpov, Tilburg 1991 — the Mieses attack",
            "tier": 'Plans',
            "note": "Kasparov's revival of the Scotch in the early 1990s was aimed squarely at Karpov, and this is the game that shows what he was after. It follows the main line to 9.b3, Karpov answers 9...g6 instead of castling, and then White spends four moves opening every line toward the black king before a single piece is traded.",
            "moves": (
                'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 g6 '
                'f4 f6 Ba3 Qf7 Qd2 Nb6 c5 Bxf1 cxb6 axb6 e6 dxe6 Bxf8 Rd8 Qb2 Bxg2 Qxg2 Kxf8 '
                'Qxc6 Rd6 Qc3 Kg7 Nd2 Rhd8 O-O-O Qe8 Qxc7+ R8d7 Qc2 Qb8 Nc4 Rd5 Qf2 Qc7 '
                'Qxb6 Qxf4+ Qe3 Qg4 Rdg1 Qh4 Rg3 e5 Rh3 Qg4 Rg1 Rd1+ Rxd1 Qxd1+ Kb2 h5 '
                'Rg3 Qh1 Qf2 h4 Qg2 Qxg2+ Rxg2 g5 a4 Kg6 a5 e4 b4 h3 Rg3 Rh7 a6 f5 Ra3'
            ),
            "notes": {
                18: "Karpov keeps the king in the centre and fianchettoes rather than castling long. It is the soundest of Black's set-ups here — and it leaves the bishop on f8 as the piece the whole game turns on.",
                19: "10.f4, propping the e5-pawn up with a pawn so that every piece is free for something else. Compare the main line, where g3 and Bg2 do the work: here Kasparov wants the f-file.",
                21: "11.Ba3! The point of the whole set-up: the bishop takes aim at f8 and the fianchetto Karpov has spent a move preparing will never happen. Black can block the diagonal — 11...c5! is the move, and it holds — but it costs the doubled pawn's future, and Karpov chose to keep the pawn and hand over the bishop instead.",
                25: "13.c5, attacking the knight on b6 with a pawn and vacating c4 for the knight that still has not moved. Notice that White has not developed it in thirteen moves — every move so far has carried a threat instead.",
                29: "15.e6! The pawn that was White's biggest weakness for fourteen moves turns into a battering ram, because dxe6 opens the d-file and the f8-bishop is still where it started.",
                31: "16.Bxf8 finally cashes in. Karpov inserts 16...Rd8 and only takes the bishop two moves later; when the dust settles after 18...Kxf8 it is four white pawns against seven — a knight for three pawns — and the black king is sitting on f8 with no shelter at all.",
                37: "19.Qxc6 collects one of the doubled pawns that has been a target since move five. White is a knight up and two pawns down — and from here every trade makes the extra piece bigger, which is why the next fifteen moves are all captures and checks.",
                43: "22.O-O-O — move twenty-two, and White castles at last. The attack was never about king safety: all four bishops are already off the board, and what is left is queen, two rooks and an extra knight against queen and two rooks, with the d-file — the only fully open file on the board — for the rook the king has just connected.",
                53: "27.Qxb6 evens the pawn count at four each, which means White is now a clean knight up. From here it is technique, and Karpov's counterplay against f4 and the g-file never quite arrives.",
                65: "33.Rxd1 takes the rook trade off the board. What is left is queen, rook and knight against queen and rook — still the extra piece — with White's a- and b-pawns free to run and Black's four pawns all on the kingside.",
                85: "43.a6 — a passed pawn two squares from home with a knight and a rook to escort it. It is not a majority doing this: Black's queenside pawns were captured one by one, and the reason they could be is that they stood on two files with nothing to defend each other.",
                87: "44.Ra3, rook behind the passer, and Karpov resigned. The whole game in one sentence: a wedge on e5, a bishop on the a3–f8 diagonal, and when the smoke cleared, the queenside pawn structure from move five decided it anyway.",
            },
        },
        {
            "id": 'carlsen-leko-2009',
            "name": "Carlsen – Leko, Nanjing 2009 — the Classical pawn offer",
            "tier": 'Structure',
            "note": "The Classical Variation main line, move for move, to the end of the line you have just stepped through — and then 10.f4!?, offering the e4-pawn for the two bishops and the c-file. Watch how a position with no weaknesses at all turns into a rout in fifteen moves.",
            "moves": (
                'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6 O-O d6 '
                'f4 Qxe4 Bf2 Bxd4 cxd4 N5g6 g3 O-O Nc3 Qf5 d5 a6 Re1 Kh8 Rc1 Bd7 Bf3 Rac8 '
                'Qb3 b5 Ne2 Qh3 Nd4 Bg4 Bg2 Qh5 h4 Ng8 Rc6 Nf6 Rxa6 Bd7 Nxb5 Rb8 a4 Ng4 '
                'Bf3 Qh6 Qc4 Nxh4 Bxg4 Bxg4 gxh4 Bf3 f5 Qh5 Qf4 Bxd5 Nxc7 Bb7 Rb6 f6 Bd4 Qf7 '
                'Ne6 Rg8 Kf2 Rbc8 Bc3 Bd5 a5 Rc4 Nd4 Ba8 Qxd6 Qh5 Qf4 Rcc8 Rbe6'
            ),
            "notes": {
                19: "10.f4, the move this game is remembered for. It attacks the knight on e5 and offers e4 in the same breath — and Black has no good way to decline, because retreating the knight leaves the f-pawn rolling.",
                20: "Leko takes. He is a clean pawn up and White has no immediate threat at all; everything that follows is paid for by that pawn.",
                21: "11.Bf2, quietly stepping off the diagonal so that ...Bxd4 no longer comes with a check. In a position where you are a pawn down, the move that removes your opponent's tempo is worth more than the move that creates a threat.",
                23: "12.cxd4 and the compensation is visible: both bishops, pawns on d4 and f4, the c-file for a rook, and a black queen on e4 that has nowhere useful to go. White's e-pawn is gone, so this is two bishops and time against one pawn.",
                25: "13.g3 takes h4 and f4 from the queen and prepares Bg2. The queen has now spent three moves winning one pawn.",
                29: "15.d5! The pawn goes past rather than waiting to be attacked, and it takes c6 and e6 from Black's knights for the rest of the game. From here every white piece has a route to the queenside and Black's do not.",
                37: "19.Qb3, backing the d5-pawn and eyeing a4 and b4 — the b-file is blocked by White's own pawn on b2, so b7 is not under attack and Leko's 19...b5 is prophylaxis against the pawns, not a forced move. It is also the concession the whole phase was aimed at: on b5 the pawn no longer covers c6, and c6 is the square the rook walks into five moves later.",
                47: "24.Rc6! The rook steps in along the sixth rank, where the a6-pawn has no defender at all — the b-pawn moved to b5. Nothing on the board attacks c6: Black's own pawn on c7 stands between the c8-rook and the square, and neither the b5- nor the d6-pawn covers it. So the rook simply sits there hitting three pawns at once — a6, c7 and d6.",
                49: "25.Rxa6 wins the pawn back and the position with it. Material is level, White has all the play, and Leko's extra pawn from move ten is a memory.",
                63: "32.f5! The second pawn offer, and this one is not really an offer — it shuts the g6 square and traps the black queen on the wrong side of the board.",
                67: "34.Nxc7 and the pawns start falling. Every capture from here comes with a threat, which is the difference between an attack and a series of moves.",
                73: "37.Ne6 — the knight lands on a square Black has had no pawn to cover since 3...exd4, twenty-two moves ago. The rook on e1 and the pawn on f5 both guard it, only the queen attacks it, and no black pawn can ever chase it: it cannot be taken and it cannot be driven away.",
                83: "42.Qxd6 collects the d-pawn, so White is a piece and a pawn up — knight and bishop against a bishop, four pawns against three — with a passed pawn on a5 as well.",
                87: "44.Rbe6 and Leko resigned: both rooks are on the e-file, the queen, both black rooks and the bishop on a8 are all somewhere else, and the king has three pawns for company. The pawn Carlsen gave away on move ten bought a tempo, a file and the two bishops — and he never had to prove it with a tactic, only with squares.",
            },
        },
    ],
    "progression": {
        "arc": "The Scotch is the fast route to a real 1.e4 repertoire: open positions, clear plans, and roughly a tenth of the Ruy Lopez's theory.",
        "stages": [
            {
                "tier": "Foundation",
                "when": "Week one",
                "goal": "Know what to do after 3...exd4 4.Nxd4 against each of Black's four replies.",
                "learn": [
                    "The two main branches: 4...Nf6 (Mieses) and 4...Bc5 (Classical). Learn one line against each and nothing more at first.",
                    "Why 5.Nxc6 is played in the Mieses — it damages Black's structure and buys the tempo for e4–e5.",
                    "The answer to 4...Qh4: 5.Nc3, which hands over the e4-pawn on purpose in return for a lead in development and a black king stuck on d8. Never 5.Nf5, which hands it over for nothing.",
                ],
                "drill": "Play the Scotch exclusively for two weeks. The positions repeat quickly and you will learn the patterns fast.",
                "mistake": "Answering 4...Bc5 with 5.Nb5 or 5.Nf5. Both look like threats and neither is one — after 5.Nb5 a6 or 5.Nf5 d5 the knight has been chased twice and Black is the better developed side.",
                "ready": "You can reach move eight in both main branches without hesitation.",
            },
            {
                "tier": "Structure",
                "when": "Weeks two to six",
                "goal": "Learn to play with and against doubled pawns and a space advantage.",
                "learn": [
                    "The Mieses structure: Black's three queenside pawns standing on two files against your three on three files. That difference, not a majority, is your winning plan.",
                    "The double edge of the e5-pawn: it grabs space and it is a permanent target for ...Qe7, ...Ba6 and ...O-O-O.",
                    "When to castle queenside yourself and turn the game into a race.",
                ],
                "drill": "Play out the Mieses tabiya after 9...O-O-O ten times from both sides. Notice how often the game is decided by whose attack lands first.",
                "mistake": "Defending the e5-pawn passively. It is a spearhead, not a possession — sometimes you give it up for activity.",
                "ready": "You can explain why the doubled c-pawns matter more in an endgame than a middlegame.",
            },
            {
                "tier": "Plans",
                "when": "Months two to four",
                "goal": "Convert the small opening edge into something.",
                "learn": [
                    "The healthy queenside: three pawns on three files against three on two files stops Black making a passer and does not, on its own, make you one — so learn which piece has to stay on to turn it into a win.",
                    "The two long diagonals in the opposite-castling lines: Bg2 pointing through c6 at the king, Bb2 holding e5.",
                    "Meeting ...d5 breaks: usually you take and blockade rather than push past.",
                ],
                "drill": "Take five of your own Scotch games and mark the exact move where you stopped having a plan. That is your study list.",
                "mistake": "Trading pawns instead of pieces. Your edge is Black's pawn structure, and structure only pays out once the pieces are gone — so a piece trade is progress and a pawn trade that straightens Black's pawns out is a concession.",
                "ready": "You have won a Scotch endgame purely on the queenside pawns.",
            },
            {
                "tier": "Mastery",
                "when": "Ongoing",
                "goal": "Add the gambit lines and the anti-Scotch systems.",
                "learn": [
                    "The Scotch Gambit 4.Bc4 as a second weapon, especially against opponents who prepare 4.Nxd4 lines.",
                    "The Göring Gambit 4.c3 for when you want the game to catch fire.",
                    "How Black avoids the Scotch entirely with 2...Nf6 (Petrov) or 2...d6 (Philidor) — you need a plan against both.",
                ],
                "drill": "Prepare one complete line against the Petrov. It is the most common way strong players sidestep everything you have learned.",
                "mistake": "Assuming Black must play 2...Nc6. At club level roughly one game in five will not.",
                "ready": "Every Black second move has an answer in your file.",
            },
        ],
        "study": "Garry Kasparov's Scotch games from the early 1990s revived the whole opening. For the modern positional treatment, look at how Ian Nepomniachtchi and Anish Giri handle the Mieses.",
        "next": "The Scotch pairs naturally with the Italian — same principles, different pace. Learn both and you can choose the character of the game on move three.",
    },
}

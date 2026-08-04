OPENING = {
    "id": "kid",
    "name": "King's Indian Defence",
    "eco": "E60–E99",
    "section": "indian",
    "orientation": "black",
    "tagline": "Give White the whole centre, then blow up the kingside. The most aggressive answer to 1.d4.",
    "level": "Intermediate → World Championship",
    "theory": {
        "big_idea": "Black lets White build a big pawn centre with c4, d4 and e4, then attacks it from a distance with a fianchettoed bishop and the break ...e5. If White closes with d4–d5 the position locks and the two sides attack on opposite wings: White's pawn chain e4–d5 points at the queenside, so White breaks with c4–c5 against d6; Black's chain d6–e5 points at the kingside, so Black breaks with ...f5 against e4. Each side is attacking the base of the other's chain, and neither has time to defend.",
        "structure": "The defining structure is the Mar del Plata: White pawns on c4, d5 and e4 against black pawns on c7, d6 and e5, with everything else still at home. The wall is diagonal, and the diagonal is the instruction: your pawns point at White's king, so that is where you play. Say it plainly — you will be objectively worse for a long time. The engine rates the whole opening about half a pawn in White's favour from move five, and every King's Indian player knows it.",
        "white_plans": [
            "Close with d5, then break with c4–c5 against d6, open the c-file and land a knight on b5 or a rook on c7.",
            "The Sämisch with f3: hold e4 with a pawn, castle queenside and race Black on the kingside with g4 and h4.",
            "The Fianchetto with g3 and Bg2. This is the system that scores best, and not because it opposes the g7-bishop — the two bishops sit on different diagonals and never meet. Bg2 guards d5 and c6 in front and f1, f3 and h3 behind, and those last three are the squares a kingside attack has to come through.",
            "Trade the g7-bishop off with Be3, Qd2 and Bh6, or with Bg5 and Bxf6. Black's attack is much slower without it.",
        ],
        "black_plans": [
            "Break with ...e5, then get a knight out of the f-pawn's way: ...Ne7–g6 in the Classical, ...Nf6–d7 or ...Nh5 elsewhere.",
            "The storm: ...f5, ...f4, ...g5, ...h5, ...g4, with the rook lift ...Rf7–g7 or ...Rf6–h6 behind it.",
            "Do not defend the queenside. Recapture when you must, spend every other move on the attack, and accept that d6 will be weak.",
            "Against the Fianchetto, switch plans completely: ...c6 to fight for d5, ...a5 for queenside space, and pressure on d4 and c4 instead of a pawn storm.",
        ],
        "traps": [
            "In the Classical, 9.Ne1 Nh5? drops a pawn to 10.Bxh5! gxh5 11.Qxh5 — the bishop has been covering h5 from e2 since move six. In the Sämisch, where White has no bishop on e2, ...Nh5 is the main move. Same knight, different position, opposite verdict.",
            "Against the Averbakh (5.Be2 O-O 6.Bg5), the automatic 6...e5 costs half a pawn: 7.dxe5 dxe5 8.Qxd8 Rxd8 9.Nd5! Nxd5 10.Bxd8 Nf4 and White is the exchange up for a pawn. Play 6...c5 or 6...h6 first.",
            "In the Sämisch, 9.g4?? loses two pawns to 9...fxg4 10.O-O-O gxf3 — the pawn on g4 was defended only by f3, so taking it leaves f3 hanging as well.",
            "White's c4–c5 break is only good once it cannot be taken. While your knight still sits on d7, 12.c5?! Nxc5 wins a pawn.",
        ],
        "who": "Play this if you want to attack from move one with Black and you accept being objectively worse for thirty moves in exchange. Fischer, Kasparov and Radjabov made it famous, and none of them played it because it equalises.",
    },
    "lines": [
        {
            "name": "Classical — Mar del Plata",
            "note": "The main line and the sharpest position in modern chess. Both sides attack on opposite wings and nobody defends.",
            "moves": "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 f3 f4 Bd2 g5",
            "tier": "Structure",
            "drill": True,
            "plan": {
                "structure": 'mar-del-plata-locked-chain',
                "tier": "Plans",
                "point": "Two attacks and no defence. Count the moves each side needs and you have the whole game: White wants Rc1, c4–c5, cxd6 and then Nb5 or Rc7; you want ...Ng6, ...h5, ...g4 and then a piece or a pawn landing on g3 or h3. The counts are close, which is why this position has been argued about since 1953.",
                "next": [
                    "13.Rc1 Ng6! is the move order to know — the knight comes back before the pawns move, because ...h5 and ...g4 both need it and because from g6 it covers e5, f4 and h4. The deep dive takes it from there.",
                    "When c4–c5 comes you have two answers and they are different games. ...Nxc5 while the knight is still on d7 keeps the material honest and the engine happy, and throws away the pawn chain the attack is built on. Letting it through and recapturing on d6 keeps the race — at a measurable cost. Pick one on purpose; what you must not do is spend a move preventing c5, because White was going to get it anyway.",
                    "...h5 and ...g4 next. If White answers fxg4, recapture ...hxg4 and the h-file is half open with your rook one move from h8; if White leaves the pawns alone, ...g3 comes and the pawn on h2 is the hook the whole attack hangs on.",
                ],
                "endgame": "Know this before you start: every King's Indian endgame is worse for you. Right now the c7-pawn still defends d6 — but the moment White plays c4–c5 and you recapture with the c-pawn, d6 is defended by no pawn at all, it can never advance past White's d5, c7 becomes a hole no black pawn can ever cover again, and the c-file belongs to White. Trade the queens off into that and you defend for fifty moves. The attack is not a bonus on top of a good position — it is the entire compensation.",
            },
            "notes": {
                3: "The c-pawn takes queenside space and, more to the point, fights for d5. Against 1...d5 this would be the Queen's Gambit; against the Indian move order it is just the biggest centre White can claim before you have committed to anything.",
                5: "Development, guarding e4 before the pawn gets there and taking d5 away from you.",
                9: "White's last minor piece before castling. From f3 the knight guards d4 and hits e5, which is why ...e5 has to be timed rather than played on sight.",
                10: "King safety, and the last move of a setup you can play against almost anything: ...Nf6, ...g6, ...Bg7, ...d6, ...O-O. Five moves, one system, and it works against 1.d4, 1.c4 and 1.Nf3 alike.",
                11: "The Classical. Modest and flexible — and from e2 the bishop covers g4 and h5, so both ...Bg4 and ...Nh5 come with a question attached. Nine moves from now that detail costs a pawn if you forget it.",
                12: "The break the whole setup was built for. White must now choose between taking, holding the tension and pushing past, and each choice is a different game.",
                13: "White castles and keeps the tension.",
                14: "The second attacker on d4 — the e5-pawn is the first. Look at your bishop while you are here: the g7-bishop's diagonal runs into your own pawn on e5, so it is not hitting d4 at all. It is waiting for the day that pawn moves, and in the model game below it waits twenty-five moves and then decides the game in one.",
                15: "White closes the centre, and this is the decision the whole opening turns on. The pawns are fixed now: White's chain runs e4–d5 and points at the queenside, yours runs d6–e5 and points at the kingside. Each side attacks the base of the other's chain — c4–c5 hits d6, ...f5 hits e4.",
                16: "The knight has no future on c6 with a white pawn on d5, so it steps back. From e7 it goes to g6, covering e5, f4 and h4, and it gets out of the f-pawn's way on the same move.",
                17: "White's plan in one move. The knight leaves f3 so the f-pawn can come there and hold e4 forever, and it heads for d3, where it supports c5 and covers b4, e5 and f4.",
                18: "Your mirror image. The knight steps off f6 so the f-pawn can run, and from d7 it guards e5, watches c5 and comes back to f6 later to join the attack.",
                19: "The knight arrives. Note what it took: two moves to reroute one piece, which is exactly what you are spending on the other wing.",
                20: "The storm's first move, and it hits e4 — the base of White's chain. It also sets a trap of its own: 11.exf5 gxf5 is not the free capture it looks like, because it leaves you pawns abreast on e5 and f5 and the g-file half open toward White's king.",
                21: "White props e4 up with a pawn so it can never be exchanged, and accepts that the f3-square is closed to White's own pieces for good. This is the E99 main line.",
                22: "Past, not through. From f4 the pawn can never be traded, so the centre is dead and every remaining move happens on a wing. Be honest about the cost: with the tension gone White no longer has to watch ...fxe4, and gets a completely free hand on the queenside.",
                23: "The bishop steps off c1 so the a1-rook can reach it. Nobody is defending: White has counted the tempi too, and believes the queenside break lands first.",
                24: "And you go. From here every move you make is aimed at g1 and every move White makes is aimed at c7. This is the position the whole opening exists to reach.",
            },
        },
        {
            "name": "Sämisch Variation",
            "note": "White holds e4 with a pawn, castles queenside and attacks the same king you were planning to attack. The sharpest thing White can do.",
            "moves": "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5 O-O-O Nd7 Kb1 Nc5",
            "tier": "Mastery",
            "drill": True,
            "plan": {
                "tier": "Mastery",
                "point": "Both kings are in the open and both attacks are already moving. Your pawns run at b1, White's run at g8, and the difference from the Classical is that here White is attacking too — so a slow move is not merely slow, it loses.",
                "next": [
                    "...a5–a4–a3 is the main lever, with the knight on c5 supporting it and hitting e4 and b3 at the same time. Against a white king on b1 the a-pawn is worth more than a piece.",
                    "...b5 is the sacrifice this line is famous for, and Kasparov plays it in the model game below. It costs a pawn and it opens the a-file and the b-file at a king that has castled onto them. Do not calculate it to mate — calculate it to two files at the king and take the position.",
                    "Take on e4 only when it helps. ...fxe4 fxe4 opens the f-file for you, but it also frees White's f-file and unblocks the light-squared bishop; leave the tension while your rook is still on f8 doing nothing.",
                ],
                "endgame": "Worse for you again, and for a concrete reason: White answers ...Nc5 with Bxc5 in many lines, and after ...dxc5 your pawns are doubled on the c-file and the pawn on e5 is left with no pawn anywhere that can defend it. Queens on, none of that matters. Queens off, it is what you defend for the rest of the game.",
            },
            "notes": {
                3: "The c-pawn takes queenside space and fights for d5.",
                5: "Development, guarding e4 before the pawn gets there.",
                9: "The Sämisch. A pawn holds e4 instead of a knight, which frees both knights and, more importantly, clears the way for g2–g4 and h2–h4. White intends to castle long and race you.",
                10: "Castle anyway. The Sämisch is a race too — yours starts with ...e5 and ...f5.",
                11: "Development. From e3 the bishop holds d4 and looks at h6, where it would trade off your best piece.",
                12: "The same break, and here it is a genuine choice rather than the obvious move. The engine prefers 6...c5, the Sämisch Gambit, by about a third of a pawn; the deviation panel covers it. ...e5 is what the classical King's Indian player wants, because it is the move that leads to the locked position and the attack.",
                13: "White closes, and now the point of f3 shows: White can throw g4 and h4 forward without loosening anything, because e4 is held by a pawn rather than by a piece that has to stay.",
                14: "To the edge, and it is the best move here. From h5 the knight covers f4 and g3 and clears the f-pawn's path in one move instead of two. This is exactly the move that loses a pawn in the Classical, and it works here for a concrete reason: White's light-squared bishop is still on f1, so there is no Bxh5.",
                15: "Connecting the rooks, preparing to castle long, and backing up a later Bh6.",
                16: "Your break, and it cannot wait. White is castling into your attack and you are attacking into White's.",
                17: "White castles queenside — onto the wing you are about to open. That is the Sämisch bargain.",
                18: "The knight re-routes toward c5, the square this whole line is about.",
                19: "Prophylaxis before the storm: the king steps off the c-file, so ...Rc8 and ...a5–a4 arrive without a tempo attached.",
                20: "The knight arrives. From c5 it hits e4, b3 and d3, it supports ...a5–a4–a3, and it defends nothing — which is the correct attitude in every line of this opening. The engine still prefers White here by half a pawn. Over the board, both kings are in the open and the faster player wins.",
            },
        },
        {
            "name": "Fianchetto Variation",
            "note": "White's best-scoring system, and the one most King's Indian players neglect. Play the storm here and you lose.",
            "moves": "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4 c6 h3 Qb6 Re1 exd4",
            "tier": "Plans",
            "drill": True,
            "plan": {
                "tier": "Plans",
                "point": "This is not a Mar del Plata and pretending otherwise loses the game. The centre is open, the kings are safe, and the fight is over d4, c4 and the light squares — so play for pieces and squares, not for a pawn storm that has nothing to storm.",
                "next": [
                    "11.Nxd4 Re8 and then ...Nc5 or ...Ne5, hitting c4 and e4. The knight on c5 is your best piece in every line of the Fianchetto.",
                    "...a5 next, taking b4 away from White and giving your knight c5 permanently. Space on the queenside is the currency here, not tempi on the kingside.",
                    "Keep the queen on b6 while it is useful — it hits b2 and d4 through an empty c5 — but be ready to drop back once White plays Be3 or Rb1, because a hunted queen costs more than the two squares it watches.",
                ],
                "endgame": "The one King's Indian endgame that is genuinely fine for you. Pawns are three and three on the kingside and three and three on the queenside once the centre resolves, nobody has a majority anywhere, and your dark-squared bishop finally has open diagonals. Trade into it happily — it is the reward for having given up the attack.",
            },
            "notes": {
                3: "The c-pawn takes queenside space and fights for d5.",
                5: "White develops before committing the e-pawn, and that is already a different opening — with no white pawn on e4 there is nothing for a later ...f5 to hit.",
                7: "The Fianchetto Variation. Do not read this bishop as a mirror of yours: they sit on different diagonals and they never meet — yours runs a1–h8, White's runs h1–a8. What Bg2 does is cover d5 and c6 in front of itself, until White's own e4-pawn gets in the way, and f1, f3 and h3 behind itself for as long as the game lasts. Those three squares are the ones a kingside attack has to come through, and they are exactly the ones this bishop never stops watching. That is what kills the storm.",
                8: "King safety.",
                9: "The bishop takes the long light diagonal.",
                10: "...d6 and a King's Indian. With no white pawn on e4 yet, ...d5 is also fully playable here and leads to a completely different, Grünfeld-flavoured game.",
                11: "King safety.",
                12: "To d7, not c6. On c6 the knight would be hit by d4–d5 with tempo; from d7 it backs up ...e5 a second time and leaves c6 free for the pawn. The engine puts 6...c6, 6...c5 and 6...Nc6 all a shade ahead of it — the deviation panel covers all three.",
                13: "White's last minor piece.",
                14: "The break, on schedule.",
                15: "Now White takes the centre — one move later than in the Classical, and with the bishop on g2 rather than e2. That single difference changes your whole plan.",
                16: "The Fianchetto plan in one move. Because White's bishop guards d5, you fight for that square with a pawn instead of storming the kingside. ...c6 also empties c7, which opens the d8–a5 diagonal for the queen.",
                17: "Insurance: h3 takes g4 away from your knight and bishop before either gets there.",
                18: "The queen comes out to hit b2 and, through the empty c5-square, d4. It is main-line theory and the engine dislikes it, by the best part of half a pawn — it wants 9...a5, and its objection is the concrete 10.c5!, which the deviation panel walks through. Play ...Qb6 knowing what it invites.",
                19: "White defends e4 and prepares to resolve the centre. It is not the critical test.",
                20: "You resolve the tension yourself and head for a manoeuvring middlegame. There is no attack here and looking for one is the single most common way King's Indian players lose to the Fianchetto.",
            },
        },
    ],
    "deep": {
        "name": "Deep dive — the Mar del Plata race",
        "note": "The main line played out to move eighteen. Neither side defends. Stop at the end and count the moves each attack still needs.",
        "moves": "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 f3 f4 Bd2 g5 Rc1 Ng6 c5 Nf6 cxd6 cxd6 Nb5 Rf7 Qc2 Ne8 a4 h5",
        "tier": "Plans",
        "drill": True,
        "plan": {
            "structure": 'mar-del-plata-locked-chain',
            "tier": "Mastery",
            "point": "Look at the two positions on the board at once. White has the open c-file, a knight on b5 and a pawn on d6 to attack; you have four pawns and four pieces pointed at g1 and nothing at all defending. Neither side can switch now — this is the position both players chose on move fifteen.",
            "next": [
                "...g4 is the move everything has been for. After fxg4 hxg4 the h-file opens with your rook already on the seventh rank; if White leaves the pawns alone, ...g3 comes and h2 is the hook.",
                "The rook goes f7–g7 or, after ...Bf8, back to f7 to hold d6 — that bishop retreat is Kasparov's device in the model game and it is the one queenside concession worth making, because it defends d6 without spending a kingside piece.",
                "Sacrifices here are structural, not calculated. A knight on g3 or a bishop on h3 buys open lines at the king; if you find yourself counting to mate you are probably about to miss a defence, and if you find yourself counting material you have already lost the thread.",
            ],
            "endgame": "There is no good endgame in this position and there is no point pretending. You have a backward pawn on d6 that no pawn defends and that White's d5-pawn stops from ever advancing, a hole on c7, and White's rook on the only open file. If queens come off with your attack unfinished, resign yourself to a long defence.",
        },
        "notes": {
            25: "The rook takes the file it is about to open. Everything White does from here happens on the c-file or against d6.",
            26: "Back to g6 before the pawns move, and the engine's first choice too. From g6 the knight covers e5, f4 and h4, and it can land on either f4 or h4 the moment a capture opens the square.",
            27: "The break, and it is not optional — the c-file is White's only way in.",
            28: "The knight comes back toward the kingside — and this is the point to be honest about. The engine wants 14...Nxc5, and after 15.Nxc5 dxc5 16.Na4 it rates the position about a third of a pawn better for you than what happens here. It also ends the King's Indian: the d6–e5 chain is gone and so is the attack. ...Nf6 is Kasparov's move and the one this whole line has been built for, and it costs you that third of a pawn. Pay it knowingly — the deviation panel has both.",
            29: "White cashes in.",
            30: "Forced, and now the accounting is fixed. The c-file is completely open and White's rook already owns it; d6 is a pawn that no pawn of yours defends and that can never advance past White's d5; c7 is a hole no black pawn can ever cover again. That is a serious position to be in, and it is exactly the price of the attack.",
            31: "Nb5 hits d6 — where the queen on d8 is the only defender — and eyes c7 and a7 next.",
            32: "The rook lift, and it does two jobs. From f7 it can swing to g7 behind the pawns, and it frees f8 for the bishop, which is how Black defends d6 without moving a single attacker.",
            33: "The queen joins the open file. Now Nc7 hits the rook on a8, and Rc7 is coming behind it.",
            34: "The one concession. From e8 the knight covers c7 and d6, and it can still return to f6 or come to g7 — a defensive move that has not left the attack.",
            35: "a4 props the knight on b5 up with a pawn and prepares a4–a5–a6 against b7. White is not defending either.",
            36: "And you push on. Count it honestly: White needs about three more moves to win something concrete — Rc7, Nxa7 or Nxd6 with the pieces already aimed. You need ...g4, then either ...g3 or a piece arriving on g3 or h3, and then the h-file. The margin is one move in either direction, which is why no general principle settles this position and why grandmasters have argued about it for seventy years. What is settled is the attitude: spend one move defending and you lose the race.",
        },
    },
    # Deviations, keyed by the position they answer. This is a Black repertoire:
    # at almost every prefix below it is WHITE to move, so the entries are White's
    # systems and the `why` says what you do about each. The handful of sets where
    # Black is to move are your own choices, and they are labelled as such.
    # `kid#misch-variation` is the Sämisch: the page slugifies line names to ASCII,
    # so "Sämisch Variation" becomes "s-misch-variation".
    "branches": {

        # ── ply 2 · White's second move, before c4 ──────────────────────────────
        "d4 Nf6": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "The flexible order. White waits to see what you do before committing the c-pawn. It changes nothing for you: 2...g6 3.c4 Bg7 4.Nc3 d6 and you are in the main line by a different road. If White never plays c4 you get a comfortable version of everything.",
             "line": "g6 c4 Bg7 Nc3 d6"},
            {"san": "Bf4", "severity": "playable", "tier": "Foundation",
             "name": "London System",
             "why": "The bishop comes out before e3 shuts it in, and White has no intention of building the big centre you were going to attack. Play ...g6, ...Bg7, ...d6 and ...O-O as normal, then hit the bishop with ...Nh5 or the centre with ...c5 — the King's Indian setup is fine here, the King's Indian plan is not.",
             "line": "g6 e3 Bg7 Nf3 O-O",
             "see": "london"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "name": "Trompowsky Attack",
             "why": "White offers to trade the bishop for your knight and wreck your kingside pawns before you have one. The cleanest answer is 2...Ne4, hitting the bishop straight back: 3.Bf4 d5 and you have a good game with no fianchetto in sight. Do not play 2...g6 first and then allow Bxf6 — doubled f-pawns with the bishop already on g7 is the one structure this opening cannot use.",
             "line": "Ne4 Bf4 d5"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "why": "White stops ...d5 and prepares e4 in one move, and usually never plays c4 at all. Carry on: 2...g6 3.e4 d6 4.Nf3 Bg7 and the position on the board is a Pirc — your setup, built exactly as you drilled it, against a centre one pawn smaller than the one you were expecting.",
             "line": "g6 e4 d6 Nf3 Bg7"},
        ],

        # ── ply 4 · White's third, after 2...g6 ─────────────────────────────────
        "d4 Nf6 c4 g6": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "The Fianchetto move order. White develops and keeps g3 in hand, which is the system that scores best against you — step through the Fianchetto line before you meet it.",
             "line": "Bg7 Nc3 d6 e4 O-O",
             "see": "kid#fianchetto"},
            {"san": "g3", "severity": "playable", "tier": "Plans",
             "why": "The same idea one move earlier. Answer it the same way: ...Bg7, ...d6, ...O-O and then ...c6 and ...a5 rather than a pawn storm.",
             "line": "Bg7 Bg2 d6 Nc3 O-O"},
            {"san": "f3", "severity": "playable", "tier": "Mastery",
             "why": "The Anti-Grünfeld, and against ...g6 it usually becomes a Sämisch a move early. If you were never going to play ...d5 it costs you nothing — 3...c5 or 3...Bg7 and 4...d6 both transpose to lines you know.",
             "line": "c5 d5 d6 e4 Bg7"},
        ],

        # ── ply 5 · your own third move ─────────────────────────────────────────
        "d4 Nf6 c4 g6 Nc3": [
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "name": "Grünfeld Defence",
             "why": "The other great hypermodern defence, and it is the engine's own first choice from this position, ahead of 3...Bg7. Same philosophy — let White have the centre — but you strike at it immediately with a pawn instead of besieging it for thirty moves: 4.cxd5 Nxd5 5.e4 Nxc3 6.bxc3 and you play against c3 and d4 forever. A completely different game and a legitimate alternative; it is not in this course.",
             "line": "cxd5 Nxd5 e4 Nxc3 bxc3"},
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "why": "Straight into Benoni structures: 4.d5 e6 and the pawns end up on c5/d6/e6 rather than c7/d6/e5. It shares your first two moves and nothing else — the attack comes down the half-open e-file and the long diagonal instead of down the g-file.",
             "line": "d5 e6 e4 d6 h3"},
            {"san": "d6", "severity": "playable", "tier": "Foundation",
             "why": "The same moves in another order, and a useful one if you want to keep ...e5 available before committing the bishop. 4.e4 Bg7 5.Be2 e5 6.d5 and you are back in the Classical.",
             "line": "e4 Bg7 Be2 e5 d5"},
        ],

        # ── ply 6 · White's fourth ──────────────────────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "White keeps both g3 and e4 open. You answer ...d6 and ...O-O and let White choose which opening this is; if g3 comes you are in the Fianchetto and your plan changes.",
             "line": "d6 g3 O-O Bg2 Nbd7",
             "see": "kid#fianchetto"},
            {"san": "g3", "severity": "playable", "tier": "Plans",
             "why": "The Fianchetto without Nf3 first. Same treatment: ...d6, ...O-O, ...Nbd7, ...e5 and then ...c6, not ...f5.",
             "line": "d6 Bg2 O-O Nf3 Nbd7"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The bishop pins nothing yet — your queen is behind a pawn on d7 — and it is looking to trade itself for the f6-knight. 4...h6 asks the question immediately: 5.Bd2 and White has spent two moves to end up on a worse square than the one the bishop started on.",
             "line": "h6 Bd2 d6 e4 O-O"},
            {"san": "f3", "severity": "playable", "tier": "Mastery",
             "why": "A Sämisch move order that also stops ...d5. Play ...d6 and ...O-O and you have transposed into the Sämisch line you have drilled; the only thing you have given up is the Grünfeld you were not playing anyway.",
             "line": "d5 e4 dxe4 fxe4 c5"},
        ],

        # ── ply 7 · your own fourth, and the one move that loses on the spot ────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4": [
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "Castling first is fine and very common — you will play ...d6 next move anyway. The one thing it allows is 5.e5, which is why most move-order purists play ...d6 first.",
             "line": "Be2 d6 Be3 a5 Nf3"},
            {"san": "e5", "severity": "blunder", "tier": "Foundation",
             "why": "The break, one move too early, and it does not work for a concrete reason: you have no pawn on d6, so after 5.dxe5! there is no recapture. The pawn on e5 hits your knight and the best it can do is crawl home — 5...Ng8, and the engine calls that nearly three pawns. Every other knight move drops material to 6.e6 or 6.Bg5. Play ...d6 first, always: it is what makes ...e5 a break rather than a gift.",
             "line": "dxe5 Ng8 Nf3 h6 Bf4"},
        ],

        # ══ THE CROSSROADS · White's fifth decides which King's Indian you get ══
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "name": "Classical Variation",
             "why": "The main line and much the most common. White develops naturally and lets you choose the moment for ...e5. This is the line the whole course is built on.",
             "line": "O-O Be2 e5 O-O Nc6",
             "see": "kid#classical"},
            {"san": "f3", "severity": "playable", "tier": "Mastery",
             "name": "Sämisch Variation",
             "why": "e4 gets a pawn to hold it, both knights are freed and g4 and h4 are coming. White will usually castle queenside and race you. Nothing here is refutable — it is a fully sound system and the sharpest one White has. Answer it with ...O-O, ...e5 and ...f5 and know that you are in a mutual attack rather than a one-way one.",
             "line": "O-O Be3 e5",
             "see": "kid#misch-variation"},
            {"san": "f4", "severity": "playable", "tier": "Mastery",
             "name": "Four Pawns Attack",
             "why": "Four pawns on the fourth rank, and it looks terrifying until you notice how many of them have to be defended. Do not play ...e5 into it — hit the other side of the chain with 5...c5!, which the engine likes best: 6.d5 O-O 7.Nf3 e6 and White's centre has to start making concessions before it has finished being built.",
             "line": "c5 d5 O-O Nf3 e6"},
            {"san": "Be2", "severity": "playable", "tier": "Structure",
             "name": "Averbakh Variation",
             "why": "Usually the prelude to 6.Bg5, the Averbakh, whose whole point is that the automatic 6...e5? costs half a pawn to 7.dxe5 dxe5 8.Qxd8 Rxd8 9.Nd5!. Play 6...c5 first — the engine's own choice — or 6...h6 to ask the bishop where it is going. Everything else transposes back to the Classical.",
             "line": "O-O Bg5 c5 d5 h6"},
            {"san": "g3", "severity": "playable", "tier": "Plans",
             "why": "The Fianchetto reached with the pawn already on e4, which suits you rather better than the pure version: White has committed to the big centre and given you a target for ...c5 or ...e5. Treat it as a Fianchetto anyway — no storm.",
             "line": "O-O Bg2 c5 Nf3 cxd4"},
            {"san": "h3", "severity": "playable", "tier": "Structure",
             "name": "Makogonov Variation",
             "why": "A quiet, genuinely annoying move: it takes g4 away from both your minor pieces and keeps g2–g4 in reserve. The engine puts it level with 5.Nf3 and, at some depths, ahead of it — which is not what a move like this looks like. Carry on with ...O-O and ...e5, and expect White to answer 7.d5 and play on the kingside.",
             "line": "O-O Nf3 e5 d5 Nh5"},
            {"san": "Nge2", "severity": "playable", "tier": "Mastery",
             "name": "Kramer Variation",
             "why": "The knight goes to e2 so f3 stays available — a Sämisch that has not committed yet. Nothing is wrong with it and nothing is testing about it either: play ...O-O and ...c5 or ...e5 and see which system White chooses.",
             "line": "O-O h3 a6 Ng3 c5"},
        ],

        # ── ply 10 · White's sixth in the Classical ─────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O": [
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The Averbakh idea with the knight already on f3. Same answer: ask the question with 6...h6, and after 7.Bd2 White has spent two tempi to reach a worse square than c1. Then ...e5 arrives with no dxe5 trick attached.",
             "line": "h6 Bd2 e5 d5 Na6"},
            {"san": "h3", "severity": "playable", "tier": "Structure",
             "name": "Makogonov Variation",
             "why": "The same quiet move a ply later, and the engine likes it as much as 6.Be2. It takes g4 from your pieces and prepares g2–g4 later. Play ...e5 anyway; after 7.d5 Nh5 the knight is safe here, because White's bishop is still on f1 and cannot take on h5.",
             "line": "e5 d5 Nh5 g3 Na6"},
            {"san": "Be3", "severity": "playable", "tier": "Plans",
             "why": "The bishop takes the square before the knight can be kicked to it. It also walks into 6...Ng4, hitting the bishop and asking White to decide something on move seven: 7.Bg5 h6 8.Bh4 g5 9.Bg3 and White's bishop has made four moves.",
             "line": "Ng4 Bg5 h6 Bh4 g5"},
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "More active than e2 and it gives up something specific: the bishop no longer covers h5 or g4, so ...Nh5 and ...Bg4 become free. Play ...e5 and note that after 7.d5 the ...a5 and ...Na6–c5 plan hits the bishop as well as the pawn.",
             "line": "e5 d5 a5 Bc2 Na6"},
            {"san": "g3", "severity": "playable", "tier": "Plans",
             "why": "A Fianchetto with the centre already committed to e4, and the engine calls it dead level — this is the only sixth move here that does not leave White with a measurable pull. Because White has spent the move on g3 rather than on development, ...c5 works well: 6...c5 7.d5 e6 and you are in a Benoni where White's bishop is on g2 doing very little.",
             "line": "c5 d5 e6 Be2 exd5"},
        ],

        # ── ply 12 · White's seventh, after 6...e5 ──────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5": [
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "name": "Petrosian Variation",
             "why": "White closes the centre a move before you have committed the b8-knight, which is the whole idea — there is no ...Nc6–e7 to play, so your knight has to find another route. 7...a5! is the engine's answer and the practical one: it takes b4 away, prepares ...Na6–c5, and only then do you look at ...f5.",
             "line": "a5 Bg5 h6 Be3 Ng4"},
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "name": "Exchange Variation",
             "why": "The line people play to make you draw. 7...dxe5 8.Qxd8 Rxd8 and the queens are off on move eight — and the engine calls the resulting position exactly level, which is worth knowing before you spend an hour trying to avoid it. There is no attack here and there is no danger either. Play ...Na6–c5 or ...Nbd7, put a rook on d8 and outplay White in an equal ending.",
             "line": "dxe5 Qxd8 Rxd8 h3 Na6"},
            {"san": "Be3", "severity": "playable", "tier": "Plans",
             "name": "Gligorić System",
             "why": "The most flexible of White's seventh moves: the bishop supports d4 and White has not yet said whether the centre will be closed, exchanged or held. 7...exd4 8.Nxd4 Re8 is the reliable answer and it costs White most of the opening edge — you have traded off the tension rather than the pieces, and the g7-bishop finally has the long diagonal.",
             "line": "exd4 Nxd4 Re8 Qc2 c6"},
        ],

        # ── ply 13 · your own seventh, and it is a real repertoire choice ───────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O": [
            {"san": "Na6", "severity": "playable", "tier": "Plans",
             "why": "The modern main line and a fully respectable alternative to 7...Nc6, which the engine rates within a fraction of a pawn of it. The knight is heading for c5, where it hits e4 and never gets hit by d4–d5. You give up the Mar del Plata for a slower, safer game — a lot of strong players have made exactly that trade.",
             "line": "Be3 Qe7 d5 Ng4 Bg5"},
            {"san": "Nbd7", "severity": "playable", "tier": "Structure",
             "why": "The Old Main Line. The knight supports e5 a second time and keeps c6 free for the pawn, so ...c6 and ...Qb6 or ...a5 follow. Solid, and it costs about a sixth of a pawn against best play — the price of not fighting for d4.",
             "line": "Be3 Qe7 Qc2 exd4 Nxd4"},
            {"san": "exd4", "severity": "playable", "tier": "Structure",
             "why": "Releasing the tension at once. 8.Nxd4 Nc6 and you have an open game where your bishop on g7 finally sees d4 — nothing wrong with it, and nothing King's Indian about it either. The engine is close to indifferent between this and 7...Nc6.",
             "line": "Nxd4 Nc6 Be3 Re8 f3"},
        ],

        # ── ply 15 · White's eighth, after 7...Nc6 ──────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6": [
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "why": "The exchange again, and now with your knight on c6 it is a shade better for you than in the 7.dxe5 version: 8...dxe5 9.Qxd8 Nxd8 and the knight comes to e6 to hold e5 and eye d4 and f4. The engine has White at about a tenth of a pawn, which is another way of saying nothing.",
             "line": "dxe5 Qxd8 Nxd8 Be3 Bg4"},
            {"san": "Be3", "severity": "playable", "tier": "Plans",
             "why": "Holding the tension one more move. 8...Ng4! is the point — the bishop has to move again, and after 9.Bg5 f6 10.Bc1 White's bishop has been to e3 and g5 and come home.",
             "line": "Ng4 Bg5 f6 Bc1 exd4"},
            {"san": "Re1", "severity": "inaccuracy", "tier": "Structure",
             "why": "Natural, and it loses a pawn. 8...exd4! 9.Nxd4 Nxe4! and the pawn is simply gone — 10.Nxe4 Nxd4 wins the knight straight back and leaves you one pawn up. The rook on e1 never gets to punish anything, because when the dust settles the only thing left on the e-file is the rook itself. White has some play with 11.Bg5, and a pawn is still a pawn.",
             "line": "exd4 Nxd4 Nxe4 Nxe4 Nxd4"},
        ],

        # ── ply 17 · White's ninth · the Mar del Plata crossroads ───────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7": [
            {"san": "b4", "severity": "playable", "tier": "Mastery",
             "name": "Bayonet Attack",
             "why": "White's most testing modern try, popularised by Kramnik against Kasparov: b4 prepares c4–c5 a move sooner and leaves the knight on f3, so Ng5 and Ne6 stay available once you play ...f5. Two answers are respectable — 9...a5, which the engine prefers and which forces White to resolve the queenside immediately, and 9...Nh5, which just gets on with the attack. Both are playable; pick one and learn it, because this is the line you will meet from prepared opponents.",
             "line": "a5 bxa5 Rxa5 a4 Ne8"},
            {"san": "Nd2", "severity": "playable", "tier": "Plans",
             "why": "The other way to unblock the f-pawn. From d2 the knight supports c4 and b3 rather than c5, and it does not cover f4 — which is one small thing fewer for your ...f5–f4 to worry about. Answer 9...a5 and carry on.",
             "line": "a5 Rb1 b6 a3 Nd7"},
            {"san": "Bd2", "severity": "playable", "tier": "Structure",
             "why": "White plays the bishop move first and keeps the knight on f3 a while longer. It transposes to the main line more often than not — 9...a5 10.Ne1 Ne8 11.a3 f5 and you are in the same race with a3 and ...a5 thrown in.",
             "line": "a5 Ne1 Ne8 a3 f5"},
            {"san": "Nh4", "severity": "playable", "tier": "Mastery",
             "why": "The knight heads for f5 rather than d3. It costs White about half a pawn by the engine's count, and it costs you the comfort of a knight sitting on your best square: answer 9...Ne8, and if 10.g3 then 10...Bh3! trades off the bishop that was defending White's light squares before the storm starts.",
             "line": "Ne8 g3 Bh3 Re1 f5"},
        ],

        # ── ply 18 · your own ninth · the move that costs a pawn ────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1": [
            {"san": "Ne8", "severity": "playable", "tier": "Plans",
             "why": "The other route, and the engine rates it and ...Nd7 within a few hundredths of each other. The knight sits behind the f-pawn instead of beside it, which keeps d7 free for the bishop and means ...f5–f4 comes without ...Nf6 having to move twice. A matter of taste and of what you want on d7.",
             "line": "f3 f5 Nd3 f4 b4"},
            {"san": "Nh5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The Sämisch move played in the wrong opening, and it drops a clean pawn: 10.Bxh5! gxh5 11.Qxh5 and White has a pawn and your king has no cover. The bishop has been covering h5 from e2 since move six — this is the whole reason 6.Be2 is played there rather than on d3 or g2. In the Sämisch, where White's bishop is still on f1, the identical move is the main line.",
             "line": "Bxh5 gxh5 Qxh5 f5 Bg5"},
            {"san": "a5", "severity": "playable", "tier": "Structure",
             "why": "Taking b4 away before starting on the kingside. It is a useful move and it is a move — in a race that matters. Perfectly sound: 10.Be3 Ne8 11.f3 f5 and you are back in the main plan a tempo down on the pawns and a tempo up on the queenside.",
             "line": "Be3 Ne8 f3 f5 Nd3"},
        ],

        # ── ply 19 · White's tenth ──────────────────────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7": [
            {"san": "f3", "severity": "playable", "tier": "Plans",
             "why": "The E99 move order: White holds e4 first and brings the knight to d3 afterwards. It reaches the same positions and it is the version the engine likes best. Nothing changes for you — ...f5 and ...f4 regardless.",
             "line": "f5 Nd3 f4 b4 g5"},
            {"san": "Be3", "severity": "playable", "tier": "Plans",
             "why": "Piket's move against Kasparov: the bishop takes e3 rather than d2, so it can drop back to f2 when your f-pawn arrives and it never blocks the a1-rook's path to c1. Same race, one square different — the model game shows exactly how it runs.",
             "line": "f5 f3 f4 Bf2 g5",
             "see": "kid#piket"},
            {"san": "g4", "severity": "playable", "tier": "Mastery",
             "why": "White stops ...f5 by standing in front of it, and pays about half a pawn for the privilege — the g-file is now a permanent feature in front of White's own king and the h-pawn has been left behind. Play 10...f5 anyway: 11.f3 Kh8 and then ...Ng8 and ...h5, hitting the pawn White has just committed.",
             "line": "f5 f3 Kh8 h4 Nf6"},
        ],

        # ── ply 21 · White's eleventh, after 10...f5 ────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5": [
            {"san": "Bd2", "severity": "playable", "tier": "Structure",
             "why": "White clears the back rank without committing the f-pawn, and it costs about a third of a pawn because it leaves e4 loose. 11...fxe4! is the answer while it is available: 12.Nxe4 Nf5 and your knight reaches its best square with the centre already half opened.",
             "line": "fxe4 Nxe4 Nf5 f3 a5"},
            {"san": "exf5", "severity": "playable", "tier": "Structure",
             "why": "The capture people expect to be strong, and the engine has it costing White about four tenths of a pawn. 11...gxf5! and look at what you own: pawns on e5 and f5 abreast, the g-file half open toward g1, and a knight coming to g6 and then f4 or h4. White's follow-up 12.f4 is the only consistent try and it opens more lines toward White's own king than yours.",
             "line": "gxf5 f4 Ng6 Be3 Nf6"},
            {"san": "f4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Trying to blow the centre open before your attack is set, and it hands the whole edge back: 11...exf4! 12.Nxf4 Ne5 and the knight lands on the square White's own pawn was covering, with c4 and d3 both under fire. The engine calls the position dead level, which after eleven moves of a King's Indian is a good day for you.",
             "line": "exf4 Nxf4 Ne5 h3 a6"},
        ],

        # ── ply 23 · White's twelfth, after 11...f4 ─────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 f3 f4": [
            {"san": "b4", "severity": "playable", "tier": "Plans",
             "why": "Straight to the point — b4 and c5 without spending a move on the bishop, and it is the engine's own first choice here. Nothing changes: 12...g5 13.a4 h5 and both attacks are moving.",
             "line": "g5 a4 h5 c5 Nf6"},
            {"san": "c5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The break, too early, and it drops a pawn: 12...Nxc5! 13.Nxc5 dxc5 and you are a pawn up with the knight on d7 having done its last job. Be exact about what that is worth — the engine calls the position level rather than winning, because the pawn you now own on c5 is the weakness. What has gone is White's entire queenside plan. This is the rule the whole queenside operation runs on — c4–c5 is only playable once the d7-knight has left or once b4 supports it. Check that square every time White reaches for the c-pawn.",
             "line": "Nxc5 Nxc5 dxc5 b3 b6"},
            {"san": "g4", "severity": "inaccuracy", "tier": "Mastery",
             "why": "Trying to stop the storm by standing in front of it. It costs White over a pawn: the g-file and the h1–a8 diagonal both open in front of White's king, and 12...Bf6! keeps everything and prepares ...h5. En passant with 12...fxg3 is available and is not the move — taking releases the tension you spent two moves creating.",
             "line": "Bf6 h3 h5 Bd2 Kg7"},
        ],

        # ── ply 25 · White's thirteenth, where the deep dive begins ─────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 f3 f4 Bd2 g5": [
            {"san": "b4", "severity": "playable", "tier": "Plans",
             "why": "The most direct and, by the engine's count, White's best. It is the same race with one fewer preparatory move on each side: 13...h5 14.c5 Kh8 and neither king is being defended.",
             "line": "h5 c5 Kh8 a4 Ng6"},
            {"san": "a4", "severity": "playable", "tier": "Structure",
             "why": "a4 and a5 before c5, taking b6 away from your pieces and giving the b5-square to a knight for good. It is a tempo slower than b4, and the engine puts the two within a whisker of each other. Answer 13...Kh8 and carry on with ...Ng6 and ...h5.",
             "line": "Kh8 a5 h5 b4 Nf6"},
            {"san": "c5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Still one move too early: 13...Nxc5! 14.Nxc5 dxc5 and the pawn is yours. The engine has Black better after it, which after thirteen moves of a King's Indian is a rout. The rule has not changed — while a knight sits on d7, c5 is a pawn on offer.",
             "line": "Nxc5 Nxc5 dxc5 Rc1 c6"},
            {"san": "Nb5", "severity": "playable", "tier": "Structure",
             "why": "Jumping at d6 before the c-file is open, and it achieves nothing: 13...a6 and the knight has to go back to c3 having given you a free move on the queenside for once. The engine has Black slightly better after it.",
             "line": "a6 Nc3 Ng6 b4 Nf6"},
        ],

        # ── ply 27 · your own fourteenth · attack or material ───────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 f3 f4 Bd2 g5 Rc1 Ng6 c5": [
            {"san": "Nxc5", "severity": "playable", "tier": "Plans",
             "why": "The engine's move, and it is genuinely good: 15.Nxc5 dxc5 16.Na4 b6 and the position is close to balanced — which is more than the main line can say. What it is not is a King's Indian. The d6–e5 chain is gone, so there is no base for White to attack and no reason for you to storm anything; you are playing an ordinary position with a pawn on c5 to look after. Take it when you want a game, decline it when you want the attack.",
             "line": "Nxc5 dxc5 Na4 b6 b4"},
            {"san": "dxc5", "severity": "inaccuracy", "tier": "Structure",
             "why": "The wrong capture. 15.b4! and the pawn on c5 is attacked twice — by b4 and by the knight on d3 — and defended once, so 15...c4 has to be played and White's knight drops into c5 for free. You have also emptied d6, and although the c7-pawn still covers it, that pawn is now the only thing holding the square the entire queenside plan was aimed at. If you are taking, take with the knight.",
             "line": "b4 c4 Nc5 Nf6 Be1"},
        ],

        # ══ SÄMISCH ═════════════════════════════════════════════════════════════

        # ── ply 10 · White's sixth ──────────────────────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O": [
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The bishop goes to g5 rather than e3, so it hits f6 instead of holding d4. That makes ...e5 less appealing and ...c5 more: 6...c5 7.d5 a6 8.Qd2 b5 and you are in a Benko-flavoured attack on the other wing.",
             "line": "c5 d5 a6 Qd2 b5"},
            {"san": "Nge2", "severity": "playable", "tier": "Mastery",
             "why": "Developing before the bishop commits. It is the engine's own first choice at this position and it changes nothing about your plan — 6...c5 or 6...e5 and the same game.",
             "line": "c5 Be3 Nc6 d5 Ne5"},
            {"san": "Qd2", "severity": "inaccuracy", "tier": "Structure",
             "why": "The queen takes its Sämisch square before the bishop has reached e3 to be defended by it, and the engine has it costing White most of a pawn. 6...Nc6! and d4 is attacked for the first time with only the queen defending it, so White has to answer 7.Qf2 — a queen that has made two moves to reach a square it never wanted.",
             "line": "Nc6 Qf2 e5 d5 Nd4"},
        ],

        # ── ply 12 · your own sixth in the Sämisch ──────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3": [
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "name": "Sämisch Gambit",
             "why": "The engine's preference over 6...e5 by about a third of a pawn, and a genuine gambit: 7.dxc5 dxc5 8.Qxd8 Rxd8 9.Bxc5 gives White a pawn and gives you every open line and a lead in development against a king still on e1. Most White players decline with 7.Nge2 instead. If you would rather play chess than race, this is the move.",
             "line": "Nge2 Nc6 d5 Ne5 Ng3"},
            {"san": "Nc6", "severity": "playable", "tier": "Mastery",
             "name": "Panno Variation",
             "why": "The main alternative system: ...Nc6, ...a6 and ...Rb8, then ...b5 to blow the queenside open while White is busy on the other side. It costs about an eighth of a pawn against best play and it is a completely different repertoire — a good second string once the ...e5 lines are automatic.",
             "line": "Nge2 a5 d5 Ne5 Nd4"},
        ],

        # ── ply 13 · White's seventh, after 6...e5 ──────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5": [
            {"san": "Nge2", "severity": "playable", "tier": "Structure",
             "why": "Keeping the tension instead of closing. It costs White about a quarter of a pawn and it gives you the option of resolving it yourself: 7...exd4 8.Nxd4 c6 and the g7-bishop is looking at an unblocked diagonal for the first time in the game.",
             "line": "exd4 Nxd4 c6 Nc2 d5"},
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "why": "The Sämisch exchange, and it throws the whole opening edge away — the engine has the position level after 7...dxe5 8.Qxd8 Rxd8 9.Nd5 Nxd5 10.cxd5. Queens off, no attack for either side, and the pawn on f3 is now just a hole where a knight should be.",
             "line": "dxe5 Qxd8 Rxd8 Nd5 Nxd5"},
        ],

        # ── ply 15 · White's eighth, after 7...Nh5 ──────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5": [
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "Developing, and adding a third defender to e4. It also puts the bishop where your knight can hit it: 8...Nf4! attacks d3 with tempo, and after 9.Bf1 the bishop has made two moves to end up on the square it started from.",
             "line": "Nf4 Bf1 f5 Qd2 c6"},
            {"san": "g4", "severity": "playable", "tier": "Mastery",
             "why": "Kicking the knight before it settles. It works here — the knight has to go to f4 and White gains time with h4 and g5 — and it permanently loosens the squares in front of a king that has not castled. Sound, sharp and much less common than 8.Qd2.",
             "line": "Nf4 h4 Bf6 g5 Bg7"},
            {"san": "Nge2", "severity": "playable", "tier": "Plans",
             "why": "The quiet developing move, and by the engine's count it costs nothing at all. Play ...f5 and note that with a knight on e2 White has a Ng3 in reserve, which is one more defender of e4 and one more piece looking at h5.",
             "line": "f5 Qd2 a5 O-O-O Na6"},
        ],

        # ── ply 17 · White's ninth, after 8...f5 ────────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5": [
            {"san": "exf5", "severity": "playable", "tier": "Structure",
             "why": "The engine's own choice, and it is not a concession: 9...gxf5 gives you the pawn duo on e5 and f5 and the half-open g-file, and it gives White the e4-square and a target on f5. A genuinely double-edged trade rather than a win for either side.",
             "line": "gxf5 O-O-O Nd7 Nge2 Nhf6"},
            {"san": "Bd3", "severity": "playable", "tier": "Mastery",
             "why": "Developing with the king still in the centre, and it lets you take the initiative: 9...Qh4+! 10.Bf2 Qf4 and White has to spend the next few moves untangling. The engine has this costing White a fifth of a pawn or so, which for the Sämisch is a lot.",
             "line": "Qh4+ Bf2 Qf4 Nge2 Qxd2+"},
            {"san": "g4", "severity": "blunder", "tier": "Foundation",
             "why": "The instinct is right and the move loses two pawns. 9...fxg4! 10.O-O-O gxf3 and White's centre is in ruins: the pawn on g4 was defended only by f3, so taking it wins the f-pawn too, and after 11.Bh3 Bxh3 12.Nxh3 the engine has Black two pawns up. Count what is defending a pawn before you push the one next to it.",
             "line": "fxg4 O-O-O gxf3 Bh3 Bxh3"},
        ],

        # ── ply 19 · White's tenth, after 9...Nd7 ───────────────────────────────
        "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5 O-O-O Nd7": [
            {"san": "Bd3", "severity": "playable", "tier": "Mastery",
             "why": "Timman's move against Kasparov, and a completely normal alternative to 10.Kb1: White develops and covers the light squares instead of tucking the king away first. Your answer does not change — ...Nc5 hits the bishop as well as e4, and the model game shows what happens next.",
             "line": "fxe4 Nxe4 b5 cxb5 a6",
             "see": "kid#timman"},
            {"san": "exf5", "severity": "playable", "tier": "Structure",
             "why": "The exchange with your knight already on d7. 10...gxf5 and you have the same pawn duo as the 9.exf5 lines, but the knight is a move closer to c5 and the h5-knight can come to f4 immediately.",
             "line": "gxf5 Nge2 Nc5 Ng3 Nf4"},
            {"san": "Nge2", "severity": "playable", "tier": "Plans",
             "why": "Development, and it costs getting on for half a pawn because the knight on e2 gets in the way of White's own attack — after 10...Nb6 11.Ng1 the knight has to go back. Play ...Nb6 or ...Nc5 and start on the queenside.",
             "line": "Nb6 Ng1 fxe4 Nxe4 Bf5"},
        ],

        # ══ FIANCHETTO ══════════════════════════════════════════════════════════

        # ── ply 6 · White's fourth in the Fianchetto move order ─────────────────
        "d4 Nf6 c4 g6 Nf3 Bg7": [
            {"san": "Nc3", "severity": "playable", "tier": "Foundation",
             "why": "Back toward the Classical: 4...d6 5.e4 O-O 6.Be2 e5 and you are in the main line with the moves in a different order. This is the most common fourth move and the least of your problems.",
             "line": "d6 e4 O-O Be2 e5",
             "see": "kid#classical"},
            {"san": "Bf4", "severity": "playable", "tier": "Structure",
             "why": "A London against the King's Indian, and the engine has Black slightly better after it — the bishop attacks no piece from f4 and will be chased by ...Nh5 or by the pawn once ...e5 comes. Strike in the centre instead of on the wing: 4...c5! 5.Nc3 cxd4 6.Nxd4 d6.",
             "line": "c5 Nc3 cxd4 Nxd4 d6"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "name": "Torre Attack",
             "why": "The Torre Attack against the fianchetto, and again the engine prefers Black: 4...Ne4! hits the bishop, and its best square turns out to be 5.Bc1 — two moves spent putting the bishop back where it started. Then ...d6 and ...e5 with a free game.",
             "line": "Ne4 Bc1 d6 e3 e5"},
        ],

        # ── ply 11 · your own sixth in the Fianchetto ───────────────────────────
        "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O": [
            {"san": "Nc6", "severity": "playable", "tier": "Mastery",
             "name": "Panno Variation",
             "why": "The sharpest system against the Fianchetto: after 7.Nc3 a6 8.d5 Na5 the knight goes to the rim on purpose, and ...c5, ...Rb8 and ...b5 follow. White usually answers 7.d5 immediately. It is theory-heavy and it is the line that gives Black the most winning chances here.",
             "line": "d5 Na5 Na3 c5 Re1"},
            {"san": "c6", "severity": "playable", "tier": "Plans",
             "why": "One of three moves the engine puts marginally ahead of 6...Nbd7, and the most direct: ...c6 and ...d5 turns the game into a Grünfeld-ish fight for the centre rather than a King's Indian. If you dislike being half a pawn worse for thirty moves, this is where you stop being it.",
             "line": "Nc3 d5 cxd5 cxd5 Ne5"},
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "why": "The Yugoslav. 7.d5 b5! is a Benko Gambit with the bishops already fianchettoed, and the engine rates it level with the main lines. A completely different game and a real option if you want the initiative rather than the squeeze.",
             "line": "d5 b5 cxb5 a6 bxa6"},
        ],

        # ── ply 15 · White's eighth, after 7...e5 ───────────────────────────────
        "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5": [
            {"san": "h3", "severity": "playable", "tier": "Structure",
             "why": "The same insurance one move early, and the engine calls it level with 8.e4. Answer 8...exd4 9.Nxd4 Re8 and you have got the tension resolved on your terms before White has taken the centre.",
             "line": "exd4 Nxd4 Re8 e4 Nc5"},
            {"san": "Qc2", "severity": "playable", "tier": "Plans",
             "why": "Flexible, and it costs White a third of a pawn or so because it does nothing about the centre. 8...exd4 9.Nxd4 Nb6! hits c4 and prepares ...d5, and the whole point of the Fianchetto — White's grip on d5 — starts to come apart.",
             "line": "exd4 Nxd4 Nb6 Qd3 d5"},
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "why": "Releasing the tension for you. 8...dxe5 and the d-file is open with your knight on d7 ready for c5 or b6 — the engine has White at a quarter of a pawn, half what the main lines give.",
             "line": "dxe5 Qc2 Qe7 e4 c6"},
        ],

        # ── ply 17 · White's ninth, after 8...c6 ────────────────────────────────
        "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4 c6": [
            {"san": "Be3", "severity": "playable", "tier": "Structure",
             "why": "The most testing of the ninth moves by the engine's count. The bishop backs up d4, so resolving the centre yourself is the answer: 9...exd4 10.Nxd4 Nc5 and the knight reaches its square with tempo against e4.",
             "line": "exd4 Nxd4 Nc5 h3 Qe7"},
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "why": "Closing the centre — and here, unlike the Classical, it helps you: the engine has White down to a fifth of a pawn. With the c-file about to open you get ...Nc5 and ...cxd5, and White's Bg2 is staring down its own diagonal at a pawn on d5 that is now White's.",
             "line": "Nc5 Qc2 cxd5 cxd5 a5"},
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "why": "The exchange, and it is close to giving the game away — the engine calls the position level. 9...Nxe5! recaptures with the piece rather than the pawn, and after 10.Nxe5 dxe5 the d-file is yours and White has no target anywhere.",
             "line": "Nxe5 Nxe5 dxe5 Bg5 Be6"},
        ],

        # ── ply 19 · White's tenth, and the critical test of 9...Qb6 ────────────
        "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4 c6 h3 Qb6": [
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "why": "The move the engine wants and the reason many players prefer 9...a5 or 9...Re8 to 9...Qb6. 10.c5! dxc5 11.dxe5 Ne8 12.e6! rips the position open while your queen is on b6 and your pieces are on the back rank. It is not winning and it is genuinely unpleasant: know it exists before you play ...Qb6, and be ready to give the pawn back with ...fxe6 and finish developing.",
             "line": "dxc5 dxe5 Ne8 e6 fxe6"},
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "why": "Closing while your queen is offside, and it costs White half a pawn — with the centre fixed, ...Nc5 arrives and the queen on b6 turns out to be well placed after all. 10...Nc5 11.Re1 Bd7 and you are comfortable.",
             "line": "Nc5 Re1 Bd7 dxc6 Bxc6"},
            {"san": "dxe5", "severity": "playable", "tier": "Structure",
             "why": "Resolving the tension and handing you the d-file. 10...Nxe5 11.b3 Nfd7 and every piece has a square; the engine has White at under half a pawn, which in this variation is a good result for Black.",
             "line": "Nxe5 b3 Nfd7 Qc2 Nxf3+"},
        ],
    },
    "games": [
        {
            "id": "piket-kasparov-1989",
            "name": "Piket – Kasparov, Tilburg 1989 — the Mar del Plata attack, start to finish",
            "tier": "Plans",
            "note": "Round 8, and the most quoted King's Indian attacking game ever played. Kasparov reaches the position from the deep dive by a slightly different route, never defends the queenside once, and finishes with a knight going to h1.",
            "moves": (
                "d4 Nf6 Nf3 g6 c4 Bg7 Nc3 O-O e4 d6 Be2 e5 O-O Nc6 d5 Ne7 "
                "Ne1 Nd7 Be3 f5 f3 f4 Bf2 g5 b4 Nf6 c5 Ng6 cxd6 cxd6 "
                "Rc1 Rf7 a4 Bf8 a5 Bd7 Nb5 g4 Nc7 g3 Nxa8 Nh5 Kh1 gxf2 "
                "Rxf2 Ng3+ Kg1 Qxa8 Bc4 a6 Qd3 Qa7 b5 axb5 Bxb5 Nh1"
            ),
            "notes": {
                5: "A different move order to the same place — after 1.d4 Nf6 2.Nf3 g6 3.c4 Bg7 4.Nc3 O-O 5.e4 d6 the position is exactly the one the main line reaches after its own fifth move. Your setup does not care what order White plays in.",
                17: "9.Ne1, the main line, and Kasparov answers ...Nd7 exactly as the drill does.",
                19: "10.Be3 instead of 10.Nd3. The bishop takes the square first and the knight never comes to d3 in this game — same plan, one piece differently placed, and the deviation panel after 9...Nd7 covers both.",
                24: "The end of the main line with two pieces standing elsewhere: White's bishop is on f2 rather than d2, and the knight is still on e1 rather than d3. Every black piece and pawn is where the drill puts it, and everything from here is what the plan card describes.",
                25: "White starts on the queenside with b4 rather than Rc1. The move count is what matters, not the order.",
                28: "...Ng6, exactly as in the deep dive: the knight comes back before the pawns move.",
                32: "...Rf7 and next move ...Bf8. That pair is Kasparov's answer to the pressure on d6 — the bishop defends the pawn from f8 so that not one attacking piece has to turn round.",
                37: "19.Nb5, hitting d6 and heading for c7. White is two moves from material and gets there.",
                38: "...g4! The pawns go, and Black is not going to look at the queenside again. From here White wins a rook and Kasparov never once stops to take it back.",
                40: "...g3! The pawn is offered to a bishop that must not take it: the point is the f2-square and the g-file, not the pawn.",
                41: "21.Nxa8 takes the rook, and White is a clean five points up — a whole rook for nothing. Kasparov does not take anything back for three moves, and by 24...Qxa8 the material is level again. That is what the queenside operation bought: three tempi.",
                42: "...Nh5, bringing the last piece and clearing the way for it. The knight wants g3, and the square is occupied by Black's own pawn — which is about to solve that by taking on f2.",
                44: "...gxf2, and the pawn that started on g7 is now standing beside the white king, having taken a bishop on the way.",
                45: "23.Rxf2 is forced, and now ...Ng3+ arrives with check because White's king went to h1 the move before.",
                55: "28.Bxb5 was the last try. Everything White has won is on the wrong side of the board.",
                56: "...Nh1! and Piket resigned. Material is exactly level — count it, thirty-one points each. The knight adds a second attacker to the rook on f2, which the queen on a7 has been hitting down the a7–g1 diagonal for four moves and which only the king defends. 29.Kxh1 loses to 29...Qxf2, and every other move loses the rook for nothing.",
            },
        },
        {
            "id": "timman-kasparov-1992",
            "name": "Timman – Kasparov, Linares 1992 — the Sämisch race, won by one move",
            "tier": "Mastery",
            "note": "Round 1, and the Sämisch line you have just drilled, move for move, to move nine. Kasparov plays ...b5 without being asked twice, gives up a rook's worth of material on the queenside, and finishes with the g7-bishop that has not moved since move four.",
            "moves": (
                "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5 O-O-O Nd7 "
                "Bd3 Nc5 Bc2 a6 Nge2 b5 b4 Nd7 cxb5 axb5 Nxb5 Rxa2 Nec3 Ra8 "
                "Kb2 Ndf6 Na7 fxe4 Nc6 Qd7 g4 Nf4 g5 N6xd5 Nxd5 Nd3+ "
                "Bxd3 exd3 Nce7+ Kh8 Nxc8 e4+"
            ),
            "notes": {
                19: "10.Bd3 rather than 10.Kb1 — White develops and eyes the light squares instead of tucking the king away first. The drill line's ...Nc5 answers both.",
                20: "The knight lands on c5 exactly as in the main line, hitting e4, b3 and d3.",
                21: "11.Bc2 keeps the bishop, and now the b3-square is a hole White has to watch.",
                23: "12.Nge2 finally develops the last knight — the Sämisch always pays this tempo somewhere.",
                24: "...b5! The King's Indian sacrifice on the other wing. It is not calculated to a finish; it is calculated to an open a-file and a half-open b-file pointing at a king on c1.",
                25: "13.b4 pushes the knight away and opens lines in front of White's own king. Both players have now committed.",
                29: "15.Nxb5 and White is a pawn up — for one move. ...Rxa2 takes it straight back and, far more to the point, opens the a-file at the white king.",
                33: "17.Kb2 attacks the rook and Black just moves it. Material is dead level here; every one of Black's moves so far has either opened a line or kept a piece pointing at b2.",
                35: "18.Na7 heads for c6 rather than grabbing anything — material is still level. It is the last moment at which White's queenside play looks faster.",
                36: "...fxe4! The file opens toward White's king at last, and note which piece the capture frees — the rook on f8 has been waiting for this since move nine.",
                39: "20.g4 tries to shut the position; ...Nf4 answers it, hitting d3, e2 and g2 at once.",
                41: "21.g5 attacks the knight — and ...N6xd5!! ignores it. Kasparov gives a piece to reopen the centre with White's king still on the b-file.",
                43: "22.Nxd5 Nd3+! The knight lands on a square White's bishop and queen both cover, and that is the point rather than an oversight: 23.Bxd3 exd3 and the pawn on d3 takes c2 away from the king and cuts it off from its own pieces.",
                47: "24.Nce7+ is check, and 24...Kh8 costs nothing — Black is not defending, Black is waiting one move.",
                49: "25.Nxc8 wins another piece. It does not matter: ...e4+ follows.",
                50: "...e4+ and Timman resigned. This is the whole opening in one move. The pawn steps aside and the bishop on g7 — which has not moved since move four and has been staring at its own e5-pawn ever since — gives check down the a1–h8 diagonal to a king on b2. White is a bishop and a pawn up and cannot survive: every block loses the piece back with interest, and the pawn on d3 covers c2.",
            },
        },
    ],
    "progression": {
        "arc": "The King's Indian is a bet: you will be objectively worse for thirty moves and then checkmate someone. Learn to enjoy that.",
        "stages": [
            {
                "tier": "Foundation",
                "when": "Weeks one to two",
                "goal": "Learn the five-move setup and the one break that matters.",
                "learn": [
                    "The setup: ...Nf6, ...g6, ...Bg7, ...d6, ...O-O, then ...e5. Play it against nearly everything White does.",
                    "Why you allow the big centre: those pawns are targets, and the g7-bishop is aimed at the heart of them the moment your own e5-pawn moves.",
                    "The two breaks: ...e5 almost always, ...c5 against the Sämisch and the Fianchetto.",
                ],
                "drill": "Play the five-move setup fifty times. It is the same against 1.d4, 1.c4 and 1.Nf3, which makes it enormously efficient.",
                "mistake": "Playing ...e5 before castling or before a knight route is clear. Timing is everything in this opening.",
                "ready": "You reach the setup automatically against every White system.",
            },
            {
                "tier": "Structure",
                "when": "Months one to two",
                "goal": "Understand the locked centre and what it commands you to do.",
                "learn": [
                    "The Mar del Plata skeleton: White c4-d5-e4, Black c7-d6-e5. Each side attacks the base of the other's chain — that one rule picks the wing for you.",
                    "The knight routes: ...Ne7–g6 in the Classical, ...Nf6–d7 and ...Nh5 elsewhere. Both exist to clear the f-pawn's path.",
                    "Why ...f5 then ...f4 locks the position permanently, and what it costs: White never has to watch ...fxe4 again.",
                ],
                "drill": "Set up the position after ...f4 and play only ...g5, ...h5, ...g4 and ...Rf7–g7. Ten times. Feel the mechanism.",
                "mistake": "Defending the queenside. If you spend moves stopping c5, you lose the race — White's break was going to happen anyway.",
                "ready": "You can explain why Black does not defend in the King's Indian.",
            },
            {
                "tier": "Plans",
                "when": "Months two to eight",
                "goal": "Learn to attack with everything and count the race.",
                "learn": [
                    "The full storm: ...f5, ...f4, ...g5, ...h5, ...g4, then ...g3 or a piece landing on g3 or h3.",
                    "The rook lift ...Rf7–g7 and the ...Bf8 retreat that holds d6 without costing an attacker.",
                    "Counting: White needs roughly as many moves on the queenside as you need on the kingside. Every tempo spent elsewhere is a tempo lost.",
                ],
                "drill": "Play twenty Mar del Plata positions from move fifteen. Sacrifice something in each. Learn what compensation actually looks like.",
                "mistake": "Hesitating. In a King's Indian a slow attacking move is often worse than an unsound sacrifice.",
                "ready": "You have won a game while a piece down.",
            },
            {
                "tier": "Mastery",
                "when": "Ongoing",
                "goal": "Handle the systems designed to stop you.",
                "learn": [
                    "The Fianchetto Variation, where the storm has nothing to storm — switch to ...c6, ...a5 and a knight on c5.",
                    "The Sämisch, where White castles queenside and races you back, and the ...b5 sacrifice that answers it.",
                    "The Bayonet Attack 9.b4, the sharpest modern try, and the 9...a5 and 9...Nh5 answers.",
                ],
                "drill": "Prepare the Fianchetto lines properly. It is the variation that scores best against the King's Indian and the one most players neglect.",
                "mistake": "Playing the Mar del Plata plan in the Fianchetto. The mechanism is not there and the attack will not arrive.",
                "ready": "You know which of White's systems calls for attack and which calls for manoeuvring.",
            },
        ],
        "study": "Bobby Fischer, Garry Kasparov and Teimour Radjabov are the three great King's Indian players. Kasparov's wins from the late 1980s and 1990s are the clearest teaching material available, and two of them are above.",
        "next": "Add the Grünfeld or the Benoni as an alternative when White plays a system you dislike — both share the ...g6 move order.",
    },
}

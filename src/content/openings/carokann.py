OPENING = {
    "id": "carokann",
    "name": "Caro-Kann Defence",
    "eco": "B10–B19",
    "section": "semi-open",
    "orientation": "black",
    "tagline": "The French centre without the French bishop. A sound, patient answer to 1.e4 that club players rarely know how to attack.",
    "level": "Club → Master",
    "theory": {
        "big_idea": "1...c6 prepares ...d5 with a pawn behind it, the job 1...e6 does in the French, with one difference that decides the opening: your light-squared bishop gets out to f5 or g4 before ...e6 closes its diagonal. You reach French-style centres with the French's oldest problem already solved. The price is a tempo, because the c-pawn needs two moves to reach c5, and a little less space. It suits players who want a healthy pawn structure, few weaknesses and endings they understand.",
        "structure": "Three structures cover almost every game in this course. Against the Advance (3.e5) the centre locks: White's pawns on d4 and e5, yours on d5 and e6, and your bishop already outside on f5. The break is ...c5, at the base of White's chain. After the Exchange (3.exd5 cxd5) the c-file is half-open for you and the e-file for White. With Bd3 and c3 it is a Carlsbad with the colours reversed: White has three queenside pawns to your two, so the minority attack with ...b5 and ...b4 is yours. With 4.c4 it becomes the Panov, and White takes an isolated pawn on d4. After the Classical (3.Nc3 dxe4 4.Nxe4) White keeps the d-pawn and you keep the e-pawn: three pawns each on the queenside, three each on the kingside, and no weakness anywhere.",
        "white_plans": [
            "Advance (3.e5): hold the chain with c3 and Nf3, then trade your bishop off with Bd3 or chase it with h4 and g4.",
            "Exchange (3.exd5 cxd5): develop with Bd3, c3 and Nf3 and use e5 for a knight, or play c4 for the Panov and an open, tactical game.",
            "Classical (3.Nc3 dxe4 4.Nxe4): gain time on your bishop with Ng3, h4 and Bd3, then castle long behind the extra space.",
            "Sidelines (2.Nf3 with 3.Nc3, 2.Bc4, 2.d3): keep the centre fluid and hope you play ...e6 before the bishop is out.",
        ],
        "black_plans": [
            "Develop the light-squared bishop first, then play ...e6. That is the one rule of the opening: once the pawn is on e6, the bishop has no road out.",
            "Trade pieces when White has more space. There is no weakness in your structure, so every exchange takes something from White and nothing from you.",
            "Break with ...c5: in the Advance straight away, in the Classical once your pieces are out.",
            "In the Exchange, play on the queenside: ...Rc8, ...b5 and ...b4 against a pawn on c3.",
        ],
        "traps": [
            "In the Advance after 3.e5 Bf5 4.h4, the automatic 4...e6? loses the bishop: 5.g4 Be4 6.f3 and it has no square left. Answer 4...h5, and the position is level. The trap course plays it from both chairs.",
            "After 2.Nf3 d5 3.d3 dxe4 4.Ng5 exd3 5.Bxd3, the natural 5...Nf6? loses to 6.Nxf7!, and 6...Kxf7 7.Bg6+ wins the queen down the d-file. 5...Nd7 is the move. The trap course has the details.",
            "Club players sacrifice on f7 in the Classical: 1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Bf5 5.Ng5 e6 6.N1f3 h6 7.Nxf7? Kxf7 8.Ne5+ Ke8. Nine in ten play it, and it is unsound. Take the knight and walk the king back.",
            "In the Panov after 5...e6 6.Nf3 Bb4 7.cxd5 Nxd5, the natural 8.Bd3? drops the exchange to 8...Nxc3 9.bxc3 Bxc3+ 10.Bd2 Bxa1. The bishop on b4 has been looking at that rook since move six.",
        ],
        "who": "Play it if you want a sound, low-risk answer to 1.e4 that still gives you winning chances in the ending. Karpov made it a world championship weapon, and Anand, Carlsen and Ding have all relied on it. At club level it has one more virtue: almost every attacking try White has needs you to make a mistake first, and this course shows you where those mistakes are.",
    },
    "lines": [
        {
            "name": "Advance, 4.Nf3 and 5.Be2: the quiet system",
            "slug": "advance-quiet",
            "note": "White locks the centre and develops calmly. Your bishop is outside before ...e6, the ...c5 break opens the c-file, and the light-squared bishops come off. The same position comes from 2.Nf3 d5 3.e5 Bf5 4.d4 e6.",
            "moves": "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 c3 Nc6 O-O cxd4 cxd4 Nge7 Nc3 Bg4 Nh4 Bxe2 Nxe2 Ng6",
            "tier": "Foundation",
            "drill": True,
            "record": {"at": 7, "games": 13424, "white": 33, "draw": 49, "black": 18},
            "plan": {
                "tier": "Structure",
                "point": "Material is level, seven pawns each, and the light-squared bishops are gone. The centre is fixed: White's pawns on d4 and e5, yours on d5 and e6, and the c-file is open with no pawn on it. Your knights on c6 and g6 both hit e5, and the only thing defending it is the pawn on d4. The masters' results lean to White, so this is a position to play carefully rather than one that plays itself.",
                "next": [
                    "...Be7 and castle. Your king is the one still in the centre, and the f8-bishop is the last piece at home.",
                    "Then ...f6. With both knights already on e5, the f-pawn break opens the f-file for the rook you have just castled.",
                    "...Qb6 at any moment: from b6 the queen hits d4 and b2 at once.",
                ],
                "endgame": "Your remaining bishop is the good one. Your centre pawns stand on light squares, d5 and e6, and White's on dark ones, d4 and e5, in the way of White's own dark-squared bishop. An ending with one bishop each favours you, so trade knights and keep the bishops.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 gets ready to support ...d5, and unlike 1...e6 it leaves the c8-bishop free to come out.",
                3: "White takes the second centre square, the most common move by far.",
                4: "The point of 1...c6: you challenge e4 with a pawn that another pawn defends.",
                5: "The Advance, the most common answer in club games. White locks the centre and takes space, exactly as in the French.",
                6: "The move the Caro-Kann exists for. The bishop leaves before ...e6 can shut it in, and from f5 it controls the b1–h7 diagonal.",
                7: "The quiet development. White defends d4 and plans Be2, castling and c3.",
                8: "Now ...e6. The bishop is already outside, the pawn backs up d5, and the f8-bishop's diagonal opens.",
                9: "Modest and solid. Nigel Short made this the top-level main line: the bishop prepares castling and keeps out of reach of your pieces.",
                10: "The break at the base of White's chain. This is the tempo the Caro-Kann pays for its bishop: in the French the pawn reaches c5 in one move, here in two.",
                11: "Club players hold d4 with a pawn more than half the time. The masters prefer 6.Be3, and the deviation panel covers it.",
                12: "The knight adds a second attacker on d4, next to the pawn on c5.",
                13: "White castles and leaves the tension alone.",
                14: "Take now. After the exchange the c-file is open, and the pawn that lands on d4 has no pawn beside it.",
                15: "White recaptures with the pawn, as almost everyone does.",
                16: "To e7, because the pawn on e5 covers f6. From e7 the knight can go to g6, or to f5 once the bishop has moved, and both squares hit something.",
                17: "The masters' move. The knight develops and attacks d5, which is defended three times.",
                18: "The bishop leaves f5 before Nh4 can hit it there, and pins the knight on f3 to the bishop on e2. If the knight moves, the bishops come off.",
                19: "White breaks the pin by moving the knight, and lets the bishops come off.",
                20: "Take. White's only light-squared bishop goes, the piece that could have aimed at your king from d3.",
                21: "White recaptures with the knight, which now covers d4 and f4.",
                22: "The knight attacks the one on h4 and puts a second piece on e5. The plan card says what comes next.",
            },
        },
        {
            "name": "Advance, 4.Bd3: take the bishop trade",
            "slug": "advance-bd3",
            "note": "The club favourite against the Advance: White offers to trade the light-squared bishops on move four. Take it, put the pawns on e6 and c5, and your knights take the squares White's bishop used to guard.",
            "moves": "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6 Nf3 c5 c3 Nc6 O-O cxd4 cxd4 Nge7 Nc3 Nf5",
            "tier": "Foundation",
            "drill": True,
            "record": {"at": 7, "games": 265, "white": 31, "draw": 39, "black": 30},
            "plan": {
                "tier": "Structure",
                "point": "Count d4: your knights on c6 and f5 both attack it, and White's knight on f3 and queen on d3 defend it. No pawn can help either side there, because the c-pawns are gone. The light-squared bishops are off, so White has no piece to aim at h7, and your dark-squared bishop is the better one: your centre pawns are on light squares.",
                "next": [
                    "...Be7 and castle. The king is safe on g8 now that White's light-squared bishop is gone.",
                    "...Qb6, a third attacker on d4 that also looks at b2.",
                    "If g2–g4 drives the knight off f5, it goes to h4 and trades itself for the knight on f3, and the pawn on g4 is left loosening White's king.",
                ],
                "endgame": "The same rule as every Advance ending: your centre pawns on d5 and e6 stand on light squares, White's on d4 and e5 on dark ones, and the bishops left are both dark-squared. White's is blocked by its own pawns and yours is not. Steer for a bishop ending.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "White takes the second centre square.",
                4: "You challenge e4 with a pawn that another pawn defends.",
                5: "The Advance. White locks the centre and takes space.",
                6: "The bishop comes out before ...e6 shuts it in.",
                7: "One club player in five plays this here: White offers the bishop trade at once.",
                8: "Take it. Your best minor piece goes, but so does White's, and White has nothing left to aim at h7.",
                9: "The queen recaptures and lands on the diagonal the bishops just left.",
                10: "Now ...e6. There is no bishop left to shut in, so the pawn simply backs up d5 and frees the f8-bishop.",
                11: "Development. The masters prefer 6.Ne2, keeping the f-pawn free, and club players choose Nf3 about half the time.",
                12: "The break at the base of the chain. White's pawns are on d4 and e5, and the pawn on c5 hits the one behind.",
                13: "White holds d4 with a pawn, the most common reply.",
                14: "The knight adds a second attacker on d4.",
                15: "White castles.",
                16: "Resolve the tension. After the exchange the c-file is open, and White's pawn on d4 has no pawn left beside it.",
                17: "White takes back with the pawn and keeps a pawn on d4.",
                18: "To e7, because the pawn on e5 covers f6. The knight is on its way to f5.",
                19: "White develops the last knight. It attacks d5, which is defended three times.",
                20: "The knight lands on f5 and hits d4 with the other one. Only g2–g4 can drive it away, and that weakens White's king.",
            },
        },
        {
            "name": "Exchange, 5.Nc3: pin back and trade",
            "slug": "exchange-nc3",
            "note": "The most common Exchange line in club games, reached by 2.Nf3 d5 3.exd5 cxd5 4.d4 or by 2.d4 d5 3.exd5 cxd5 4.Nf3. White pins your knight with Bb5, you pin White's with ...Bg4, and the trade on f3 leaves d4 with no defender.",
            "moves": "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Nc3 Nc6 Bb5 Bg4 h3 Bxf3 Qxf3 e6 O-O Be7",
            "tier": "Foundation",
            "drill": True,
            "record": {"at": 7, "games": 854, "white": 30, "draw": 41, "black": 29},
            "plan": {
                "tier": "Structure",
                "point": "Material is level: White has the two bishops and a knight, you have two knights and a bishop, and there are seven pawns each. The pawns are the same on both sides except the centre, where White has d4 and you have d5 and e6. Nothing defends d4 at the moment. Your knight on c6 attacks it, and only the pin from b5 stops it taking. Castle, and the pin is over.",
                "next": [
                    "Castle. With the king on g8, the knight on c6 is free, and d4 needs a defender at once.",
                    "...Qb6 adds a second attacker on d4 and looks at b2.",
                    "...Rc8 on the half-open c-file, aimed at the pawn on c2.",
                ],
                "endgame": "White has the bishop pair and you have the better centre: White's d-pawn can only ever be guarded by the c-pawn, and yours on d5 is backed by e6. Trading queens suits you, because the bishops matter less with fewer pieces and d4 becomes a plain target.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "The knight first. This is the second most common answer to 1...c6 in club games.",
                4: "The same reply as against 2.d4: the pawn comes to d5 and challenges e4.",
                5: "White trades at once, as three club players in five do here.",
                6: "Recapture with the pawn. The c-file opens for your rook, and the c8-bishop's diagonal is clear.",
                7: "White takes the centre, and this is now the Exchange Variation, the same position as 2.d4 d5 3.exd5 cxd5 4.Nf3.",
                8: "Development, and a second defender for d5 beside the queen.",
                9: "The knight develops and attacks d5, which is defended twice.",
                10: "The second knight hits d4 and covers e5, the square White's knights would like.",
                11: "The pin. The bishop on b5 holds your knight on c6 against your king.",
                12: "Pin back. Your bishop holds the knight on f3 against the queen, and that knight is one of the two pieces guarding d4.",
                13: "White puts the question at once, as a third of club players do.",
                14: "Take. Bishop for knight, and the queen that recaptures cannot guard d4 from f3.",
                15: "The queen recaptures. Count d4 now: attacked by your knight, defended by nothing. White is relying on the pin.",
                16: "The pawn holds d5 a third time and opens the way for the f8-bishop. Your knight is still pinned, so d4 is safe for now.",
                17: "White castles. Club players also play 9.Bg5 here, and the deviation panel shows it.",
                18: "Develop, and castle next. Once your king leaves e8 the pin is over and the knight on c6 really attacks d4.",
            },
        },
        {
            "name": "Exchange, Bd3 and c3: the minority attack is yours",
            "slug": "exchange-bd3",
            "note": "The quiet Exchange: White builds with Bd3, c3 and castling. It is a Carlsbad with the colours reversed, so the queenside pawn attack belongs to you. Karpov's game against Judit Polgar in the model games shows how it is played.",
            "moves": "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Bd3 Nc6 c3 Bg4 O-O e6 Bg5 Be7 Nbd2 O-O",
            "tier": "Structure",
            "drill": True,
            "record": {"at": 9, "games": 154, "white": 17, "draw": 44, "black": 39},
            "plan": {
                "tier": "Structure",
                "point": "Count the queenside: White has three pawns there, on a2, b2 and c3, and you have two, on a7 and b7. The side with fewer pawns attacks with them, so the plan is ...b5 and ...b4 to break up c3 and leave White with a weak pawn on the c-file. On the other side White has the e-file half-open, the e5-square and a bishop on d3 aimed at h7. Material is level, seven pawns each.",
                "next": [
                    "...Rc8 first, onto the half-open c-file behind the pawn you are going to open it with.",
                    "...a6 and ...b5, then ...b4. When White takes on b4, the c3-pawn has gone and d4 has lost its last pawn defender.",
                    "Watch h7. The bishop on d3 and a queen on c2 point at it, so keep a knight on f6 while the attack is coming.",
                ],
                "endgame": "Endings suit you here. The minority attack leaves White with a weak pawn on the c-file or the d-file, and with fewer pieces White has nothing to attack your king with. Trade into a rook ending with a target and grind it.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "The knight first, the second most common move in club games.",
                4: "The pawn comes to d5, the same reply as against 2.d4.",
                5: "White trades at once.",
                6: "Recapture with the pawn, opening the c-file.",
                7: "White takes the centre. This is the Exchange Variation.",
                8: "Development, and a second defender for d5.",
                9: "The bishop takes the b1–h7 diagonal. White plans c3, castling and a quiet build-up.",
                10: "The knight develops and hits d4. The masters choose this and 5...Bg4 about equally.",
                11: "White props d4 up with a pawn. The structure is now fixed: White's pawns on c3 and d4, yours on d5, and the c-file half-open for you.",
                12: "The bishop comes out before ...e6, and it pins the knight that guards d4.",
                13: "White castles. 7.h3 is the other common move, and the bishop drops back to h5.",
                14: "Now ...e6, with the bishop already outside. The pawn holds d5 and opens the diagonal for the f8-bishop.",
                15: "White pins your knight on f6. Club players play this more than anything else here.",
                16: "Break the pin by putting a piece behind the knight.",
                17: "White develops the last knight and keeps the f3-knight defended.",
                18: "Castle. Every piece but the rooks is out, and the queenside plan can start.",
            },
        },
        {
            "name": "Panov-Botvinnik Attack",
            "slug": "panov",
            "note": "White opens the centre with c4 and takes an isolated queen's pawn to attack with. Every Caro-Kann player has to know this from the Black side, and 2.Nf3 d5 3.exd5 cxd5 4.d4 Nf6 5.c4 reaches it too.",
            "moves": "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4 cxd5 Nxd5 Bd2 Nc6 Bd3 O-O O-O Be7",
            "tier": "Structure",
            "drill": True,
            "record": {"at": 7, "games": 11893, "white": 30, "draw": 46, "black": 24},
            "plan": {
                "structure": "isolani",
                "tier": "Structure",
                "point": "Both c-pawns and White's e-pawn have left the board, so the c-file is completely open. White's spare centre pawn is the isolated one on d4 and yours is on e6; the wings are two against two and three against three. That single pawn is the whole game. It is strong for about fifteen moves, because it gives White the c5- and e5-squares and open lines for every piece, and weak for the rest of the game. Your job is to survive the fifteen.",
                "next": [
                    "...Rc8 or ...Bf6, and before White gets a rook to c1. The c-file is the only fully open file on the board, and both sides want it.",
                    "Keep the knight on d5. It is the reason the pawn on d4 can never advance, and d4–d5 is the one move that would stop the pawn being weak.",
                    "Solve the c8-bishop with ...b6 and ...Bb7. Your spare pawn is on e6, so the bishop takes the long diagonal instead of e6.",
                ],
                "endgame": "This is the half of the game you are playing for. Two against two and three against three means neither side can make a passed pawn, so the only material that can be won is the pawn on d4, and no white pawn can ever defend it. With queens on it is an attacking asset; with queens off it is a target with a knight sitting in front of it. Trade the queens first and everything else afterwards.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "White takes the second centre square.",
                4: "You challenge e4 with a pawn that another pawn defends.",
                5: "The Exchange. White releases the tension, and your c-pawn is about to land on d5.",
                6: "Toward the centre, and it opens the c8–h3 diagonal for the bishop.",
                7: "The Panov-Botvinnik Attack. White hits d5 a second time and accepts an open, tactical game, the sharpest thing there is against the Caro-Kann.",
                8: "Development, and a defender for d5.",
                9: "A second attacker on d5. The count is two against two: the pawn on c4 and the knight on c3 against the knight on f6 and the queen on d8.",
                10: "The third defender. It shuts in your c8-bishop, which gets a job later on the long diagonal.",
                11: "Development.",
                12: "The pin. The knight on c3 is pinned to the king, so it can no longer take on d5.",
                13: "White resolves the centre and takes the isolated pawn on purpose. What is left on d4 will never have a pawn beside it again.",
                14: "Recapture with the knight, which lands on the blockading square in front of the isolated pawn. That is where it wants to be for the rest of the game.",
                15: "Breaking the pin and keeping every piece on the board. The natural 8.Bd3? drops the exchange instead, and the deviation panel shows how.",
                16: "Development, and the first piece aimed at d4. The pawn is attacked by the knight on c6 and defended by the knight on f3, and not by the queen on d1, because White's own bishop on d2 stands between them.",
                17: "The bishop takes the b1–h7 diagonal. This is what an isolated pawn gives White: every piece gets a good square.",
                18: "Castle. White's next few moves will all point at this corner, so the king goes there before they arrive.",
                19: "White castles too.",
                20: "The bishop steps back to a square nothing can hit, and you are fully developed. The c-file is open, the knight on d5 sits in front of White's weakness, and the only awkward piece you own is the bishop on c8.",
            },
        },
        {
            "name": "Classical, 6.Nf3: the knight before the h-pawn",
            "slug": "classical-nf3",
            "note": "The Classical as club players play it most: White chases your bishop with Ng3 and develops normally instead of pushing the h-pawn. You get the bishop to g6, finish with ...Nd7, ...e6 and ...Ngf6, and castle into a position with no weaknesses.",
            "moves": "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 Bd3 e6 O-O Ngf6 Re1 Be7 c4 O-O",
            "tier": "Foundation",
            "drill": True,
            "record": {"at": 11, "games": 2983, "white": 20, "draw": 59, "black": 21},
            "plan": {
                "tier": "Structure",
                "point": "Count the pawns: three each on the queenside and three each on the kingside, with White's d4 against your e6 and c6 in the middle. White has a little more space and you have no weakness at all. The bishops on d3 and g6 face each other, and whoever takes first decides which h-pawn moves: if White takes on g6, you recapture hxg6 and the h-file opens for your rook.",
                "next": [
                    "...Re8 and ...Qc7 or ...Qa5, then ...c5 or ...e5 once every piece is out. The pawn break is the reward for finishing development, not the start of it.",
                    "Let White take on g6 if White wants to. After hxg6 your king has a pawn wall on f7, g7 and g6, and the rook on the h-file is pointing somewhere.",
                    "Keep the knight on f6. It guards h7 and d5, the two squares White's pieces want.",
                ],
                "endgame": "Three against three on both wings and one centre pawn each means a level ending, and the side with the better minor pieces wins it. White's d4-pawn is a little more exposed than your e6-pawn, so trade the pieces that defend it.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "White takes the second centre square.",
                4: "You challenge e4 with a pawn that another pawn defends.",
                5: "The Classical. White defends e4 with a piece. 3.Nd2 does the same job and after 3...dxe4 4.Nxe4 it is the same position.",
                6: "Take, and release the tension. It looks like a concession, and it is what the opening is built on: the bishop comes out next, and it comes out attacking something.",
                7: "The knight recaptures and stands in the centre.",
                8: "The move the Caro-Kann exists for. The bishop develops before ...e6 and attacks the knight on e4.",
                9: "The knight steps off the attack and hits the bishop back from g3.",
                10: "The bishop retreats but stays on the b1–h7 diagonal, out of the way of your coming ...e6.",
                11: "Development. More than half of club players choose this over 6.h4.",
                12: "The knight comes out first. From d7 it supports ...Ngf6 without allowing a trade on f6 that spoils your pawns, and it covers e5.",
                13: "White offers the bishop trade on d3.",
                14: "Don't take on d3. After 7...e6 White has to decide about the bishops, and if White takes on g6, your h-pawn recaptures toward the centre and opens the h-file. Two club players in three take on d3 here, and the engine rates it worse.",
                15: "White castles.",
                16: "The second knight, and now d7 backs it up, so a trade on f6 costs your structure nothing.",
                17: "The rook takes the e-file, ready for a later Nf5 or Ne5.",
                18: "Development, and castling comes next.",
                19: "White takes space and stops ...c5-c4 ideas before they start.",
                20: "Castle. Every minor piece is out and your king is safe behind three pawns. The plan card says what to do with the rooks.",
            },
        },
        {
            "name": "Classical, 6.h4: the bishop on h7",
            "slug": "classical-h4",
            "note": "The historic main line. White chases your bishop with the h-pawn, you answer with ...h6, the bishop settles on h7 and then trades itself on d3. Anand against Carlsen in the 2013 World Championship went this way, and the model game plays it to the end.",
            "moves": "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 e6 Ne5 Bh7 Bd3 Bxd3 Qxd3 Nd7 f4 Bb4+",
            "tier": "Plans",
            "drill": True,
            "record": {"at": 11, "games": 10994, "white": 26, "draw": 53, "black": 21},
            "plan": {
                "tier": "Plans",
                "point": "Count the board before you worry about the space. Material is level and so are the pieces, because both light-squared bishops came off on move nine. The pawns are three a side on each wing, and each side has one centre pawn left: White's on d4, yours on e6. The check asks White a question, and both sensible answers suit you: 12.c3 spends a move and puts the pawn on c3 instead of c4, and 12.Bd2 Bxd2+ trades a pair of bishops.",
                "next": [
                    "After 12.c3, drop back with 12...Be7, then ...Ngf6 and castle. Short is right even when White castles long, because with the light-squared bishops traded there is no Bxh7 and the h-file stays shut while your pawn is on h6.",
                    "...Nxe5 at a moment of your choosing, then ...c5. The knight on e5 is White's best piece, held there by the pawns on d4 and f4. Take it off and White has a big centre with nothing behind it.",
                    "Trade pieces. There is no weakness in your structure, and each exchange takes an attacker away from a White player who has pushed three pawns forward.",
                ],
                "endgame": "Three against three on both wings, and each side's spare centre pawn faces two enemy pawns that could capture it, so nobody makes a passed pawn by force. A queenless position turns on the dark-squared bishops, and four of White's seven pawns are on dark squares, b2, d4, f4 and h4, against three of yours, a7, g7 and h6. That is the whole difference, and it is why you are happy to trade the other pieces.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "White takes the second centre square.",
                4: "You challenge e4 with a pawn that another pawn defends.",
                5: "The Classical. White defends e4 with a piece.",
                6: "Take, and release the tension. The bishop comes out next.",
                7: "The knight recaptures and stands in the centre.",
                8: "The bishop develops before ...e6 and attacks the knight on e4.",
                9: "The knight steps off the attack and hits the bishop back from g3.",
                10: "The bishop retreats but stays on the b1–h7 diagonal.",
                11: "The sharp move, a quarter of club games. The threat is h4–h5, and the point is the square behind the bishop: h7 is taken by your own pawn.",
                12: "So the pawn moves first, and it is close to forced. Without it, 7.h5 hits the bishop while h7 is still occupied, and the bishop has nowhere good to go.",
                13: "Development. 7.h5 first is the other main move and usually reaches the same positions.",
                14: "Only now ...e6, with the bishop already outside. The pawn also covers f5 and backs up d5.",
                15: "The outpost, and it comes with a threat: the knight on e5 attacks the bishop on g6.",
                16: "So the bishop goes to h7, the square ...h6 made for it. It looks odd there and it is completely safe.",
                17: "White offers the trade of the light-squared bishops, the standard deal in this line.",
                18: "Take. The bishop on h7 has nothing to do, and the piece it trades for would otherwise aim at your king for the rest of the game.",
                19: "The queen recaptures and takes over the diagonal the bishop just left.",
                20: "The knight goes to d7, because c6 is occupied. From d7 it attacks the knight on e5, makes room for ...Ngf6 and supports ...c5.",
                21: "White props the knight up with a pawn. It is also a commitment: the f-pawn cannot come back, and the e1–h4 diagonal is open toward White's king.",
                22: "The check first. It is a question rather than a threat, and every answer costs White something.",
            },
        },
        {
            "name": "2.Bc4: the bishop that hits granite",
            "slug": "bc4",
            "note": "Seven club games in a hundred start 2.Bc4. The bishop aims at f7, and 2...d5 shuts that diagonal at once. After the trade on d5 you take the centre, develop with ...Nc6, ...Nf6 and ...Bg4, and the pin wins d4.",
            "moves": "e4 c6 Bc4 d5 exd5 cxd5 Bb3 Nc6 d4 Nf6 Nf3 Bg4 h3 Bxf3 Qxf3 Nxd4",
            "tier": "Foundation",
            "drill": True,
            "plan": {
                "tier": "Foundation",
                "point": "A clean extra pawn. White's d-pawn has gone and nothing came back for it, so you have seven pawns to six, and your knight on d4 is in the middle of the board hitting the queen on f3, the bishop on b3 and c2. White has the bishop pair and is ahead in development, so the next few moves are about getting the king out.",
                "next": [
                    "...e5 or ...e6 and the f8-bishop out, then castle. Your king is the one piece still at home.",
                    "Against 9.Ba4+, block with 9...b5. The knight on d4 covers b5, so the bishop cannot take there for free.",
                    "Trade pieces. A pawn up, every exchange brings the won ending closer.",
                ],
                "endgame": "You have the extra centre pawn, and in an ending it walks. Trade queens when you can.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "The bishop goes straight for f7. One club game in fourteen starts this way.",
                4: "Hit the bishop at once. The pawn shuts the a2–g8 diagonal, and if White does not take it, ...dxc4 wins the bishop.",
                5: "White takes, nineteen times in twenty.",
                6: "Recapture with the pawn. It attacks the bishop again, and the c-file opens for you.",
                7: "The bishop retreats to b3, where your d-pawn blocks it. Two club players in three choose this square.",
                8: "Develop and hit d4 before White has played it. The engine rates this and 4...Nf6 the same.",
                9: "White takes the centre.",
                10: "The second knight, and a defender for d5.",
                11: "White develops and defends d4.",
                12: "The pin. The knight on f3 guards d4, and it cannot move without losing the queen.",
                13: "The most common club move here, and a mistake: it asks the bishop to decide, and the decision wins a pawn.",
                14: "Take. Bishop for knight, and one of the two guards of d4 is gone. The other is the queen, and it has to recapture.",
                15: "Three club players in four recapture with the queen, and d4 is left with no defender.",
                16: "Take the pawn. The knight lands on d4 with an attack on the queen and on the bishop on b3.",
            },
        },
        {
            "name": "Two Knights: the pin on f3",
            "slug": "two-knights",
            "note": "White develops both knights before deciding about the d-pawn. You pin the f3-knight, take it when h3 asks, and meet the advance e4–e5 the way the French does, with ...Nfd7 and ...c5. 2.Nc3 d5 3.Nf3 Bg4 is the same position.",
            "moves": "e4 c6 Nf3 d5 Nc3 Bg4 h3 Bxf3 Qxf3 e6 d4 Nf6 e5 Nfd7 Bd3 c5",
            "tier": "Structure",
            "drill": True,
            "record": {"at": 6, "games": 5370, "white": 30, "draw": 42, "black": 28},
            "plan": {
                "tier": "Structure",
                "point": "A French Advance in which your light-squared bishop has already been traded for a knight. White's pawns are on d4 and e5 and yours on d5 and e6, and the pawn on c5 hits the base of the chain. White has the bishop pair; you have the better pawn structure, because every white pawn in the centre is on a dark square and your remaining bishop is dark-squared.",
                "next": [
                    "...Nc6 and ...Qb6, piling up on d4. White's knight has gone from f3, and nothing defends d4 at the moment.",
                    "If White takes on c5, recapture with the bishop and hit the long diagonal toward g1.",
                    "Castle short only when White's queen and bishop are not both aimed at h7.",
                ],
                "endgame": "Your knights against White's bishops in a closed centre is a fair fight, and the locked pawns favour the knights. Keep the centre closed.",
            },
            "notes": {
                1: "The king's pawn. The Caro-Kann is your answer to it.",
                2: "The Caro-Kann. The pawn on c6 supports ...d5 and leaves the c8-bishop free.",
                3: "The knight first, the second most common move in club games.",
                4: "The pawn comes to d5 anyway. It is the move whatever White does.",
                5: "The Two Knights. White defends e4 with a second knight and keeps the d-pawn at home.",
                6: "The pin. The knight on f3 is the piece that would support d4 and e5, and the bishop is outside before ...e6.",
                7: "White asks the question at once, the most common club move.",
                8: "Take. This is the engine's choice, and it leaves White with a queen on f3 instead of a knight.",
                9: "The queen recaptures. White has the bishop pair and a lead in development.",
                10: "Now ...e6, with the bishop already traded. The pawn holds d5.",
                11: "White takes the centre, the most common move here.",
                12: "Development, and it attacks e4 a second time.",
                13: "The club's choice by far, six times in ten. White gains space and hits the knight.",
                14: "Back to d7, where the knight supports the ...c5 break.",
                15: "White develops, and the bishop aims at h7.",
                16: "The break at the base of the chain, exactly as in the French. The plan card says how to follow it up.",
            },
        },
    ],
    "deep": {
        "name": "Deep dive: the quiet Advance into the middlegame",
        "slug": "advance-quiet-deep",
        "note": "The first chapter carried on the way the masters play it. White retreats the knight and builds on the kingside, you castle and break with ...f6, and the knights come off on f4.",
        "moves": "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 c3 Nc6 O-O cxd4 cxd4 Nge7 Nc3 Bg4 Nh4 Bxe2 Nxe2 Ng6 Nf3 Be7 g3 O-O h4 f6 Nf4 Nxf4 Bxf4 Qe8",
        "tier": "Plans",
        "drill": True,
        "plan": {
            "tier": "Plans",
            "point": "Both pairs of light-squared pieces and a pair of knights have gone. White's pawn on e5 is attacked by your f-pawn and your knight on c6, and defended by the pawn on d4, the knight on f3 and the bishop on f4. The f-file is the line that will open, and your rook is already on it.",
            "next": [
                "...Qh5 or ...Qf7: the queen joins the f-file and looks at the knight on f3.",
                "...fxe5 when it suits you, and the rook on f8 faces the bishop on f4.",
                "...Rc8, then ...Qd7 or ...Qe8-d7, to use the open c-file as well.",
            ],
            "endgame": "The bishops left are both dark-squared, and White's pawns on d4 and e5 stand on dark squares in front of White's. Yours is the freer bishop in any ending.",
        },
        "notes": {
            23: "The knight on h4 was attacked, and it comes back to f3 to defend e5 and d4.",
            24: "Develop the last minor piece and get ready to castle.",
            25: "White makes room for the king and takes f4 and h4 away from your knight.",
            26: "Castle. The king is safe, and the rook arrives on the f-file before the f-pawn moves.",
            27: "White pushes the h-pawn to drive your knight off g6.",
            28: "The break. The pawn hits e5, which now has three attackers waiting behind it: the f-pawn, the knight on c6 and, once the file opens, the rook on f8.",
            29: "White offers a knight trade to take one attacker away.",
            30: "Take it. Your knight was going to be pushed by h4–h5 anyway.",
            31: "The bishop recaptures and holds e5.",
            32: "The queen leaves d8 and heads for the kingside, to h5 or f7. The engine rates ...h6 a little higher, and both keep the balance.",
        },
    },
    # A Black repertoire: most sets answer a WHITE move (what the opponent might play instead, and
    # what to do about it). Sets at a Black-to-move position are the learner's own alternatives.
    "branches": {

        # ── White's second move ────────────────────────────────────────────
        "e4 c6": [
            {"san": "Nc3", "severity": "playable", "tier": "Foundation",
             "name": "Two Knights move order",
             "why": "White defends e4 with a piece first. Play 2...d5 anyway, and after 3.Nf3 the pin 3...Bg4 reaches the Two Knights chapter. Half of club players take on d5 instead, 3.exd5 cxd5, and then 4.d4 Nc6 or 4.Nf3 Nf6 gives you a normal Exchange.",
             "line": "d5 Nf3 Bg4 h3 Bxf3",
             "see": "carokann#two-knights"},
            {"san": "f4", "severity": "playable", "tier": "Structure",
             "why": "A King's Gambit shape without the gambit, and it does nothing about d5, the square this opening is about. Take the centre with 2...d5, and after 3.e5 develop the bishop to f5 exactly as in the Advance, with the difference that White's d-pawn is still at home.",
             "line": "d5 e5 Bf5 Nf3 e6"},
            {"san": "d3", "severity": "playable", "tier": "Structure",
             "name": "Breyer Variation",
             "why": "Unambitious and sound. White plans Nd2, Ngf3, g3 and a King's Indian Attack. 2...d5 and then 3...e5 gives you the centre and a free game with the queens still on.",
             "line": "d5 Nd2 e5 Ngf3 Bd6"},
        ],

        # ── White's third move after 2.d4 d5 ───────────────────────────────
        "e4 c6 d4 d5": [
            {"san": "Nd2", "severity": "playable", "tier": "Foundation",
             "name": "Modern Variation",
             "why": "The same job as 3.Nc3 with the other knight. After 3...dxe4 4.Nxe4 Bf5 it is the same position as the Classical, and nothing you learned changes.",
             "line": "dxe4 Nxe4 Bf5 Ng3 Bg6",
             "see": "carokann#classical-nf3"},
            {"san": "f3", "severity": "playable", "tier": "Structure",
             "name": "Fantasy Variation",
             "why": "A real try, and club players score well with it: White wants to recapture on e4 with the f-pawn and own the centre. Keep the tension with 3...e6. After 4.Nc3 Bb4 the pin hits e4, and 5.a3 Bxc3+ 6.bxc3 dxe4 leaves White with broken queenside pawns. The f-pawn move has also loosened the e1–h4 diagonal toward White's king.",
             "line": "e6 Nc3 Bb4 a3 Bxc3+ bxc3 dxe4"},
        ],

        # ── White's third move after 2.Nf3 d5 ──────────────────────────────
        "e4 c6 Nf3 d5": [
            {"san": "e5", "severity": "playable", "tier": "Foundation",
             "why": "Club players almost always follow it with 4.d4, and then you are in the quiet Advance chapter. That is why the course plays 3...Bf5 rather than the masters' 3...Bg4: one plan to learn instead of two.",
             "line": "Bf5 d4 e6 Be2 c5",
             "see": "carokann#advance-quiet"},
            {"san": "d3", "severity": "playable", "tier": "Structure",
             "why": "Quiet, with a sting. After 3...dxe4 most club players play 4.Ng5, and if you grab a second pawn with 4...exd3 5.Bxd3, the natural 5...Nf6? loses to 6.Nxf7. The calm answer is 4...Nf6: 5.Nxe4 Nbd7 and you have a free game. After 4.dxe4 instead, 4...Qxd1+ 5.Kxd1 trades queens with White's king stuck on d1.",
             "line": "dxe4 Ng5 Nf6 Nxe4 Nbd7"},
        ],

        # ── your third move against the Advance ────────────────────────────
        "e4 c6 d4 d5 e5": [
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "name": "Botvinnik-Carls Defence",
             "why": "Playable, and a third of club players choose it. Black hits d4 at once and lets the c8-bishop wait. The course plays 3...Bf5, because the bishop outside the chain is the reason to play the Caro-Kann at all.",
             "line": "dxc5 e6 Be3 Nd7"},
            {"san": "e6", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The move that throws the opening away. You reach a French Advance with the pawn on c6 doing nothing, the c8-bishop buried behind e6, and a ...c5 break that costs two moves instead of one.",
             "line": "c3 c5 Nf3 Nc6 Bd3"},
        ],

        # ── White's fourth move in the Advance ─────────────────────────────
        "e4 c6 d4 d5 e5 Bf5": [
            {"san": "h4", "severity": "playable", "tier": "Foundation",
             "name": "Tal Variation",
             "why": "The direct assault on the bishop, and it is sound. Everything turns on your reply. 4...h5! stops h4–h5 and the position is level. The automatic 4...e6? loses the bishop to 5.g4 Be4 6.f3, and one club player in five falls for it. Answer a pawn with a pawn.",
             "line": "h5 Bd3 Bxd3 Qxd3 e6"},
            {"san": "f4", "severity": "playable", "tier": "Structure",
             "why": "White props up e5 with a second pawn. It costs a little time and blocks the c1-bishop. 4...e6 and 5...c5, the usual break, and White's pawn on f4 means e3 is a hole.",
             "line": "e6 Nf3 c5 c3 Nc6"},
            {"san": "c3", "severity": "playable", "tier": "Structure",
             "why": "Holding d4 with a pawn before anything else. 4...e6 and 5...c5, and after Nf3 and Be2 you are back in the quiet Advance.",
             "line": "e6 Nf3 c5 Be2 Nc6"},
            {"san": "Nc3", "severity": "playable", "tier": "Plans",
             "name": "Van der Wiel Attack",
             "why": "White develops and prepares g2–g4. Meet it with 4...e6, and if 5.g4 the bishop goes to g6, then ...c5 and ...h5 attack the advanced pawns.",
             "line": "e6 g4 Bg6 Nge2 c5"},
        ],

        # ── White's fifth move after 4.Nf3 e6 ──────────────────────────────
        "e4 c6 d4 d5 e5 Bf5 Nf3 e6": [
            {"san": "Bd3", "severity": "playable", "tier": "Foundation",
             "why": "The most common move here, a third of club games. Take the bishop: 5...Bxd3 6.Qxd3 c5 is the 4.Bd3 chapter by another move order.",
             "line": "Bxd3 Qxd3 c5 c3 Nc6",
             "see": "carokann#advance-bd3"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "why": "Development that blocks the c-pawn, so d4 can only be held by pieces. 5...Nd7, the engine's choice, and if 6.Bd3 take the bishop: 6...Bxd3 and White has to recapture with the queen or the c-pawn.",
             "line": "Nd7 Bd3 Bxd3 Qxd3 Ne7"},
        ],

        # ── White's sixth move in the quiet system ────────────────────────
        "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5": [
            {"san": "Be3", "severity": "playable", "tier": "Structure",
             "name": "Short System",
             "why": "The masters' main line, and club players with Black score badly against it. White holds d4 with a piece and keeps c2–c4 in reserve. Take on d4 and develop with ...Ne7 and ...Nbc6; the knight on d4 is the one piece you can attack.",
             "line": "cxd4 Nxd4 Ne7 c4 Nbc6"},
            {"san": "dxc5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Giving up the centre to hold a pawn it cannot keep. 6...Bxc5 and your bishop takes the a7–g1 diagonal, and the pawn on e5 has lost its pawn support.",
             "line": "Bxc5 O-O Nc6 c3 Nge7"},
        ],

        # ── White's sixth move after the bishop trade ──────────────────────
        "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6": [
            {"san": "Ne2", "severity": "playable", "tier": "Structure",
             "why": "The masters' choice: the knight goes to e2 so the f-pawn can come to f4 and the c-pawn to c3. 6...c5 7.c3 Nc6 and the plan is the same, with d4 the target.",
             "line": "c5 c3 Nc6 O-O Qb6"},
        ],

        # ── White's seventh move after 6...c5 ──────────────────────────────
        "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6 Nf3 c5": [
            {"san": "dxc5", "severity": "playable", "tier": "Structure",
             "why": "White gives up the centre and takes a pawn that cannot be kept. 7...Bxc5 and your bishop is on the a7–g1 diagonal, with e5 now defended only by the knight on f3.",
             "line": "Bxc5 O-O Nc6 Qe2 Nge7"},
        ],

        # ── White's eighth move ────────────────────────────────────────────
        "e4 c6 d4 d5 e5 Bf5 Bd3 Bxd3 Qxd3 e6 Nf3 c5 c3 Nc6": [
            {"san": "Be3", "severity": "playable", "tier": "Plans",
             "why": "The bishop defends d4 and covers c5. Take the tension away with 8...cxd4 9.cxd4 and put a knight on f5 to hit the bishop and d4 together.",
             "line": "cxd4 cxd4 Nge7 O-O Nf5"},
        ],

        # ── White's fourth move after 2.Nf3 d5 3.exd5 cxd5 ─────────────────
        "e4 c6 Nf3 d5 exd5 cxd5": [
            {"san": "Bb5+", "severity": "playable", "tier": "Structure",
             "why": "A check to make you block with the bishop. That is fine: 4...Bd7 5.Bxd7+ Qxd7 and the light-squared bishops are off, which removes White's best attacking piece. Then ...Nc6, ...e6 and ...Nf6.",
             "line": "Bd7 Bxd7+ Qxd7 O-O Nc6"},
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "why": "Development first. 4...Nf6 and if 5.d4 Nc6 you are in the chapter where White plays Nc3.",
             "line": "Nf6 d4 Nc6 Bb5 Bg4"},
        ],

        # ── White's fourth move after 2.d4 d5 3.exd5 cxd5 ──────────────────
        "e4 c6 d4 d5 exd5 cxd5": [
            {"san": "Nc3", "severity": "playable", "tier": "Structure",
             "why": "Development that gives up the c4 break. 4...Nf6 and after 5.Nf3 Nc6 it is the chapter where White plays Nc3.",
             "line": "Nf6 Nf3 Nc6 Bb5 Bg4",
             "see": "carokann#exchange-nc3"},
            {"san": "Bd3", "severity": "playable", "tier": "Foundation",
             "name": "Exchange Variation",
             "why": "The classical Exchange. 4...Nc6 5.c3 Nf6 6.Bf4 Bg4 7.Qb3 Qd7 is the masters' main line, and club players with Black score badly here because they don't know it. Your queen guards b7, the bishops come off with ...Bd6, and the queenside plan of the Bd3 chapter follows.",
             "line": "Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6",
             "see": "carokann#exchange-bd3"},
        ],

        # ── White's fifth move after 4...Nf6 ──────────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6": [
            {"san": "Bb5+", "severity": "playable", "tier": "Structure",
             "why": "One club player in nine checks here. 5...Bd7 6.Bxd7+ Nbxd7 trades off White's light-squared bishop, and your knights go to d7 and f6 behind the d5-pawn.",
             "line": "Bd7 Bxd7+ Nbxd7 O-O e6"},
            {"san": "c4", "severity": "playable", "tier": "Structure",
             "why": "The Panov by another order. 5...e6 6.Nc3 Bb4 is the chapter's position.",
             "line": "e6 Nc3 Bb4 cxd5 Nxd5",
             "see": "carokann#panov"},
        ],

        # ── White's sixth move in the 5.Nc3 chapter ───────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Nc3 Nc6": [
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The second most common move here. Pin back with 6...Bg4, the club's and the masters' choice, and the same trade on f3 is coming.",
             "line": "Bg4 Be2 e6 O-O Be7"},
        ],

        # ── White's seventh move after 6...Bg4 ────────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Nc3 Nc6 Bb5 Bg4": [
            {"san": "O-O", "severity": "playable", "tier": "Structure",
             "why": "Castling instead of asking the bishop. 7...e6 and ...Be7, and the bishop stays on g4 holding the knight that guards d4.",
             "line": "e6 h3 Bxf3 Qxf3 Be7"},
        ],

        # ── your seventh move after 7.h3 ───────────────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Nc3 Nc6 Bb5 Bg4 h3": [
            {"san": "Bh5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Keeping the pin is the natural move, and here it costs more than a pawn. 8.g4 Bg6 9.Ne5 and the knight hits both the bishop on g6 and your pinned knight on c6. Take on f3 first.",
             "line": "g4 Bg6 Ne5 Rc8 h4"},
        ],

        # ── White's ninth move in the 5.Nc3 chapter ────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Nc3 Nc6 Bb5 Bg4 h3 Bxf3 Qxf3 e6": [
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The club's most common move here. 9...Be7 breaks the pin on f6, and after 10.O-O O-O the knight on c6 is free.",
             "line": "Be7 O-O O-O Bxf6 Bxf6"},
        ],

        # ── White's sixth move in the Bd3 chapter ─────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Bd3 Nc6": [
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "The most common club move here, four times in ten. 6...Bg4 7.c3 e6 is the chapter's position.",
             "line": "Bg4 c3 e6 Bg5 Be7"},
        ],

        # ── White's seventh move in the Bd3 chapter ───────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Bd3 Nc6 c3 Bg4": [
            {"san": "h3", "severity": "playable", "tier": "Structure",
             "why": "White asks the bishop at once. Keep the pin with 7...Bh5: from h5 it still holds the knight, and it can drop back to g6 to trade for White's bishop on d3.",
             "line": "Bh5 O-O e6 Bf4 Bd6"},
            {"san": "Qb3", "severity": "inaccuracy", "tier": "Plans",
             "why": "The queen hits b7, which your bishop left, and it costs White about half a pawn. Guard it with 7...Qd7, and the knight on f3 stays pinned.",
             "line": "Qd7 Nbd2 e6 O-O Bd6"},
        ],

        # ── White's eighth move in the Bd3 chapter ────────────────────────
        "e4 c6 Nf3 d5 exd5 cxd5 d4 Nf6 Bd3 Nc6 c3 Bg4 O-O e6": [
            {"san": "h3", "severity": "playable", "tier": "Structure",
             "why": "Karpov's game went this way. 8...Bh5 keeps the pin, and ...Bg6 later trades the bishops on your terms.",
             "line": "Bh5 Bf4 Bd6 Bxd6 Qxd6"},
            {"san": "Re1", "severity": "playable", "tier": "Plans",
             "why": "The rook takes the e-file. 8...Bd6 points the bishop at h2 and gets ready to castle.",
             "line": "Bd6 Nbd2 O-O Nf1 Qc7"},
        ],

        # ── White's fifth move in the Panov ───────────────────────────────
        "e4 c6 d4 d5 exd5 cxd5 c4 Nf6": [
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "White takes first. 5...Nxd5 recaptures with the piece, and after 6.Nc3 Nc6 7.Nf3 Bg4 you hit d4 with everything.",
             "line": "Nxd5 Nc3 Nc6 Nf3 Bg4"},
        ],

        # ── White's sixth move in the Panov ───────────────────────────────
        "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6": [
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The pin on f6. 6...Be7 breaks it and gets ready to castle. If White takes on f6 you have the bishop pair; if White takes on d5 you recapture and the e-file opens toward White's king.",
             "line": "Be7 Nf3 O-O Rc1 Nc6"},
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "White takes at once. 6...exd5 and the isolated pawn is yours instead, with your c8-bishop free again. It is a different structure and a fair one.",
             "line": "exd5 Nf3 Nc6 Bb5 Bd6"},
        ],

        # ── White's seventh move in the Panov ─────────────────────────────
        "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4": [
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "White develops and leaves the tension. Now taking is right: 7...dxc4 8.Bxc4 O-O and it is the same isolated-pawn structure as the chapter, with your bishop still pinning c3.",
             "line": "dxc4 Bxc4 O-O O-O b6"},
            {"san": "Bd2", "severity": "playable", "tier": "Structure",
             "why": "Unpinning first, the club's most common move. 7...O-O, and the trade on c3 is worth more later than now.",
             "line": "O-O a3 Bxc3 Bxc3 Ne4"},
        ],

        # ── White's eighth move in the Panov ──────────────────────────────
        "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4 cxd5 Nxd5": [
            {"san": "Qc2", "severity": "playable", "tier": "Structure",
             "why": "The queen takes the c-file and the b1–h7 diagonal, where the attack lives in every isolated-pawn position. 8...Nc6 and after 9.Bd3 h6 takes g5 away from White's pieces before castling.",
             "line": "Nc6 Bd3 h6 a3 Be7"},
            {"san": "Bd3", "severity": "blunder", "tier": "Foundation",
             "why": "The most natural developing move on the board, and it drops the exchange. 8...Nxc3 9.bxc3 Bxc3+ 10.Bd2 Bxa1 11.Qxa1 and you have a rook for a bishop. The bishop on b4 has been looking down the diagonal at that rook since move six, and only the knight on c3 stood in between.",
             "line": "Nxc3 bxc3 Bxc3+ Bd2 Bxa1"},
        ],

        # ── White's fourth move in the Classical ───────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4": [
            {"san": "f3", "severity": "inaccuracy", "tier": "Plans",
             "why": "A gambit in the Blackmar-Diemer style, and it costs White more than half a pawn. Take it: 4...exf3 5.Nxf3 Nf6 and you are a pawn up, with your bishop still free to come to f5.",
             "line": "exf3 Nxf3 Nf6 h3 Bf5"},
        ],

        # ── White's fifth move in the Classical ───────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5": [
            {"san": "Ng5", "severity": "playable", "tier": "Foundation",
             "why": "One club player in five goes to g5 instead, aiming at f7 and e6. 5...e6 6.N1f3 h6 and then most of them sacrifice: 7.Nxf7? Kxf7 8.Ne5+ Ke8 and the engine has you more than two pawns up. Take the knight and walk the king back.",
             "line": "e6 N1f3 h6 Nxf7 Kxf7 Ne5+ Ke8"},
            {"san": "Bd3", "severity": "inaccuracy", "tier": "Structure",
             "why": "The bishop offers the trade and leaves d4 behind. Take it: 5...Qxd4, and after 6.Nf3 Qd8 you are a pawn up. The bishop on d3 has cut the queen off from d4, and nothing else defended it.",
             "line": "Qxd4 Nf3 Qd8 O-O e6"},
        ],

        # ── White's sixth move in the Classical ───────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6": [
            {"san": "Bc4", "severity": "playable", "tier": "Structure",
             "why": "The bishop takes the a2–g8 diagonal instead of offering itself on d3. 6...e6 blocks that diagonal, and your bishop on g6 keeps its job.",
             "line": "e6 Nf3 Nd7 O-O Ngf6"},
        ],

        # ── White's seventh move in the 6.Nf3 chapter ──────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7": [
            {"san": "h4", "severity": "playable", "tier": "Foundation",
             "why": "The h-pawn a move later. 7...h6 and the bishop has its retreat square; then 8.h5 Bh7 and the same plans as the 6.h4 chapter.",
             "line": "h6 h5 Bh7 Bd3 Bxd3"},
        ],

        # ── your seventh move against 7.Bd3 ────────────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 Bd3": [
            {"san": "Bxd3", "severity": "playable", "tier": "Foundation",
             "why": "Playable, and two club players in three play it. The course plays 7...e6, because after the trade White's queen lands on d3 with a free hand, while after 7...e6 a capture on g6 lets your h-pawn recapture and open the h-file.",
             "line": "Qxd3 e6 O-O Ngf6"},
        ],

        # ── White's eighth move in the 6.Nf3 chapter ───────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 Bd3 e6": [
            {"san": "Bxg6", "severity": "playable", "tier": "Structure",
             "why": "A quarter of club players take at once. 8...hxg6, toward the centre, and the h-file is open for your rook. Then ...Ngf6, ...Be7 or ...Bd6, and castle.",
             "line": "hxg6 O-O Ngf6 c4 Bd6"},
        ],

        # ── your eighth move ───────────────────────────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 Bd3 e6 O-O": [
            {"san": "Bd6", "severity": "playable", "tier": "Plans",
             "why": "Playable, but club players with Black score badly with it, because 9.Re1 and 10.Nf5 come quickly. The course develops the knight first, 8...Ngf6, so that f5 and e5 are covered before the bishop commits.",
             "line": "Re1 Ngf6 Nf5 Bxf5 Bxf5"},
        ],

        # ── your sixth move against 6.h4 ───────────────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4": [
            {"san": "e6", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The most expensive natural move in the variation. 7.h5! attacks the bishop while h7 is still occupied by your own pawn, so it has to go to f5, where 8.Nxf5 takes it. Spend the move on ...h6 first; it is not a waiting move, it is the retreat square.",
             "line": "h5 Bf5 Nxf5 exf5 Nf3"},
        ],

        # ── White's seventh move after 6...h6 ──────────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6": [
            {"san": "h5", "severity": "playable", "tier": "Foundation",
             "why": "The club's most common move here. 7...Bh7 and the bishop sits on h7 exactly as in the chapter. After 8.Nf3 e6 it is the same position.",
             "line": "Bh7 Nf3 e6 Ne5 Nd7"},
        ],

        # ── White's eighth move after 7...e6 ───────────────────────────────
        "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 e6": [
            {"san": "h5", "severity": "playable", "tier": "Foundation",
             "why": "Fixing the h-pawn first, the club's most common move. 8...Bh7 9.Bd3 Bxd3 10.Qxd3 Nd7 and the only change from the chapter is that White's pawn is on h5, which shuts the h-file for good.",
             "line": "Bh7 Bd3 Bxd3 Qxd3 Nd7"},
        ],

        # ── White's fourth move in the Two Knights ─────────────────────────
        "e4 c6 Nf3 d5 Nc3 Bg4": [
            {"san": "exd5", "severity": "playable", "tier": "Structure",
             "why": "White trades in the centre. 4...cxd5 and then ...Nc6, ...e6 and ...Nf6: the pin on f3 stays, and White has nothing on the e-file to aim at.",
             "line": "cxd5 Be2 Nc6 d4 e6"},
            {"san": "Be2", "severity": "playable", "tier": "Structure",
             "why": "Breaking the pin in advance. 4...e6 and ...Nf6, and the bishop on g4 stays on its diagonal.",
             "line": "e6 d4 Nf6 e5 Nfd7"},
        ],

        # ── your fourth move after 4.h3 ────────────────────────────────────
        "e4 c6 Nf3 d5 Nc3 Bg4 h3": [
            {"san": "Bh5", "severity": "inaccuracy", "tier": "Structure",
             "why": "Four club players in ten keep the pin. 5.exd5 cxd5 6.g4 Bg6 7.Ne5 and the knight hits the bishop with gain of time, so the pin you kept has turned into a target. Take on f3.",
             "line": "exd5 cxd5 g4 Bg6 Ne5 Nc6"},
        ],

        # ── White's sixth move in the Two Knights ──────────────────────────
        "e4 c6 Nf3 d5 Nc3 Bg4 h3 Bxf3 Qxf3 e6": [
            {"san": "exd5", "severity": "playable", "tier": "Structure",
             "why": "A third of club players trade here. 6...cxd5 and then 7.d4 Nc6: it is a quiet Exchange in which White has the bishop pair and you have the better development.",
             "line": "cxd5 d4 Nc6 Be3 Nf6"},
        ],

        # ── White's seventh move in the Two Knights ────────────────────────
        "e4 c6 Nf3 d5 Nc3 Bg4 h3 Bxf3 Qxf3 e6 d4 Nf6": [
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "The masters' move, offering the d-pawn. 7...dxe4 8.Nxe4 Qxd4 takes it, and White's lead in development is what you have to deal with next: 9.c3 Qd8 and the queen comes home.",
             "line": "dxe4 Nxe4 Qxd4 c3 Qd8"},
        ],

        # ── White's fourth move after 2.Bc4 ────────────────────────────────
        "e4 c6 Bc4 d5 exd5 cxd5": [
            {"san": "Bb5+", "severity": "playable", "tier": "Structure",
             "why": "Three club players in ten check instead of retreating. 4...Bd7 5.Bxd7+ Qxd7 and the light-squared bishops are off; then ...Nc6, ...e6 and ...Nf6, with the d5-pawn holding the centre.",
             "line": "Bd7 Bxd7+ Qxd7 Nf3 Nc6"},
        ],

        # ── White's fifth move after 4.Bb3 Nc6 ─────────────────────────────
        "e4 c6 Bc4 d5 exd5 cxd5 Bb3 Nc6": [
            {"san": "Nf3", "severity": "playable", "tier": "Structure",
             "why": "Development before the d-pawn. 5...Bg4, the same pin, and the knight on f3 will be the piece that has to defend d4 later.",
             "line": "Bg4 c3 e6 d4 Nf6"},
            {"san": "Qf3", "severity": "inaccuracy", "tier": "Plans",
             "why": "The queen hits f7 and d5. 5...Nf6 covers both, and the queen is a target on f3 for your bishop and knights.",
             "line": "Nf6 d3 e6 Ne2 Bd6"},
        ],

        # ── White's sixth move after 5.d4 Nf6 ──────────────────────────────
        "e4 c6 Bc4 d5 exd5 cxd5 Bb3 Nc6 d4 Nf6": [
            {"san": "c3", "severity": "playable", "tier": "Structure",
             "why": "The pawn holds d4, so the pin on f3 will not win it. 6...Bg4 7.Ne2 e6 and you have an Exchange Caro-Kann where White's bishop on b3 bites on your d5-pawn.",
             "line": "Bg4 Ne2 e6 O-O Bd6"},
        ],

        # ── White's seventh move after 6...Bg4 ─────────────────────────────
        "e4 c6 Bc4 d5 exd5 cxd5 Bb3 Nc6 d4 Nf6 Nf3 Bg4": [
            {"san": "O-O", "severity": "inaccuracy", "tier": "Structure",
             "why": "Castling leaves d4 hanging. 7...Bxf3 8.Qxf3 Nxd4 and the pawn goes, as in the chapter. Eight club players in ten miss it and play 7...e6.",
             "line": "Bxf3 Qxf3 Nxd4 Qd3 Nc6"},
        ],
    },
    "games": [
        {
            "id": "polgar-karpov-1995",
            "name": "Polgar vs Karpov, Alma-Ata 1995: the minority attack",
            "tier": "Structure",
            "note": "The Exchange with Bd3, c3 and castling, reached by Karpov's move order. Karpov trades the light-squared bishops, puts a rook on c8 and pushes the b-pawn, and the pawns on a2, b2 and d4 fall one after another.",
            "moves": (
                "e4 c6 d4 d5 exd5 cxd5 Nf3 Nf6 Bd3 Bg4 O-O Nc6 c3 e6 h3 Bh5 Bf4 Bd6 Bg5 O-O "
                "Nbd2 Bg6 Bxg6 hxg6 Qe2 Qc7 Rae1 Rac8 Qd3 Nd7 h4 b5 g3 Rfe8 Qe3 Na5 "
                "Nh2 Nc4 Nxc4 Qxc4 Qf3 b4 Re3 Qxa2 h5 Nf8 h6 Nh7 Bf4 Bf8 hxg7 Bxg7 "
                "Ng4 Qxb2 cxb4 Qxd4 Be5 Bxe5 Nxe5 Rc7 Qe2 Ng5 Qa6 Qxb4 Qe2 Qd4"
            ),
            "notes": {
                10: "Karpov's order: the bishop first. After 6.O-O Nc6 7.c3 e6 it is the Bd3 chapter's position.",
                14: "The chapter's position, with the bishop out before ...e6.",
                16: "The bishop keeps the pin from h5, and it can come back to g6 to trade itself for the one on d3.",
                18: "Offer the trade of the dark-squared bishops. Polgar keeps hers with Bg5.",
                22: "The bishop drops back to offer the trade on g6. Polgar takes, and the h-pawn recaptures toward the centre.",
                28: "The rook on the c-file, the first step of the plan.",
                32: "The minority attack starts. The b-pawn heads for b4 to break up White's c3.",
                36: "The knight heads for c4, the hole in front of the c3-pawn.",
                42: "The pawn arrives on b4 and hits c3.",
                44: "The queen takes on a2. White's queenside is breaking up while White's attack has not yet reached anything.",
                54: "The queen takes on b2, the second pawn from the queenside.",
                56: "And d4, the third pawn the queen has taken since move twenty-two.",
                66: "Karpov's queen comes back to the centre, and that is where the game ended, 0-1.",
            },
        },
        {
            "id": "anand-carlsen-2013",
            "name": "Anand vs Carlsen, World Championship, Chennai 2013, game two: the wall",
            "tier": "Plans",
            "note": "The 6.h4 chapter played by the reigning world champion against the challenger about to take his title. Carlsen castles straight into White's pawn storm, trades three pairs of pieces in four moves, and the attack is over before it starts.",
            "moves": (
                "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 e6 "
                "Ne5 Bh7 Bd3 Bxd3 Qxd3 Nd7 f4 Bb4+ c3 Be7 Bd2 Ngf6 "
                "O-O-O O-O Ne4 Nxe4 Qxe4 Nxe5 fxe5 Qd5 Qxd5 cxd5 "
                "h5 b5 Rh3 a5 Rf1 Rac8 Rg3 Kh7 Rgf3 Kg8 Rg3 Kh7 Rgf3 Kg8"
            ),
            "notes": {
                18: "The trade that decides everything after it. Both light-squared bishops are now off the board; remember it when White castles long and the h-pawn starts to look dangerous.",
                22: "The check, as in the chapter.",
                24: "And back again. Two bishop moves for one pawn move looks like a poor deal until you see which pawn: White's c-pawn is now on c3, not c4.",
                27: "White castles long and sets up the attack: king on c1, pawns on f4 and h4 with a knight behind them.",
                28: "Carlsen castles straight into it. The pieces that make that attack work are not on the board: no light-squared bishop, so no Bxh7, and the h-file cannot open while your pawn sits on h6.",
                30: "The first of three trades in four moves.",
                32: "The second, and the biggest: the knight that has sat on e5 since move eight comes off for a knight that had done nothing.",
                34: "The third offer, and it comes with a threat: from d5 the queen also looks at a2, which castling long left without a defender.",
                36: "Eighteen moves, and the position is a wall. Queens off, all four knights off, one dark-squared bishop each, and a centre where no pawn can move: d4 against d5 and e5 against e6.",
                38: "Carlsen starts on the queenside. His pawns are aimed at a king on c1, and White's are aimed at a corner nobody lives in.",
                42: "The rook takes the c-file, looking at the pawn on c3 in front of White's king.",
                50: "The position repeats, and the game was drawn here. Carlsen went on to win the match and the title, and this was the game where he showed the Caro-Kann was not going to be the way in.",
            },
        },
    ],
    "progression": {
        "arc": "The Caro-Kann is the French with its main problem removed. It costs a tempo and gives you healthy positions for the rest of your chess life.",
        "stages": [
            {
                "tier": "Foundation",
                "when": "Week one",
                "goal": "Learn the one rule and White's four main roads.",
                "learn": [
                    "The rule: develop the light-squared bishop before you play ...e6.",
                    "White's roads: the Advance 3.e5, the Exchange 3.exd5 (and 2.Nf3 d5 3.exd5), the Classical 3.Nc3 or 3.Nd2, and the sidelines 2.Bc4 and 2.Nf3 d5 3.Nc3.",
                    "The two traps against you: 3.e5 Bf5 4.h4 needs 4...h5, and 2.Nf3 d5 3.d3 dxe4 4.Ng5 needs care with f7.",
                ],
                "drill": "Play every chapter in Learn and Drill until the first ten moves come without thinking.",
                "mistake": "Playing ...e6 on autopilot before the bishop is out. Against 4.h4 in the Advance it costs the bishop.",
                "ready": "You never lock the bishop in behind ...e6.",
            },
            {
                "tier": "Structure",
                "when": "Weeks two to six",
                "goal": "Know what you are aiming for in each structure.",
                "learn": [
                    "In the Advance, ...c5 at the base of the chain and knights on f5 and g6 against d4 and e5.",
                    "In the Exchange with Bd3 and c3, the minority attack ...b5 and ...b4.",
                    "In the Panov, blockade the isolated pawn with a knight on d5 and trade pieces.",
                ],
                "drill": "Play each chapter in Test until every plan card makes sense before you reach it.",
                "mistake": "Rushing ...c5 in the Classical before your pieces are out. The break is a reward, not an opening move.",
                "ready": "You can say in one sentence what you want by move twelve of any chapter.",
            },
            {
                "tier": "Plans",
                "when": "Months two to four",
                "goal": "Punish the club mistakes.",
                "learn": [
                    "2.Bc4 d5 3.exd5 cxd5 4.Bb3 Nc6 5.d4 Nf6 6.Nf3 Bg4 7.h3 Bxf3 8.Qxf3 Nxd4, the pawn club players give away.",
                    "The f7 sacrifice after 5.Ng5 e6 6.N1f3 h6 7.Nxf7: take the knight and walk the king back.",
                    "Where to castle in the Classical, and why short is usually right even against a long-castled king.",
                ],
                "drill": "Run Punish the blunder on this course until every refutation comes first time.",
                "mistake": "Playing for a draw. The solid structure is a platform for winning endings, not a shell to sit in.",
                "ready": "You have won a game a pawn up from one of these lines.",
            },
            {
                "tier": "Mastery",
                "when": "Ongoing",
                "goal": "Play the middlegames the way the masters do.",
                "learn": [
                    "The model games: Karpov against Polgar for the minority attack, Carlsen against Anand for the trades that end an attack.",
                    "The other systems: 4...Nd7 and 4...Nf6 in the Classical and 3...c5 against the Advance.",
                    "Endings with three pawns each on both wings, where Caro-Kann players score their points.",
                ],
                "drill": "Spar against club opponents from the Play page until you reach the end of your preparation more often than you leave it.",
                "mistake": "Assuming every opponent plays the Classical. Below master level most of them play the Advance, the Exchange or 2.Nf3.",
                "ready": "You have an answer ready for every White second and third move.",
            },
        ],
        "study": "Anatoly Karpov's Caro-Kann games are the model of risk-free winning. Magnus Carlsen and Ding Liren play it today, and the masters explorer has thousands of their games in these lines.",
        "next": "The Scandinavian is another sound answer to 1.e4 with a quick ...d5, and the Sicilian is the way to unbalance the game from move one.",
    },
}

OPENING = {
    "id": "nimzo",
    "name": "Nimzo-Indian Defence",
    "eco": "E20–E59",
    "section": "black-d4",
    "orientation": "black",
    "tagline": "Pin the knight, trade it off, and play against the doubled pawns. The most respected defence to 1.d4.",
    "level": "Intermediate → World Championship",
    "theory": {
        "big_idea": "3...Bb4 pins the knight on c3, and that knight is the only piece guarding e4. Black is not fighting for the centre with pawns — Black is fighting for one square, with pieces. The pin is worth a concrete pawn straight away: 4.e4 is met by 4...Nxe4, and the knight on c3 cannot recapture because it is pinned against the king. Sooner or later Black usually trades the bishop for that knight. White then has the bishop pair, and if the b-pawn recaptured, doubled c-pawns to go with it. The rest of the game is one clean argument: White's two bishops and open lines against Black's better structure and the squares in front of those pawns.",
        "structure": "The archetype is the Sämisch skeleton this course reaches on move ten: White pawns on a3, c3, c4, d4 and e4 against Black's a7, b6, c5, d7 and e6. Both sides have three pawns on the queenside, but two of White's stand on the c-file, so that wing can never produce a passed pawn — and the pawn on c4 has no pawn anywhere that can ever defend it, because White's b-pawn is the one now sitting on c3. Black blockades with ...c5, ...b6, ...Ba6 and ...Na5 and plays against c4; White plays e3–e4 and f2–f4 and tries to open lines before the pawn drops.",
        "white_plans": [
            "Rubinstein (4.e3): develop first, decide later. Bd3, Nf3, O-O, and then either dxc5 or an isolated d-pawn with the two bishops behind it.",
            "Classical (4.Qc2): defend c3 in advance so the recapture is Qxc3. White gets the bishop pair with no structural damage at all — and pays two tempi, Qc2 and a3, for it.",
            "Sämisch (4.a3): force the trade at once, accept the doubled pawns, build the big centre and attack.",
            "Kasparov (4.Nf3) and the Leningrad (4.Bg5): keep the options open, or pin back before Black is ready.",
        ],
        "black_plans": [
            "Trade on c3 when the recapture is bxc3, then blockade: ...c5, ...b6, ...Ba6 and ...Na5, all pointing at the pawn on c4.",
            "Keep the bishop and play ...d5 and ...c5, treating the position as a Queen's Gambit in which your dark-squared bishop is already outside the pawn chain.",
            "Fight for e4 with ...b6, ...Bb7 and ...Ne4 — Nimzowitsch's original plan, and the reason White so often answers f2–f3.",
            "Trade pieces. Every exchange helps whichever side has the better pawns, and after the bishop goes to c3 that is you.",
        ],
        "traps": [
            "4.e4 is not a move, it is a pawn: 4...Nxe4 and the knight on c3 is pinned and cannot take back. White gets a big centre for it and the engine still calls the position two thirds of a pawn better for Black.",
            "Never retreat the bishop to a5 once White has played a3. Against 4.a3 Ba5?? and 4.Qc2 O-O 5.a3 Ba5??, the answer is b2–b4 and the bishop is trapped — it is a whole piece, not a trick.",
            "Against 4.Qc2 do not trade on c3 out of habit. White recaptures with the queen, there are no doubled pawns to attack, and you have handed over the bishop pair for nothing.",
            "In the Rubinstein main line, after 11.exd4 the natural-looking 11...Ba6 simply hangs a bishop to 12.Bxa6: your b-pawn is on b6, so nothing at all recaptures on a6. ...Ba6 is a good move in this opening about twenty times and a blunder here.",
        ],
        "who": "Play this if you want a defence that is sound at every level from club to World Championship and that rewards understanding a pawn structure over remembering a move order. Nimzowitsch invented it, Capablanca and Karpov made it look easy, and Kramnik and Caruana still play it.",
    },
    "lines": [
        {
            "name": "Rubinstein Variation — 4.e3",
            "note": "White's most popular and most flexible line. The main line ends with an isolated white d-pawn and a blockade square that no pawn can ever attack.",
            "tier": "Structure",
            "drill": True,
            "plan": {
                "structure": 'isolani',
                "tier": "Structure",
                "point": "White has an isolated queen's pawn on d4. Count what came with it: the c-file is completely open, the e-file is half open toward your pawn on e6, and White's bishop on c4 covers d5 while the one on c1 already has the whole c1–h6 diagonal open in front of it. Count what came with it for you: d5 is a hole in front of the pawn, and while White's b-pawn sits on b2 there is no pawn left on the board that can ever attack a knight standing there.",
                "next": [
                    "...Nb6 and ...Nbd5, or ...Nf6–d5 — the blockade first, everything else after. A knight on d5 stops the pawn, hits c3, e3 and f4 from where it stands, and cannot be chased by anything.",
                    "Then trade. Queens and a pair of rooks off is worth more to you than any single move: the isolated pawn is an attacking engine while pieces are on and a plain weakness when they are not.",
                    "Weigh ...Bxc3 carefully. It wins the bishop pair argument and it hands White a pawn on the c-file — after bxc3 the c3–c4 push exists, and c4 is the one move that evicts a knight from d5. The deep dive plays it anyway and shows the price.",
                ],
                "endgame": "This is the ending the whole variation is played for, and it is yours: a knight on d5 against a bishop with nothing to bite on, and a pawn on d4 that needs a piece to defend it. White's answer is d4–d5 at the right moment — the pawn stops being weak the instant it advances — so the blockade is not a resting place, it is the thing you have to hold.",
            },
            "moves": "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 Rd1 cxd4 exd4 Bb7",
            "notes": {
                3: "The second big pawn move. Against 1...Nf6 there is nothing on d5 to capture, so c4 simply claims the square from the side. It also commits the c-pawn, and that matters later: when you trade on c3 and White recaptures with the b-pawn, the two pawns that appear on c3 and c4 are what this whole opening argues about.",
                4: "Preparing ...d5 or ...Bb4, and committing to nothing. The bishop on c8 is shut in for now — that is the price of the move and the reason ...b6 turns up in almost every line below.",
                5: "White's most ambitious third move: the knight adds a defender to e4 and to d5, so that e2–e4 becomes a real threat next move.",
                6: "The Nimzo-Indian. The knight on c3 is the only piece guarding e4, and it is now pinned against the king — so 4.e4 is answered by 4...Nxe4 and there is no recapture. Black has fought for the centre without moving a central pawn twice.",
                7: "The Rubinstein, and much the most common. White develops, keeps every plan available, and accepts that the bishop on c1 is shut in behind the pawn for a while.",
                8: "King safety, and it is the engine's own choice here. You will never castle queenside in a Nimzo-Indian, so this move commits nothing.",
                9: "The bishop takes the diagonal that points at h7. Note what White has not done: no a3, so the bishop on b4 is not being asked a question yet.",
                10: "Now the pawn. With the bishop already outside the chain, this is a Queen's Gambit Declined in which your worst piece is your best one.",
                11: "Development, and the last piece before castling.",
                12: "The break that defines the main line, hitting d4 for the second time. The engine is within a tenth of a pawn between this, 6...b6 (the Karpov) and 6...dxc4 — three real repertoires, and the deviation panel has all three.",
                13: "King safety. 7.cxd5 is the engine's own first choice and a completely different game.",
                14: "Releasing the tension on your terms. White's bishop has to spend a move recapturing, and every pawn that leaves the centre brings the isolated d-pawn closer.",
                15: "The bishop recaptures onto the a2–g8 diagonal. It is not hitting f7 — your own pawn on e6 blocks the way — but it covers d5, which is the square the rest of this variation is about.",
                16: "Development, and the knight backs up the c5-pawn and eyes b6 and e5. The engine slightly prefers 8...cxd4 here — the Karpov Variation — and the panel covers it.",
                17: "The queen steps off the d-file before the rook arrives, and adds a defender to c4.",
                18: "Preparing ...Bb7 for the long diagonal. It also means ...Ba6 will never be available: with the pawn on b6 nothing recaptures on a6, so the bishop would simply hang.",
                19: "The rook takes the file the isolated pawn is about to appear on.",
                20: "You resolve the centre. This is the moment the structure is decided, and you decide it.",
                21: "The pawn recaptures and White has an isolated queen's pawn: no pawn on the c-file and none on the e-file, so d4 can only ever be defended by pieces. In exchange White has the open c-file, the half-open e-file and two bishops.",
                22: "The last piece, on the diagonal the knight on f3 is currently blocking. The position is the Rubinstein tabiya, and it is level — White's most testing try is 12.d5 straight away, giving the pawn back to open the position before you can blockade it.",
            },
        },
        {
            "name": "Classical Variation — 4.Qc2",
            "note": "White defends c3 in advance so that the recapture is Qxc3 and no pawn is ever doubled. The critical test at the top level, and it costs White two tempi.",
            "tier": "Mastery",
            "drill": True,
            "plan": {
                "tier": "Mastery",
                "point": "Look at what each side owns. White has the bishop pair and you do not — two bishops and a knight still sitting on g1, against your two knights and a bishop — and White's own pawn on f3 has taken e4 away from both of your knights and your own pawn on d5 blocks the bishop on b7 before it gets anywhere near. That is the Classical bargain: White's structure is perfect, White's pieces are the long-range ones, and White has spent two whole moves — Qc2 and a3 — buying it.",
                "next": [
                    "...c5 is the break, and it is the move the whole setup was built for. It hits d4, opens the c-file at a queen sitting on c3, and it is worth more than any amount of manoeuvring.",
                    "Keep the tension on d5 as long as it annoys White. If White resolves it with cxd5 exd5 you are in a Carlsbad structure where your b-pawn is already on b6, so White's minority attack has nothing on c6 to attack.",
                    "Watch the queen on c3. It is on the same file as your rook the moment the c-file opens and on the same diagonal as a knight arriving on e4 — which is exactly why White spent a move on f3.",
                ],
                "endgame": "Bad for you if the position opens and fine if it does not. Two bishops in an endgame with pawns on both wings is a real half-pawn; two bishops with the centre locked and knights sitting on d5 and c5 is nothing at all. So trade a pair of minor pieces when you can — and prefer to trade a bishop for a bishop rather than a knight for one.",
            },
            "moves": "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 f3 h6 Bh4 d5 e3 Nbd7",
            "notes": {
                3: "The second big pawn move, claiming d5 from the side and committing the c-pawn.",
                4: "Preparing ...d5 or ...Bb4, and committing to nothing.",
                5: "The knight adds a defender to e4 and to d5, so that e2–e4 becomes a threat.",
                6: "The pin. The knight on c3 is the only guard of e4 and it cannot move.",
                7: "The Classical, or Capablanca, Variation. The queen defends c3 in advance, so a trade there is answered by Qxc3 and White's pawns stay perfect. It is the sharpest thing White has and it is also the slowest — the queen has moved before a single minor piece.",
                8: "King safety. Be honest about the cost: the engine likes 4...d5 (the Noa) and 4...c5 better, because after castling White has 5.e4 with the whole centre. 4...O-O is still the most played move in the position and it keeps you inside one system rather than three.",
                9: "Putting the question, and now it has to be answered. The one move that loses on the spot is 5...Ba5, when 6.b4 traps the bishop.",
                10: "Trading. There is nothing to wait for: retreating costs most of a pawn by the engine's count, and this way White's queen has to come to c3 to recapture.",
                11: "The queen takes back, and this is the whole point of 4.Qc2 — White has the bishop pair and not one weak pawn. What White does not have is development: two of White's moves so far have been made by the queen.",
                12: "Nimzowitsch's plan, unchanged since 1926. The bishop is going to b7 to fight for e4, which is the square White's queen and knights would otherwise use.",
                13: "The bishop comes out with a pin: the knight on f6 is tied to the queen on d8, and White would like to trade it off before it ever reaches e4.",
                14: "Development, and the bishops face off down the long diagonal.",
                15: "A modest-looking move doing three jobs: it takes e4 from your knight, it prepares e3–e4, and it shuts your bishop on b7 out of the game. It also means White's king will be slower to reach safety.",
                16: "Putting the question to the bishop while White's kingside is loose.",
                17: "Keeping the pin. Bxf6 would hand you back the bishop pair and repair nothing.",
                18: "The right moment, and the reason ...h6 came first: White's centre is challenged before e3–e4 can be prepared, and White's king is still on e1.",
                19: "White props up d4 and prepares Bd3 and Ne2. The pawn on e3 also admits that e3–e4 is not happening soon.",
                20: "Development, and ...c5 is next. White has two bishops and a perfect structure; you have every piece developed, a break ready, and a white king that has not castled. A genuinely balanced fight, and the engine agrees.",
            },
        },
        {
            "name": "Sämisch Variation — 4.a3",
            "note": "White forces the trade at once, takes the doubled pawns and goes for the big centre. The clearest illustration of the whole Nimzo-Indian argument.",
            "tier": "Plans",
            "drill": True,
            "plan": {
                "structure": 'doubled-c-pawns-open-b-file',
                "tier": "Plans",
                "point": "Count the queenside: three pawns each, but two of White's stand on the c-file. That wing can never make a passed pawn, and the pawn on c4 has no pawn anywhere that can ever defend it — White's b-pawn is the one now sitting on c3 and the d-pawn cannot go backwards. Your bishop on a6 attacks c4 once and White's bishop on d3 defends it once. Every remaining move of your plan is about that count.",
                "next": [
                    "...Na5 is the second attacker, and it cannot be chased by a pawn. ...Ne8–d6 is the third, and from d6 the knight hits c4 and e4 at the same time.",
                    "Keep the centre shut. White's compensation is two bishops and a pawn duo on d4 and e4 — the moment f2–f4 and e4–e5 get moving, the bishops have diagonals and your knights have nothing.",
                    "Do not hurry ...cxd4. Taking gives White cxd4 and a healthy pawn on d4 with the doubled pair repaired; leaving the tension means White has to keep watching c4, c3 and d4 all at once.",
                ],
                "endgame": "Yours, and this is the reason the whole trade was worth making. Three pawns on two files do the work of two, so with the pieces off White is effectively a pawn short on the queenside and the two bishops have nothing left to attack. Trade everything you are offered — the doubled pawns get worse with every piece that leaves the board.",
            },
            "moves": "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 e3 Nc6 Bd3 O-O Ne2 b6 e4 Ne8 O-O Ba6",
            "notes": {
                3: "The second big pawn move, claiming d5 from the side and committing the c-pawn.",
                4: "Preparing ...d5 or ...Bb4, and committing to nothing.",
                5: "The knight adds a defender to e4 and to d5, so that e2–e4 becomes a threat.",
                6: "The pin. The knight on c3 is the only guard of e4 and it cannot move.",
                7: "The Sämisch. White spends a whole tempo to force the question at once, and has already decided what the answer will be: the bishop pair and a huge pawn centre, paid for with a permanent structural weakness.",
                8: "Take. Retreating now costs a pawn's worth by the engine's count, and 4...Ba5 loses a piece outright to 5.b4.",
                9: "The doubled pawns appear, and with them the bargain: White gets two bishops and a centre that will grow to c3, c4, d4 and e4, and you get a pawn on c4 that no pawn can ever defend.",
                10: "Straight at the base of the centre. This is the move the structure demands and the engine's own choice.",
                11: "Supporting d4 and opening the bishop's path to d3.",
                12: "The second attacker on d4, and the knight is heading for a5, where it will hit c4 and cannot be driven off by a pawn.",
                13: "Development, and the bishop is the only defender c4 has.",
                14: "King safety.",
                15: "Note e2 and not f3. From e2 the knight covers d4, f4 and g3 and — the whole point — it leaves the f-pawn free to run. A knight on f3 would stand in front of White's own attack.",
                16: "Preparing ...Ba6 against the weakest point in White's position. It also gives the queen's rook the b-file to look down if the pawn ever moves.",
                17: "The dream centre. If White gets f2–f4 and e4–e5 in as well, the two bishops come alive and Black is genuinely in danger.",
                18: "Out of the way before it is pushed, and heading for d6, where the knight blockades the centre and adds a second piece attacking c4.",
                19: "King safety.",
                20: "And there it is: the bishop hits c4, which is defended exactly once. Both plans are now completely clear. Yours is ...Na5, ...Nd6 and a third attacker; White's is f2–f4, f4–f5 and an attack that has to arrive first. The engine calls the position level.",
            },
        },
    ],
    "deep": {
        "name": "Deep dive — trading both bishops off",
        "note": "The main line continued. Black gives up the dark bishop for the knight, then the light bishop for the other knight, and answers the bishop pair by removing it.",
        "moves": "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 Rd1 cxd4 exd4 Bb7 Bg5 Bxc3 bxc3 Qc7 Rac1 h6 Bh4 Bxf3 gxf3 Nh5 Bb3 Nf4",
        "tier": "Plans",
        "drill": True,
        "plan": {
            "tier": "Mastery",
            "point": "Count the pieces rather than the pawns. White has two bishops and no knights; you have two knights and no bishops, and you gave both of yours away on purpose. Now count what White's pawns can no longer do: with no e-pawn and no g-pawn left, there is not a pawn on the board that can ever attack a knight on f4. White has four pawn islands to your two, doubled pawns on the f-file, and no pawn at all in front of the king.",
            "next": [
                "Bring the second knight. ...Ndf6 and ...N6h5 puts two pieces on squares no pawn can touch, and the knight on f4 is already hitting the queen on e2.",
                "The king on g1 is the target and the half-open g-file is the road. ...Kh8 and ...Rg8 costs nothing, because White has no attack to be quick about.",
                "On the other wing, c3 is the whole story: no pawn defends it, the rook on c1 is the only piece that does, and it is the only pawn holding d4 up. Every time that rook has to leave, count the c-pawn again.",
            ],
            "endgame": "The one thing that would rescue White is an open endgame, because two bishops with pawns on both wings are worth about half a pawn there. That is exactly what the pawns deny: four islands against two, a doubled pair on f2 and f3, and a c3-pawn that no pawn can ever defend. Trade the queens when you can — the bishops need targets and the knights only need squares.",
        },
        "notes": {
            23: "White develops with a pin and prepares d4–d5, which would free the isolated pawn and hand the d5 square to a piece instead of to you.",
            24: "Now, while the bishop on g5 is committed. The knight on c3 is the only guard of d5 and e4 and it has to go before White organises anything.",
            25: "The recapture, and be exact about what has appeared. These are not doubled pawns — White's c-pawn went two moves ago, so the b-pawn simply lands on c3. What White has is a pawn on c3 that no pawn can defend, sitting on a file where you have no pawn at all, and it is the only pawn holding d4 up.",
            26: "Straight onto the half-open file. The queen is not attacking c3 yet — the bishop on c4 is standing in the way — which is why the bishop cannot simply retreat: 14.Bd3? Qxc3 and the pawn is gone.",
            27: "The move that solves it. From c1 the rook defends c3 through the empty c2-square, so the bishop is free to move later.",
            28: "Asking the question before committing anything else.",
            29: "Keeping the pin. Bxf6 would hand back a bishop and take the pressure off d5 in the same move.",
            30: "The second trade, and the one that matters most. The knight on f3 was holding d4 and covering e5, g5 and h2 all at once; the bishop that takes it has had a clear diagonal to that square since it arrived on b7 on move eleven.",
            31: "Forced, in the sense that the alternative loses a piece: 16.Qxf3 Qxc4 and the bishop is hanging, because the rook on c1 is blocked by White's own pawn on c3. The engine has Black more than six pawns better after that. So the g-pawn recaptures, and White's king loses its cover.",
            32: "Toward f4. This is what the whole exchange sequence was for.",
            33: "The bishop finally steps off the c-file, and now the pawn on c3 is defended by the rook rather than blocked by a piece.",
            34: "The knight arrives, and it attacks the queen on e2 as it lands. Two knights against two bishops, four white pawn islands against two of yours, and a white king with no pawn in front of it — the engine calls the position level, and level here means every practical chance is on your side. The engine's own move order is 17...Ndf6 first and ...Nf4 next; the difference is a fifth of a pawn and the square is the same.",
        },
    },
    "games": [
        {
            "id": "beliavsky-karpov-1989",
            "name": "Beliavsky – Karpov, Linares 1989 — the main line, and what a weak pawn is worth",
            "tier": "Structure",
            "note": "Beliavsky 2640 against Karpov 2750, and the first nine moves are the drill line exactly, by a slightly different order. Beliavsky then chooses 10.a3, the sharpest tenth move and one the deviation panel covers, and Karpov spends the next thirty moves proving that a pawn nothing can defend outlasts two bishops.",
            "moves": (
                "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 c5 Nf3 d5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 "
                "a3 cxd4 axb4 dxc3 bxc3 Qc7 Bb2 Bb7 Ba6 Bxa6 Rxa6 Rfc8 Rd1 h6 h3 Qb7 "
                "b5 Nc5 Raa1 a6 c4 axb5 Bxf6 gxf6 Rxa8 Qxa8 cxb5 Ne4 Qb2 Rc5 Nd4 Qd5 "
                "Rc1 Kg7 Rxc5 bxc5 Ne2 Qd1+ Kh2 Nd6 Ng3 h5 f3 Qd5 h4 c4 b6 Kg6 Qb4 f5 "
                "b7 Nxb7 Qe7 Qd8 Qxb7 Qxh4+ Kg1 Qxg3 Qb4 Qc7 Qf8 c3 f4 Kf6"
            ),
            "notes": {
                10: "5...c5 before 5...d5, which is the same position two moves later — the deviation panel after 5.Bd3 has this move order as well. Karpov reaches the drill line at move seven without ever leaving book.",
                18: "9...b6, and this is the tabiya. Every white tenth move from here is in the deviation panel, and the line the drill plays is 10.Rd1.",
                19: "10.a3, the sharpest of them. It asks the bishop a question that has only one answer, because the reply is forced by a capture on d4.",
                21: "11.axb4 wins the bishop and 11...dxc3 wins the knight straight back. Nothing is hanging, nothing is clever — it is a sequence, and it is worth memorising because there is no choice inside it.",
                23: "12.bxc3, and the accounting is finished: a bishop and a pawn each way, material dead level. White has two bishops and pawns on b4 and c3; you have no c-pawn, so the c-file is half open, and the pawn at the end of it can never be defended by another pawn.",
                24: "...Qc7 onto the file, exactly where the plan card puts it.",
                27: "14.Ba6, offering the trade of the light-squared bishops. Karpov takes without hesitating: every bishop that leaves the board takes half of White's compensation with it.",
                36: "...Nc5, and no white pawn can ever attack it: the d-pawn came off on move ten and the b-pawn has already gone past on b5. It lands hitting the rook on a6 as well, which is why White's next move is to bring the rook home.",
                41: "21.Bxf6 breaks up the kingside and gives away the last bishop to do it. The pair itself has been gone since move fourteen, which is the whole story of the game: White spent the opening buying two bishops and traded both of them for pieces that were doing more.",
                46: "...Ne4. With no white d-pawn on the board, the only pawn that can ever challenge the knight is the f-pawn, and it takes White another eight moves to play f2–f3. Karpov is not attacking anything — he is making sure that whatever comes off next, the knight is the best piece left.",
                54: "27...bxc5, and the pawn Karpov has been playing for since move twelve is a passed pawn. So is White's on b5 — but Black's is the one with a knight and a queen behind it.",
                64: "32...c4, and the pawn runs. The rest is technique: it ties White's queen and knight to the queenside and Karpov collects on the other wing.",
                74: "37...Qxh4+ and the pawns start falling.",
                82: "41...Kf6, and Beliavsky resigned. Black is two pawns up with a passed pawn on c3 that costs a queen to stop, and the engine has it at seven pawns. The bishop pair has been off the board for twenty moves.",
            },
        },
        {
            "id": "johner-nimzowitsch-1926",
            "name": "Johner – Nimzowitsch, Dresden 1926 — the blockade, by the man who invented it",
            "tier": "Plans",
            "note": "Round 2 at Dresden, and the most famous game this opening has produced. Nimzowitsch trades on c3 without being asked, locks the centre so the two bishops have nothing to look at, and then attacks on the wing where his own pieces already are. Every structural claim on the Sämisch plan card is in this game, reached from 4.e3.",
            "moves": (
                "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 c5 Nf3 Nc6 O-O Bxc3 bxc3 d6 Nd2 b6 "
                "Nb3 e5 f4 e4 Be2 Qd7 h3 Ne7 Qe1 h5 Bd2 Qf5 Kh2 Qh7 a4 Nf5 g3 a5 "
                "Rg1 Nh6 Bf1 Bd7 Bc1 Rac8 d5 Kh8 Nd2 Rg8 Bg2 g5 Nf1 Rg7 Ra2 Nf5 "
                "Bh1 Rcg8 Qd1 gxf4 exf4 Bc8 Qb3 Ba6 Re2 Nh4 Re3 Bc8 Qc2 Bxh3 "
                "Bxe4 Bf5 Bxf5 Nxf5 Re2 h4 Rgg2 hxg3+ Kg1 Qh3 Ne3 Nh4 Kf1 Re8"
            ),
            "notes": {
                10: "5...c5, the Hübner move order, which the deviation panel after 5.Bd3 covers. Nimzowitsch is not waiting to be asked about the bishop.",
                14: "7...Bxc3. Nobody played a3 — Black gives the bishop up voluntarily, because the pawn that lands on c3 is worth more than the bishop that made it happen.",
                15: "8.bxc3, and there is the structure the Sämisch plan card describes, reached from 4.e3: White pawns on a2, c3, c4 and d4 against your a7, b7 and c5. Three queenside pawns each, but two of White's are on one file, and the pawn on c4 has no pawn anywhere that can ever defend it.",
                16: "8...d6, locking his own bishop in and not caring. The centre is what matters and this pawn holds e5.",
                20: "10...e5, the second half of the blockade. White's centre is now facing pawns rather than pieces.",
                22: "11...e4! The move the whole plan was for. It attacks the bishop on d3 and takes f3 away from White's pieces in the same move — and when the bishop moves it has nowhere to go, because White's own pawn on c4 blocks the only other diagonal it owns. A bishop pair with no diagonals is not a bishop pair.",
                26: "13...Ne7, re-routing toward f5 and g6. Nimzowitsch does not develop pieces, he sends them to squares.",
                34: "17...Nf5, hitting d4 and e3 and sitting on a square White cannot contest with a pawn: the e-pawn on e3 is blocked by your own pawn on e4 so it can never reach e4, and g2–g4 runs straight into ...hxg4, which is what ...h5 was for.",
                43: "22.d5 locks the last of it: c4 against c5, d5 against d6, e3 against e4. Not one pawn in the centre can be exchanged from here, so neither white bishop will ever get a diagonal, and White is reduced to waiting.",
                48: "24...g5! The attack starts, and it works for a structural reason rather than a tactical one: with every central pawn locked there is no break for White to answer with, so a wing attack cannot be punished in the centre — which is the rule this game is usually quoted to teach.",
                66: "33...Bxh3! The sacrifice, and it is the pawn cover rather than the pawn that is being taken.",
                76: "38...Qh3, and now the queen, both knights and the pawn on g3 are all inside White's king position.",
                80: "40...Re8, and Johner resigned. The rook is coming to g8 behind the other one, and the engine has Black eleven pawns better. Count the squares round the white king: the pawn on g3 hits f2 and h2, the queen on h3 and the knight on h4 both hit g2, and every white piece that could defend that square is already defending it.",
            },
        },
    ],
    # Deviations, keyed by the position they answer. This is a Black repertoire:
    # at almost every prefix below it is WHITE to move, so the entries are White's
    # systems and the `why` says what you do about each. The sets where Black is
    # to move are your own choices, and they are labelled as such.
    "branches": {

        # ── ply 2 · White's second move, before c4 ──────────────────────────────
        "d4 Nf6": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "The flexible order, and it matters to you for exactly one reason: if White never plays Nc3 there is no knight to pin and no Nimzo-Indian. 2...e6 leaves White the same choice one move later. Decide now what you play against a White knight that goes to f3 instead — the Queen's Indian with ...b6 is the standard pairing, and every Nimzo player needs one.",
             "line": "e6 c4 b6 g3 Ba6"},
            {"san": "Bf4", "severity": "playable", "tier": "Foundation",
             "name": "London System",
             "why": "The bishop comes out before e3 shuts it in, and White is not going to build the big centre your pin exists to stop. There is nothing to pin and nothing to blockade: take the centre with ...d5 and hit the base of White's with ...c5. Your Nimzo knowledge does not apply here and does not need to.",
             "line": "d5 e3 c5 Nd2 Nc6",
             "see": "london"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "name": "Trompowsky Attack",
             "why": "White offers to trade the bishop for your knight and wreck your kingside pawns before you have a structure to defend. 2...d5 is the engine's own answer and the simplest: take the centre while White spends time on a bishop. 2...e6 is playable too and invites 3.e4, which is a completely different game from anything in this file.",
             "line": "d5 e3 c5 c3 Nc6"},
        ],

        # ── ply 4 · White's third · the move that decides whether you get a Nimzo ─
        "d4 Nf6 c4 e6": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "The move that takes this whole opening off the board. With the knight on f3 there is nothing on c3 to pin, so 3...Bb4+ is only a check and 3...b6 is a Queen's Indian. This is the single most important gap in a Nimzo repertoire: prepare an answer before your first game, because it is at least as common as 3.Nc3.",
             "line": "b6 g3 Ba6 Nbd2 Bb7"},
            {"san": "g3", "severity": "playable", "tier": "Structure",
             "name": "Catalan Opening",
             "why": "White fianchettoes first and asks about d5 from a distance. Again there is no knight on c3, so the pin is off — but ...Bb4+ with check is available and is one of the main Catalan systems, and ...dxc4 followed by ...c5 is the other. A whole opening of its own, and it is in this course.",
             "line": "d5 Bg2 dxc4 Nf3 c5",
             "see": "catalan"},
            {"san": "a3", "severity": "playable", "tier": "Mastery",
             "why": "One move, and the pin is prevented before it exists. It costs White a tempo and does nothing for development, so take the centre: 3...d5 and if White ever plays Nc3 you have a Queen's Gambit in which a3 is a wasted move. The engine has White down to almost nothing, which for move three is a real concession.",
             "line": "d5 e3 dxc4 Bxc4 c5"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "A genuine pin — the knight on f6 is tied to the queen on d8 — but it is the wrong piece to pin this early. 3...h6 asks the question at once: 4.Bxf6 Qxf6 gives you the bishop pair with no weaknesses, and 5.Nc3 Bb4 is a Nimzo-Indian in which White has traded the good bishop for a knight.",
             "line": "h6 Bxf6 Qxf6 Nc3 Bb4"},
        ],

        # ── ply 5 · your own third · the fork in the repertoire ─────────────────
        "d4 Nf6 c4 e6 Nc3": [
            {"san": "d5", "severity": "playable", "tier": "Foundation",
             "name": "Queen's Gambit Declined",
             "why": "The classical alternative and, by the engine's count, exactly as good. You claim the centre with a pawn instead of arguing about it with a bishop, and you accept a passive light-squared bishop in exchange for a structure nothing can break. A different repertoire, not a worse one.",
             "line": "cxd5 exd5 Bg5 Be7 e3",
             "see": "queensgambit"},
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "name": "Modern Benoni",
             "why": "Straight into Benoni structures: 4.d5 and the game is about White's space against your queenside majority and the long diagonal. Sharp, theory-heavy and nothing like the Nimzo — the engine has White two thirds of a pawn better, which is the standard price of that kind of imbalance.",
             "line": "d5 g6 e4 d6 Nf3"},
            {"san": "b6", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The right idea in the wrong order. Without the bishop on b4 there is nothing stopping 4.e4, and White simply takes the whole centre for free — the engine has White nearly a pawn better, which at move three is a lot. Play ...Bb4 first; ...b6 comes next move in half the lines below anyway.",
             "line": "e4 Bb7 Bd3 d6 Qe2"},
        ],

        # ══ THE CROSSROADS · White's fourth move decides the whole game ═════════
        "d4 Nf6 c4 e6 Nc3 Bb4": [
            {"san": "e3", "severity": "playable", "tier": "Foundation",
             "name": "Rubinstein Variation",
             "why": "Much the most common, and the line this course is built on. White develops, keeps every plan in hand and does not commit to whether the bishop will ever be questioned. Answer ...O-O and let White choose which Rubinstein this is.",
             "line": "O-O Bd3 d5 Nf3 c5",
             "see": "nimzo#rubinstein"},
            {"san": "Qc2", "severity": "playable", "tier": "Structure",
             "name": "Classical Variation",
             "why": "The critical test at the top level: the queen defends c3 in advance, so trading there is answered by Qxc3 and White's pawns stay perfect. What White pays is time — two moves by the queen and a rook's pawn before a single minor piece is out.",
             "line": "O-O a3 Bxc3+ Qxc3 b6",
             "see": "nimzo#classical"},
            {"san": "a3", "severity": "playable", "tier": "Plans",
             "name": "Sämisch Variation",
             "why": "The most honest move on the board: White pays a whole tempo to force the trade at once and takes the doubled pawns knowingly, in exchange for two bishops and a centre that will run to c3, c4, d4 and e4. The engine puts it about a fifth of a pawn behind 4.e3 and 4.Qc2, and it is completely sound at every level.",
             "line": "Bxc3+ bxc3 c5 e3 Nc6",
             "see": "nimzo#misch-variation"},
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "name": "Kasparov Variation",
             "why": "Development, and a refusal to answer anything yet: e3, Qc2, g3 and Bg5 are all still available next move. Nothing you know is wasted — ...O-O and ...c5 transpose into the Rubinstein and the Classical more often than not, and 4...b6 is the independent test.",
             "line": "O-O e3 d5 Bd2 Be7"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "name": "Leningrad Variation",
             "why": "White pins the other knight before you can play ...h6, and intends e3, Qc2 and f3 with a big centre. 4...h6 5.Bh4 c5 is the main line; the engine prefers hitting the centre first with 4...c5, when White's bishop on g5 turns out to be defending nothing at all.",
             "line": "c5 Nf3 h6 Bd2 cxd4"},
            {"san": "f3", "severity": "playable", "tier": "Mastery",
             "why": "The Kmoch, or Gheorghiu, Variation: White spends a move preparing e2–e4 rather than developing. Hit the centre before it exists — 4...d5 5.a3 Be7 and White has a big pawn front, no pieces out and a hole on e3. Retreating the bishop to e7 rather than trading is the point.",
             "line": "d5 a3 Be7 e4 dxe4"},
            {"san": "g3", "severity": "playable", "tier": "Mastery",
             "why": "The fianchetto. From g2 the bishop will cover e4 and d5 from a distance — e4 being exactly the square your pin exists to fight for — so the pin loses some of its value and ...dxc4 gains some. Play ...O-O and ...d5, and take on c4 once White's bishop has committed to g2.",
             "line": "O-O Bg2 d5 Nf3 dxc4"},
            {"san": "Qb3", "severity": "playable", "tier": "Mastery",
             "name": "Spielmann Variation",
             "why": "The queen defends c3 from the other side and hits b4 at the same time, so ...Bxc3+ would be met by Qxc3 as well. It is slower than 4.Qc2 because the queen is offside on b3: 4...c5 hits the centre and the engine has the position level.",
             "line": "c5 Nf3 Nc6 e3 cxd4"},
            {"san": "Bd2", "severity": "playable", "tier": "Mastery",
             "why": "The move that unpins by hand. It works — the knight on c3 is free and White's pawns will never be doubled — and it costs White the two most useful things a piece can do, because the bishop on d2 is neither developed nor doing anything. 4...c5 and you are already comfortable.",
             "line": "c5 Nf3 cxd4 Nxd4 Nc6"},
            {"san": "e4", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The pin, cashed. The knight on c3 is the only guard of e4 and it is pinned against the king, so 4...Nxe4 wins the pawn and there is no recapture. Do not expect a rout: after 5.Qc2 Nxc3 6.bxc3 Bd6 White has a broad centre and open lines for it, and the engine calls it two thirds of a pawn. It is still the clearest possible demonstration of what 3...Bb4 is for.",
             "line": "Nxe4 Qc2 Nxc3 bxc3 Bd6"},
        ],

        # ══ RUBINSTEIN ══════════════════════════════════════════════════════════

        # ── ply 8 · your own fourth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3": [
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "name": "Hübner Variation",
             "why": "The other great system against the Rubinstein: 5.Bd3 Nc6 6.Nf3 Bxc3+ 7.bxc3 d6 and Black locks the centre with ...e5 before White can open it. You give up the bishop pair at once and get a position where the two bishops have no diagonals and the pawn on c4 is fixed for ever. Nimzowitsch's own treatment, and the model game below is it.",
             "line": "Bd3 Nc6 Nf3 Bxc3+ bxc3",
             "see": "nimzo#johner"},
            {"san": "b6", "severity": "playable", "tier": "Mastery",
             "name": "St Petersburg Variation",
             "why": "Fighting for e4 with the bishop before castling. White's sharpest reply is 5.Ne2, when 5...Ba6 is the Fischer Variation — and note what the knight on e2 has done: it stands in front of the f1-bishop, which was the only thing defending c4. The bishop on a6 hits a pawn with nothing behind it.",
             "line": "Ne2 Ba6 Ng3 Bxc3+ bxc3"},
            {"san": "d5", "severity": "playable", "tier": "Structure",
             "why": "Committing in the centre first, and the engine is completely indifferent between this and 4...O-O. It usually transposes; the one independent try is 5.a3 Bxc3+ 6.bxc3, the Botvinnik Variation, where White gets the doubled pawns with the centre still fluid.",
             "line": "Qc2 O-O a3 Bxc3+ Qxc3"},
            {"san": "Nc6", "severity": "playable", "tier": "Mastery",
             "name": "Taimanov Variation",
             "why": "The knight goes to c6 before the pawn goes to c5, so that ...e5 rather than ...c5 is the break. It costs about a third of a pawn against best play — the honest price of putting the knight in front of the c-pawn — and it produces positions nobody prepares for.",
             "line": "Bd3 d5 Ne2 dxc4 Bxc4"},
        ],

        # ── ply 9 · White's fifth ───────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O": [
            {"san": "Nf3", "severity": "playable", "tier": "Foundation",
             "why": "The same position by another route in most lines — White will play Bd3 next and you will play ...d5. What it gives up is the Ne2 systems, because the knight is committed; what it keeps is everything else.",
             "line": "b6 Bd3 d5 cxd5 exd5"},
            {"san": "Ne2", "severity": "playable", "tier": "Mastery",
             "name": "Reshevsky Variation",
             "why": "The point is the recapture. With the knight on e2 rather than f3, a later a3 is answered by Nxc3 instead of bxc3, so White gets the bishop pair and keeps a perfect structure — the Classical Variation's idea, bought with a knight move instead of two queen moves. Answer ...d5 and retreat the bishop rather than trade it.",
             "line": "d5 a3 Be7 cxd5 exd5"},
            {"san": "a3", "severity": "playable", "tier": "Structure",
             "why": "The Sämisch a move late, and the tempo is yours: you have castled and White has not developed a single piece. Take at once and go straight for the structure — 5...Bxc3+ 6.bxc3 d6 and ...e5, and the engine already has you slightly better.",
             "line": "Bxc3+ bxc3 d6 Bd3 e5"},
        ],

        # ── ply 10 · your own fifth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3": [
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "why": "The Hübner move order, and the one Nimzowitsch himself used in the most famous game this opening has produced: 6.Nf3 Nc6 7.O-O Bxc3 8.bxc3 d6 and the doubled pawns are on the board while the centre is still closed. The engine has it level with 5...d5 to within a tenth of a pawn — this is a choice of structure, not a choice of quality.",
             "line": "Nf3 Nc6 O-O Bxc3 bxc3",
             "see": "nimzo#johner"},
            {"san": "b6", "severity": "playable", "tier": "Mastery",
             "why": "One move too slow here, and the reason is concrete: 6.e4! and White has the full centre while your bishop is still on c8. A third of a pawn by the engine's count. Against 5.Bd3 the pawn moves come first.",
             "line": "e4 d5 cxd5 c5 a3"},
            {"san": "Nc6", "severity": "playable", "tier": "Mastery",
             "why": "The Taimanov by transposition, and it costs about a third of a pawn because the knight blocks the c-pawn: 6.Ne2 Re8 7.e4 and White gets the centre. Play it only if you intend ...d6 and ...e5 rather than ...c5.",
             "line": "Ne2 Re8 e4 d6 O-O"},
        ],

        # ── ply 11 · White's sixth · the door to the Carlsbad ───────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5": [
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "Not a simplification — a structure, and a famous one. After 6...exd5 White has two queenside pawns against your three, which is the Carlsbad, and White's plan for the next twenty moves is a4, b4, b5 and a target on c6. Yours is on the other wing where your pawns point: ...Ne4, ...Bd6 and ...f5. One move, ...a5, takes most of White's plan away.",
             "line": "exd5 Nf3 Re8 O-O Bd6",
             "see": "structure#carlsbad"},
            {"san": "a3", "severity": "playable", "tier": "Structure",
             "why": "Asking the question now. Take — 6...Bxc3+ 7.bxc3 — and note what White has spent: a tempo on a3, the pawn structure, and any chance of Nxc3. You get the doubled pawns with your own centre already built, which is the best version of this trade you will ever be offered.",
             "line": "Bxc3+ bxc3 dxc4 Bxc4 c5"},
            {"san": "Ne2", "severity": "playable", "tier": "Mastery",
             "why": "The Reshevsky idea one move later: the knight heads for e2 so that a3 will be met by Nxc3. It costs a shade because the knight blocks the queen's defence of d4 for a move — 6...dxc4 7.Bxc4 c5 and you get the same central trade with White's knight on a worse square.",
             "line": "dxc4 Bxc4 c5 O-O cxd4"},
        ],

        # ── ply 12 · your own sixth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3": [
            {"san": "b6", "severity": "playable", "tier": "Plans",
             "why": "Karpov's treatment, and the engine's equal first choice: ...Bb7 or ...Ba6 before the centre resolves, so that the bishop is already looking at c4 when the pawn there needs defending. It leads to a slower game than 6...c5 and to fewer forcing lines — which is exactly why Karpov played it.",
             "line": "cxd5 exd5 O-O Ba6 Ne5"},
            {"san": "dxc4", "severity": "playable", "tier": "Structure",
             "why": "Taking first and playing ...c5 next, which is the same idea as the main line with the moves swapped. The engine rates it a hair above 6...c5. The one difference worth knowing: White's bishop reaches c4 before you have committed the c-pawn, so ...c5 comes with the bishop already staring at f7.",
             "line": "Bxc4 c5 O-O cxd4 exd4"},
            {"san": "Nbd7", "severity": "playable", "tier": "Mastery",
             "why": "Solid, and a shade slow, because it does nothing about the centre: 7.a3 Bxc3+ 8.bxc3 and White has the doubled pawns with a free hand in the middle. Play it if you want ...c5 supported twice; play ...c5 or ...dxc4 if you want to argue.",
             "line": "a3 Bxc3+ bxc3 Nb6 cxd5"},
        ],

        # ── ply 13 · White's seventh ────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5": [
            {"san": "cxd5", "severity": "playable", "tier": "Plans",
             "why": "The engine's own first choice and the most testing move here, because it flips the structure onto you: 7...exd5 8.dxc5 and the isolated pawn is yours on d5, not White's on d4. Everything on the plan card still applies — with the colours swapped. Recapture the c-pawn with a piece and blockade on d4.",
             "line": "exd5 dxc5 Nbd7 Bd2 Nxc5"},
            {"san": "dxc5", "severity": "playable", "tier": "Structure",
             "why": "Releasing the centre too early. 7...dxc4! 8.Bxc4 Qxd1+ 9.Kxd1 Bxc5 and the queens are off with White's king on d1 and no castling rights left — the engine has you a tenth of a pawn better, which after seven moves as Black is a good morning's work.",
             "line": "dxc4 Bxc4 Qxd1+ Kxd1 Bxc5"},
            {"san": "a3", "severity": "playable", "tier": "Structure",
             "why": "Asking with the centre still full of pawns, which is the version that suits you: 7...Bxc3+ 8.bxc3 Qc7 and White's c-pawns are fixed before White has castled. The engine has the position level or a shade better for you.",
             "line": "Bxc3+ bxc3 Qc7 Nd2 b6"},
        ],

        # ── ply 16 · your own eighth · the Karpov Variation ─────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4": [
            {"san": "cxd4", "severity": "playable", "tier": "Plans",
             "name": "Karpov Variation",
             "why": "The engine's move and the one Karpov made his own. You resolve the centre first and follow with ...b6 and ...Bb7, reaching the same isolated-pawn position as the main line with one difference that matters: the b8-knight is still at home, so it can go to c6 and attack d4 instead of sitting passively on d7.",
             "line": "exd4 b6 Qe2 Bb7 Bg5"},
            {"san": "Nc6", "severity": "playable", "tier": "Structure",
             "why": "Developing toward d4 rather than behind it. It invites 9.a3 Bxc3 10.bxc3, which is a fair trade — you give the bishop pair and get a target on c3 and the half-open c-file for the queen. It costs nothing at all by the engine's count, and it is a completely different middlegame from the main line.",
             "line": "a3 Bxc3 bxc3 Qc7 Bb5"},
            {"san": "b6", "severity": "playable", "tier": "Mastery",
             "why": "The fianchetto first, keeping every other piece flexible. A fifth of a pawn, and the same answer from White: 9.a3 Bxc3 10.bxc3 and the argument is about c3 and c4 rather than about d4.",
             "line": "a3 Bxc3 bxc3 Bb7 Bb2"},
        ],

        # ── ply 19 · White's tenth ──────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6": [
            {"san": "a3", "severity": "playable", "tier": "Plans",
             "why": "The sharpest, and it forces a sequence worth knowing by heart: 10...cxd4 11.axb4 dxc3 12.bxc3 and every capture is answered. Material is dead level, White has two bishops, and White's pawns are on b4 and c3 with the c-file half open for your rooks. Karpov reached exactly this against Beliavsky and won it — the plan is ...Qc7, ...Bb7 and ...a5 against the pawn on b4.",
             "line": "cxd4 axb4 dxc3 bxc3 Qc7"},
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "Stepping off the a2–g8 diagonal before you take on d4, so that the bishop is not left staring at your knight on d7. It costs a third of a pawn because it gives you a free tempo in the centre: 10...cxd4 11.exd4 Bb7 and the isolated pawn appears with White's rook still on f1.",
             "line": "cxd4 exd4 Bb7 Bf4 Bxc3"},
        ],

        # ── ply 22 · White's twelfth · the end of the main line ─────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 Rd1 cxd4 exd4 Bb7": [
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "why": "The critical try and the engine's own move: White gives the isolated pawn straight back rather than let you blockade it. 12...exd5 13.Nxd5 Re8 and you must not grab — the point is to trade a pair of minor pieces on d5 and reach a level position where nobody has a weakness. An isolated pawn that advances stops being weak, which is the one thing the plan card asks you to remember.",
             "line": "exd5 Nxd5 Re8 Qc2 Bxd5"},
            {"san": "a3", "severity": "inaccuracy", "tier": "Structure",
             "why": "Asking the question at the worst possible moment. 12...Bxc3! 13.bxc3 and White's structure is now the problem: the isolated pawn on d4 has acquired a defender, and the defender is a pawn on c3 that nothing defends, sitting on a file where your rook goes next. The engine has you half a pawn better.",
             "line": "Bxc3 bxc3 Rc8 Bg5 h6"},
            {"san": "Bd3", "severity": "playable", "tier": "Structure",
             "why": "Retreating to the attacking diagonal and keeping everything together. Answer ...Rc8 and take the open file — the c-file is the one line on the board with no pawn of either colour on it, and whoever owns it decides whether the isolated pawn is a weakness or a battering ram.",
             "line": "Rc8 Bd2 Bd6 Rac1 Qc7"},
        ],

        # ── ply 23 · your own twelfth, where the deep dive begins ───────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 Rd1 cxd4 exd4 Bb7 Bg5": [
            {"san": "h6", "severity": "playable", "tier": "Plans",
             "why": "Asking first and trading after. 13.Bh4 and now ...Bxc3 14.bxc3 Qc7 reaches the deep dive with h6 and Bh4 thrown in, which suits you: the bishop on h4 is one square further from the queenside, where the game is about to be. Perfectly good, and about a third of a pawn behind taking at once.",
             "line": "Bh4 Bxc3 bxc3 Qc7 Bg3"},
            {"san": "Be7", "severity": "inaccuracy", "tier": "Structure",
             "why": "Breaking the pin by retreating, and it throws away the whole point of the opening — you have spent four moves on a bishop that is now on e7 doing nothing, and White still has a healthy pawn structure. Half a pawn, and no counterplay to show for it.",
             "line": "Rac1 Re8 Bf4 a6 a4"},
            {"san": "Rc8", "severity": "inaccuracy", "tier": "Plans",
             "why": "Taking the open file before dealing with the centre, and White does not wait: 13.d5! exd5 14.Nxd5 and the isolated pawn has advanced, the knight sits on the square you meant to blockade, and the bishop on g5 is pinning the piece that should be taking it. Half a pawn. Resolve the pin first.",
             "line": "d5 exd5 Nxd5 Bxd5 Bxd5"},
        ],

        # ── ply 26 · White's fourteenth, deep in the deep dive ──────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O dxc4 Bxc4 Nbd7 Qe2 b6 Rd1 cxd4 exd4 Bb7 Bg5 Bxc3 bxc3 Qc7": [
            {"san": "Nd2", "severity": "playable", "tier": "Mastery",
             "why": "The most accurate, and the reason is the c3-pawn: with the knight on d2 the bishop on c4 can leave without dropping it, because the knight covers b3 and White can meet ...Qxc3 with Rac1 and Rc1xc3 ideas. Answer 14...Nd5, offering the trade of your knight for the bishop that is holding everything together.",
             "line": "Nd5 Bxd5 exd5 Re1 h6"},
            {"san": "Bd3", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The natural retreat, and it hangs a pawn. The bishop on c4 was the only thing standing between your queen on c7 and the pawn on c3, which nothing else defends: 14...Qxc3 and it is simply yours. Take it — White gets real activity with 15.Ne5, and the engine still calls the position half a pawn in your favour, which is a pawn taken and about half of it handed back.",
             "line": "Qxc3 Ne5 Qa5 Qe3 Rfc8"},
            {"san": "Bxf6", "severity": "playable", "tier": "Structure",
             "why": "Cashing in the pin before it costs anything. It hands you the bishop pair back and it gives you the moment to take on f3, where the knight is holding d4 and h2 at the same time: 14...Bxf3 15.Qxf3 Qxc4 and the material is level with White's dark-squared bishop stranded on f6.",
             "line": "Bxf3 Qxf3 Qxc4 Bg5 Rac8"},
        ],

        # ══ CLASSICAL ═══════════════════════════════════════════════════════════

        # ── ply 8 · your own fourth against 4.Qc2 ───────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2": [
            {"san": "d5", "severity": "playable", "tier": "Plans",
             "name": "Noa Variation",
             "why": "The engine's own first choice, and the most direct: you occupy the centre before White can play e4, and the queen on c2 turns out to be aiming at a square your pawn now covers. It usually transposes back after 5.a3 Bxc3+ 6.Qxc3 O-O, with one real gain — you have not given White the chance of 5.e4.",
             "line": "a3 Bxc3+ Qxc3 O-O Nf3"},
            {"san": "c5", "severity": "playable", "tier": "Mastery",
             "name": "Pirc Variation",
             "why": "Nothing to do with the Pirc Defence — it is the Nimzo line named after Vasja Pirc. You hit d4 at once and invite 5.dxc5, when ...O-O and ...Bxc5 wins the pawn back with a lead in development. The engine has it a shade behind 4...d5 and well inside the range of a repertoire choice.",
             "line": "dxc5 O-O a3 Bxc5 Bf4"},
            {"san": "Nc6", "severity": "playable", "tier": "Mastery",
             "name": "Zürich Variation",
             "why": "Also called the Milner-Barry: the knight goes to c6 and the plan is ...d6 and ...e5 rather than ...d5 and ...c5. It costs about a third of a pawn because the knight blocks the c-pawn, and it produces a game almost nobody at club level has prepared for.",
             "line": "e3 Bxc3+ Qxc3 O-O b3"},
        ],

        # ── ply 9 · White's fifth ───────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O": [
            {"san": "e4", "severity": "playable", "tier": "Plans",
             "why": "The engine's own move here and the concrete reason 4...d5 is the more accurate fourth move: with the queen defending c3, e4 is no longer a pawn on offer, and White takes the whole centre. Answer 5...d6 and ...e5 — the game becomes a King's-Indian-flavoured fight in which White's extra pawn in the centre is balanced by the doubled pawn you are about to hand White on c3.",
             "line": "d6 a3 Bxc3+ bxc3 e5"},
            {"san": "Nf3", "severity": "playable", "tier": "Structure",
             "why": "Development instead of the question, and it costs White most of the advantage 4...O-O had conceded. 5...c5! immediately, because with the knight on f3 there is no e4 to worry about: 6.dxc5 Na6 and you regain the pawn with a comfortable game.",
             "line": "c5 dxc5 Na6 g3 Nxc5"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "White pins the knight on f6 while your bishop is still pinning the knight on c3, and it achieves nothing — the engine calls the position level, which is the whole difference from 5.a3. Hit the centre: 5...c5 6.e3 h6 and White's bishop has to decide between the pin and the pawn on d4, which now has one defender and two attackers.",
             "line": "c5 e3 h6 Bh4 cxd4"},
        ],

        # ── ply 10 · your own fifth · the ...Bxc3 timing question ───────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3": [
            {"san": "Be7", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The retreat, and here it is simply bad: White has spent a3, you have spent four moves on a bishop that has returned to a square it could have reached in one, and 6.e4 takes the centre with the pin gone. Two thirds of a pawn. In the Classical you trade — the tempo White paid for a3 is the whole compensation for the bishop pair.",
             "line": "e4 d5 e5 Nfd7 cxd5"},
            {"san": "Bd6", "severity": "inaccuracy", "tier": "Structure",
             "why": "Retreating to the more active square, and it walks into 6.e4 e5 7.Nb5, hitting the bishop with the knight you were supposed to be pinning. Nearly a pawn, and the bishop ends up traded anyway — on White's terms and a tempo later.",
             "line": "e4 e5 Nb5 exd4 Nxd6"},
            {"san": "Ba5", "severity": "blunder", "tier": "Foundation",
             "why": "Keeping the pin, and losing a piece for it. 6.b4! and the bishop has exactly one square left on the a5–d8 diagonal — c7 and d8 are occupied by your own pawn and queen — and the c-pawn covers b6 the move after. The counter-attack does not help: 6...c5 7.bxa5 and White is a piece for a pawn up. This is the single most common way to lose a Nimzo-Indian in ten moves. Once White has played a3, the bishop goes to c3 or back to e7 — never to a5.",
             "line": "b4 c5 bxa5 cxd4 Ne4"},
        ],

        # ── ply 12 · your own sixth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3": [
            {"san": "d5", "severity": "playable", "tier": "Structure",
             "why": "Taking the centre instead of besieging it. The engine is indifferent between this and 6...b6, and it is a much simpler game: ...dxc4 next hits the queen's defence of c4 and gets your light-squared bishop out to a6 or b7 with a clear job.",
             "line": "Nf3 b6 Bg5 dxc4 Qxc4"},
            {"san": "d6", "severity": "playable", "tier": "Mastery",
             "why": "The slow set-up: ...d6, ...Nbd7 and ...e5, playing for the dark squares White's bishop pair cannot easily reach. Within a sixth of a pawn of the main line, and the set-up Nimzowitsch used to beat Grünfeld at Kecskemét in 1927.",
             "line": "Bg5 Nbd7 f3 e5 e4"},
            {"san": "b5", "severity": "playable", "tier": "Mastery",
             "why": "A modern pawn sacrifice, and the engine puts it within a quarter of a pawn of 6...b6 — which is a remarkable thing to be able to say about giving a pawn away on move six. 7.cxb5 c6 and you get the half-open c-file, the centre and a development lead against a queen that has already moved twice.",
             "line": "cxb5 c6 bxc6 Nxc6 e3"},
        ],

        # ── ply 13 · White's seventh ────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6": [
            {"san": "Nf3", "severity": "playable", "tier": "Structure",
             "why": "Development before the pin, and the difference is real: with the knight on f3 White has no Nh3 or Ne2 route and the f-pawn stays at home, so ...Ne4 keeps being an idea. Play ...Bb7 and ...d6 and note that White has to spend another move before e2–e4 is possible.",
             "line": "Bb7 Bg5 d6 Nd2 Nbd7"},
            {"san": "b4", "severity": "playable", "tier": "Mastery",
             "why": "Space on the queenside, and it hands the last of White's edge back because it leaves the pawns loose: 7...d5 8.e3 a5! and the b4-pawn has no pawn behind it — a3 has already moved and c4 is committed forward.",
             "line": "d5 e3 a5 b5 c5"},
            {"san": "f3", "severity": "playable", "tier": "Plans",
             "why": "The e4 plan without the bishop coming to g5 first. It is a third of a pawn slower and it commits White's kingside before the king has left the centre — 7...d5 8.e3 Ba6 and the pressure on c4 arrives before e3–e4 does.",
             "line": "d5 e3 Ba6 b4 c5"},
        ],

        # ── ply 19 · White's tenth, after ...d5 ─────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 f3 h6 Bh4 d5": [
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "Resolving the tension and the engine's own choice. After 10...exd5 you have three queenside pawns to White's two and a pawn on d5 that nothing can attack quickly — and, unlike the classic version of this structure, your b-pawn is already on b6, so White's a4 and b4 advance has no backward pawn on c6 to aim at. Play ...Re8, ...c6 and ...Nf8 and treat it as a good version.",
             "line": "exd5 e3 Re8 Bb5 c6"},
            {"san": "Nh3", "severity": "inaccuracy", "tier": "Mastery",
             "why": "The knight goes the long way round so the f-pawn keeps its square. It is a slow move in a position that has stopped being slow: 10...c5! and White has a queen on c3, a king on e1 and a knight on the rim while the centre opens. Half a pawn.",
             "line": "c5 e3 g5 Bg3 cxd4"},
            {"san": "e4", "severity": "inaccuracy", "tier": "Plans",
             "why": "The move the whole set-up was built for, played one move too soon. 10...dxe4! 11.Ne2 and White has to spend two more moves collecting the pawn while your knights come to d7 and e8 and your rook to the open e-file. The engine has you well over a pawn better — the pin on h4 does not compensate for a king still on e1.",
             "line": "dxe4 Ne2 Nbd7 O-O-O Re8"},
        ],

        # ══ SÄMISCH ═════════════════════════════════════════════════════════════

        # ── ply 8 · your own fourth against 4.a3 ────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3": [
            {"san": "Be7", "severity": "inaccuracy", "tier": "Foundation",
             "why": "Retreating rather than trading, and it hands White everything for nothing: White has a3 for free, no structural damage, and 5.e4 with the whole centre. A full pawn by the engine's count. The Sämisch is a bargain, and declining the bargain is the one thing that loses.",
             "line": "e4 d6 Nf3 c5 d5"},
            {"san": "Bd6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The active-looking retreat, and it is worse than ...Be7: 5.e4 Be7 6.e5 and the bishop has moved three times to reach the square it should have gone to in one, while a pawn kicks your knight off f6. Over two pawns. Take on c3.",
             "line": "e4 Be7 e5 Ng8 Nf3"},
            {"san": "Ba5", "severity": "blunder", "tier": "Foundation",
             "why": "The bishop is trapped. 5.b4! and the a5–d8 diagonal has exactly one square left on it, because your own pawn sits on c7 and your own queen on d8 — and the c-pawn takes b6 away the move after. 5...c5 6.bxa5 and White is a piece up for a pawn, which the engine scores at nearly five pawns. Learn this position once. After a3 the bishop takes on c3 or goes to e7, and a5 is not a square.",
             "line": "b4 c5 bxa5 cxd4 Qxd4"},
        ],

        # ── ply 10 · your own fifth · which blockade ────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3": [
            {"san": "b6", "severity": "playable", "tier": "Plans",
             "why": "The engine's own first choice, level with 5...c5: the bishop goes to a6 before the c-pawn commits, so the pressure on c4 arrives while White's bishop is still on f1. 6.f3 Nc6 7.e4 Na5 and the knight is hitting c4 before you have committed the c-pawn at all. A cleaner move order than the main line and a slightly slower game.",
             "line": "f3 Nc6 e4 Na5 c5"},
            {"san": "d5", "severity": "playable", "tier": "Structure",
             "why": "Blocking the centre with a pawn instead of blockading it with pieces. It costs about a quarter of a pawn and it changes the whole game: after 6.e3 O-O 7.cxd5 exd5 the c4-pawn is gone, so the target you traded a bishop for is gone with it. Play it only if you want a Queen's Gambit with White's pawns on a3 and c3.",
             "line": "e3 O-O cxd5 exd5 Bd3"},
            {"san": "d6", "severity": "playable", "tier": "Mastery",
             "why": "Keeping ...e5 rather than ...c5 as the break, and inviting the sharpest line in the variation: 6.e4 Nxe4 7.Qg4 f5 8.Qxg7 Qf6 and the engine calls it level. A real gambit and a real answer to it, and worth knowing before you play ...d6 by accident.",
             "line": "e4 Nxe4 Qg4 f5 Qxg7 Qf6"},
        ],

        # ── ply 11 · White's sixth ──────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5": [
            {"san": "f3", "severity": "playable", "tier": "Plans",
             "why": "The other main move, and the more ambitious one: White prepares e2–e4 with a pawn behind it so that the knight can go to e2 and then g3 or h3 without ever blocking anything. Same plan for you — ...d6, ...Nc6, ...b6 and ...Ba6 — with the extra note that a pawn on f3 costs White the f3 square for good.",
             "line": "d6 e4 Nc6 Ne2 b6"},
            {"san": "Nf3", "severity": "playable", "tier": "Structure",
             "why": "Development, at the price of the square: with a knight on f3 White's f-pawn cannot run and the e4 push needs more preparation. The engine is indifferent between this and 6.e3 — what changes is not the evaluation but the kind of game White is asking for.",
             "line": "O-O Qc2 d5 e3 Nbd7"},
            {"san": "d5", "severity": "inaccuracy", "tier": "Structure",
             "why": "Closing the centre while the pawns are still doubled, which fixes every weakness White has. The pawn on c4 can now never be defended by a pawn and never be traded off, and no white pawn attacks e5 until f2–f4 arrives. Half a pawn to you, and a position where your plan writes itself.",
             "line": "d6 f3 O-O e4 Nh5"},
        ],

        # ── ply 12 · your own sixth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 e3": [
            {"san": "b6", "severity": "playable", "tier": "Plans",
             "why": "The bishop first and the knight second, which is the same plan in the other order and a hair more accurate by the engine's count. ...Ba6 arrives before White's bishop reaches d3, so White has to answer the pressure on c4 with a piece that would rather be somewhere else.",
             "line": "Bd3 Bb7 f3 Nc6 Ne2"},
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "Castling first. Perfectly sound, a tenth of a pawn slow, and it gives White the option of 7.Nf3 followed by an early d5 push while your queenside pieces are still at home. The knight and the b-pawn are more urgent than the king here — nothing is attacking it.",
             "line": "Bd3 Nc6 Nf3 d5 O-O"},
            {"san": "d6", "severity": "playable", "tier": "Mastery",
             "why": "Preparing ...e5 rather than ...b6 and ...Ba6, which is the Hübner treatment of the Sämisch structure. It costs about a quarter of a pawn because it gives White the option of 7.Bd3 e5 8.e4 with a real centre, and it produces a completely locked position where the bishop pair may as well not exist.",
             "line": "Bd3 e5 e4 cxd4 cxd4"},
        ],

        # ── ply 15 · White's eighth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 e3 Nc6 Bd3 O-O": [
            {"san": "Nf3", "severity": "playable", "tier": "Structure",
             "why": "The natural square, and the engine likes it best — but it is not the Sämisch plan. With a knight on f3 the f-pawn is stuck, so White's attack has to come from pieces alone. Answer 8...d5 and open the position on your terms while the two bishops still have nothing to hit.",
             "line": "d5 O-O Qc7 a4 dxc4"},
            {"san": "e4", "severity": "playable", "tier": "Plans",
             "why": "Building the centre before developing the knight, and it lets you strike at once: 8...cxd4 9.cxd4 d5! and the centre comes apart while White's king is still on e1. The engine has you a third of a pawn better — this is the one moment in the variation where opening the position is right.",
             "line": "cxd4 cxd4 d5 exd5 exd5"},
            {"san": "f3", "severity": "inaccuracy", "tier": "Structure",
             "why": "The pawn goes to f3 before the knight goes to e2, which means the knight has nowhere good left. Half a pawn: 8...b6 9.e4 Ne8 and White's f4 push arrives with the knight still on g1 and the bishop on c1 walled in behind three pawns on the third rank.",
             "line": "b6 e4 Ne8 f4 Ba6"},
        ],

        # ── ply 17 · White's ninth ──────────────────────────────────────────────
        "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 e3 Nc6 Bd3 O-O Ne2 b6": [
            {"san": "O-O", "severity": "playable", "tier": "Foundation",
             "why": "King first, centre second, and the engine rates it a whisker ahead of 9.e4. Nothing changes for you: ...Ba6 hits c4 whether or not the pawn has reached e4, and if White ever plays f2–f4 the king on g1 is the reason it can.",
             "line": "Ba6 e4 Ne8 f4 f5"},
            {"san": "Ng3", "severity": "playable", "tier": "Structure",
             "why": "The knight heads for f5 or h5 before the centre is built. It costs about a quarter of a pawn because e4 now needs another move and c4 gets no extra defender: 9...d6 10.O-O Ba6 and the pressure on c4 arrives first.",
             "line": "d6 O-O Ba6 Re1 Rc8"},
            {"san": "f3", "severity": "inaccuracy", "tier": "Plans",
             "why": "Over-preparing. With the knight already on e2 the pawn on f3 does nothing that e4 would not do better, and it takes f3 away from White's own pieces for good. Well over half a pawn: 9...Ba6 10.e4 Ne8 and White has spent eleven moves to reach a position where every piece is behind a pawn.",
             "line": "Ba6 e4 Ne8 Ng3 cxd4"},
        ],

    },
    "progression": {
        "arc": "The Nimzo-Indian is the most respected defence to 1.d4 because it asks a question that has no clean answer. It rewards understanding over memory.",
        "stages": [
            {
                "tier": "Foundation",
                "when": "Weeks one to two",
                "goal": "Understand why 3...Bb4 is a good move at all.",
                "learn": [
                    "The pin on c3 stops e4. Black is not fighting for the centre with pawns but preventing White from occupying it.",
                    "White's four main replies: 4.e3 (Rubinstein), 4.Qc2 (Classical), 4.a3 (Sämisch), 4.f3 and 4.Nf3.",
                    "The move-order problem: after 1.d4 Nf6 2.c4 e6, White can play 3.Nf3 and you never get the Nimzo. Pick a second defence now.",
                ],
                "drill": "Prepare your answer to 3.Nf3 before your first Nimzo game — Queen's Indian (...b6), Bogo-Indian (...Bb4+) or Ragozin (...d5).",
                "mistake": "Trading on c3 automatically. Against 4.Qc2 White recaptures with the queen and there are no doubled pawns to attack.",
                "ready": "You have a complete answer to 3.Nf3 as well as to 3.Nc3.",
            },
            {
                "tier": "Structure",
                "when": "Months one to three",
                "goal": "Learn to play against doubled pawns — and to know when they are not weak.",
                "learn": [
                    "The Sämisch structure: White a3, c3, c4, d4 against your a7, b6, c5, e6. Blockade with ...Na5 and ...Ba6 and count the defenders of c4.",
                    "The rule that decides everything: doubled pawns are weak in a closed position and strong in an open one, because they support a big centre.",
                    "Your job after trading on c3: keep the position closed and trade pieces, never open lines for the bishops.",
                ],
                "drill": "Play ten Sämisch positions with the plan ...c5, ...b6, ...Ba6, ...Na5 and nothing else. See how often c4 simply drops.",
                "mistake": "Opening the centre after giving up the bishop pair. Every open file you create is a gift to White's two bishops.",
                "ready": "You can look at a doubled-pawn position and say whether they are a weakness or a strength.",
            },
            {
                "tier": "Plans",
                "when": "Months three to eight",
                "goal": "Master the three middlegame types the Nimzo produces.",
                "learn": [
                    "Type 1 — the isolated queen's pawn (from 4.e3 lines): blockade d5, trade minor pieces, win the endgame.",
                    "Type 2 — hanging pawns on c4 and d4: attack them with ...Rc8 and ...Na5 and force one to advance.",
                    "Type 3 — the blockade against doubled pawns: knight to d6, bishop to a6, and total control of the light squares.",
                ],
                "drill": "Take five of your Nimzo games and classify each middlegame into one of the three types. If you cannot, that is the study you need.",
                "mistake": "Playing all three types the same way. The plan comes from the structure, and the Nimzo produces three different ones.",
                "ready": "You name the structure type before you choose a move.",
            },
            {
                "tier": "Mastery",
                "when": "Ongoing",
                "goal": "Depth in your chosen branch plus the endgames.",
                "learn": [
                    "One deep line against 4.Qc2 — currently the critical test at every level.",
                    "The Ragozin and Vienna transpositions, which arise constantly from Nimzo move orders.",
                    "Bishop-versus-knight endgames. The Nimzo is a machine for producing them and they decide half your games.",
                ],
                "drill": "Study twenty Karpov or Kramnik games in the Nimzo, guessing every Black move. It is the best positional training available.",
                "mistake": "Neglecting endgame study. The Nimzo produces small, technical advantages — you need the technique to convert them.",
                "ready": "You can convert a one-pawn or good-knight-versus-bad-bishop endgame reliably.",
            },
        ],
        "study": "Aron Nimzowitsch invented it, Capablanca and Karpov perfected the positional treatment, and Kramnik and Caruana carry it today.",
        "next": "Pair it with the Queen's Indian or Ragozin so that 3.Nf3 does not take you out of preparation. Together they form a complete 1.d4 defence.",
    },
}

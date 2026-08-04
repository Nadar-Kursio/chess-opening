OPENING = {
    "id": "catalan",
    "name": "Catalan Opening",
    "eco": "E00–E09",
    "section": "indian",
    "orientation": "white",
    "tagline": "d4 and c4 plus a fianchettoed bishop. Positional pressure that lasts into the endgame.",
    "level": "Advanced → World Championship",
    "theory": {
        "big_idea": "White combines the Queen's Gambit pawns, d4 and c4, with a kingside fianchetto. Everything then turns on one square: d5. The bishop on g2 looks up the a8–h1 diagonal, and while a black pawn stands on d5 that is as far as it sees — the Closed Catalan is Black paying a little space and a lot of freedom to keep that pawn there. The moment Black plays ...dxc4 the square is empty and the diagonal runs to a8, which is why White is happy to be a pawn down for a few moves and why the pawn always comes back. One warning that most descriptions leave out: your own knight on f3 stands on the same diagonal. Until it moves the bishop is looking at the back of its own horse, and that is what makes Ne5 the move it is.",
        "structure": "White pawns on d4 and c4, the bishop on g2, and no queen's knight on c3 — it goes to d2 instead so it never blocks the c-file. Black chooses between taking on c4 (Open Catalan: material for time, and a queenside that has to be held with ...a6 and ...b5) and holding d5 with ...c6 and ...Nbd7 (Closed Catalan: no weaknesses, no space, and a bishop on c8 with nowhere to go). Against an early ...c5 the game becomes a fianchetto Benoni, where the same bishop does a completely different job: it stands behind the d5-pawn and defends it.",
        "white_plans": [
            "Recover the c4-pawn without hurrying. Qc2 and Qxc4 is the simplest route; Qa4+ and Ne5 are the other two, and Ne5 is special because it is the move that unblocks the bishop.",
            "a2–a4 against a black pawn on b5. Behind b5 there is only a6, so the trade on b5 leaves that pawn defended by pieces on a file that has just opened.",
            "In the Closed Catalan, e2–e4 and then e4–e5. That is what the knight on d2 was for, and the pawn on e5 takes f6 and d6 away from Black at the same time.",
            "Trade queens and grind. Nothing in the Catalan is decided by move twenty-five, and a bishop on g2 with the board opening up is the piece you want left.",
        ],
        "black_plans": [
            "Take on c4 and buy time with ...a6 and ...b5 — not to keep the pawn, which cannot be kept, but to make White spend moves getting it back.",
            "Plug the diagonal. ...c6 does it with a pawn and ...Bb7 followed by ...Be4 does it with a piece; the second one also offers a trade of the bishop White cares about most.",
            "The freeing breaks ...c5 and ...e5. Everything Black does in a Closed Catalan is preparation for one of them.",
            "Refuse the whole thing with 3...Bb4+ or 3...c5, and make White prove that the fianchetto was worth committing to.",
        ],
        "traps": [
            "After 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Bg2 Be7 5.Nf3 O-O 6.O-O dxc4 7.Qc2 a6 8.Qxc4 b5 9.Qc2, the natural 9...Nc6?? drops a piece to 10.Qxc6. Look at what Black's own pawns did: ...d5 and ...dxc4 took the d-pawn off d7 for good, and ...b5 took the other one off b7. The knight arrives on c6 with nothing defending it and a white queen already on the file.",
            "In the same position 9...Nbd7?? loses the exchange to 10.Ne5!, and it is the cleanest illustration of the whole opening. Moving the knight off f3 hands the bishop on g2 the squares e4, d5, c6, b7 and a8 in one go, and the rook on a8 is at the end of them: 10...Nxe5 11.Bxa8.",
            "White has a queen to lose too. After 9...Bb7 10.Bd2 Be4 the bishop attacks the queen on c2, and both natural blocks are catastrophic — 11.Nc3 Bxc2 and 11.Qd3 Bxd3 both hand over the queen. The move is 11.Qc1, sideways rather than forward.",
        ],
        "who": "Play this if you enjoy positions where you are never worse and never finished. Kramnik made it a world-championship weapon, Anand followed him, and Carlsen has used it as a main line since the late 2010s.",
    },
    "lines": [
        {
            "name": "Open Catalan — Main Line",
            "note": "Black takes on c4 and spends two moves making White work for it. The critical line, and the one every strong Catalan player has an opinion about.",
            "tier": "Foundation",
            "drill": True,
            "plan": {
                "structure": 'catalan-held-queenside',
                "tier": "Structure",
                "point": "Count the pawns before you believe anything anyone tells you about compensation: seven each, and they have been level since move eight. Nobody is a pawn down here. What Black bought with ...dxc4 was time, and what it cost was the pawn on b5 — the only pawn behind it is a6, and behind that, on the same file, a rook.",
                "next": [
                    "a2–a4 is the move the whole variation is built around. Play it once Bc3 or Nbd2 has been added: after axb5 axb5 the a-file is open, your rook is already on it, and Black's b-pawn is defended by pieces instead of by a pawn.",
                    "Chase the bishop off e4. Nbd2 and Bc3 both attack it or add to the d-file, and the retreat matters: on g6 it leaves the long diagonal altogether, and once the knight on f3 moves as well the bishop on g2 runs all the way to a8. On b7 it merely blocks the diagonal one square further along, which is why Black prefers that square.",
                    "There is no kingside attack in this position and you should not go looking for one. Black's king is behind three untouched pawns and you have no piece pointing at it.",
                ],
                "endgame": "This is a queenside endgame. If you win the b5-pawn, or force ...b4 and then win it, you are a pawn up in an endgame where Black's queenside — a6 and c7 — no longer outnumbers your a2 and b2. Queens off is an improvement almost every time — the bishop on g2 gets better as the board empties, and Black's on e7 does not.",
            },
            "moves": "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1",
            "notes": {
                4: "Preparing ...d5 and keeping the Nimzo-Indian in reserve — if White now plays 3.Nc3, Black has 3...Bb4.",
                5: "The Catalan move, and the reason to play it before Nc3 is the move it takes away: with the knight still on b1 there is no 3...Bb4 to pin, so the Nimzo-Indian never happens.",
                6: "Black takes the classical centre. This is much the most common reply and it is what the opening is named for.",
                7: "The bishop takes its post — and be exact about what it sees from here, because almost every description of this opening overstates it. Right now the diagonal runs g2–f3–e4–d5 and stops, because there is a black pawn on d5. The bishop is aimed at that pawn, not through it.",
                8: "Development, and Black's most flexible fourth move: the bishop breaks nothing and commits to nothing.",
                9: "Natural development — and it puts a white knight on f3, which is on the bishop's own diagonal. From here until the knight moves again, the bishop on g2 attacks f3, f1, h1 and h3 and nothing else.",
                10: "King safety.",
                11: "King safety, and now Black has the decision the whole opening is about: take on c4, or hold d5 and be cramped.",
                12: "The Open Catalan. Black is a pawn up for the moment — seven white pawns against eight — and the pawn cannot be kept. What it can do is cost White three or four moves, and that is the whole idea.",
                13: "The queen steps onto the c-file and looks straight at c4 with nothing in between. There is no hurry to take: 7.Ne5 and 7.Qa4 are both about as good, and 7.Qc2 is simply the one that keeps every option.",
                14: "Black prepares ...b5, the only way to give the c4-pawn a defender.",
                15: "One move too early for Black. The pawn on c4 is attacked once and defended not at all, so it comes back now and the material is level at seven pawns each.",
                16: "...b5 hits the queen on c4 and takes queenside space. It is also the move that will be the target for the next thirty moves, and Black knows it — the alternative is to have made no progress at all.",
                17: "The queen goes back to c2 rather than b3 or d3. From c2 it stands on the c-file and the b1–h7 diagonal at once, and — the practical reason — it is not on a square where a black minor piece can hit it with tempo.",
                18: "Black's bishop takes the long diagonal facing White's, and the only thing standing on it is White's knight on f3 — attacked once by the bishop, defended twice, and perfectly safe. Neither bishop can see past it.",
                19: "Bd2, a modest-looking move that does two real jobs: it puts the bishop on a diagonal where Bc3 and Ba5 both become available, and it empties c1 — which is the square the queen is about to need.",
                20: "The standard antidote, and it comes with a threat: the bishop on e4 attacks the queen on c2. It also plugs the diagonal with a piece rather than a pawn, and offers White the trade of the bishop the whole opening is named after.",
                21: "Sideways, and forced in the sense that the alternatives lose: 11.Nc3?? Bxc2 and 11.Qd3?? Bxd3 both give up the queen for a bishop. From c1 the queen still holds the c-file and now eyes the c1–h6 diagonal, and White carries on with a4, Nc3 and Nh4 to make the bishop on e4 say what it is doing.",
            },
        },
        {
            "name": "Closed Catalan",
            "note": "Black keeps the pawn on d5 and builds a wall with ...c6 and ...Nbd7. No weaknesses, no space, and a very long game.",
            "tier": "Structure",
            "drill": True,
            "plan": {
                "tier": "Plans",
                "point": "Seven pawns each, and they are not on the same wings. You have a 4-against-3 in the centre and on the kingside — e5, f2, g3, h2 against f7, g7, h7 — and Black has 3-against-2 on the queenside, a7, b6 and c6 against a2 and b2. The wedge on e5 is what you played e4 for: it takes f6 and d6 from Black's knights and it is defended by the pawn on d4.",
                "next": [
                    "Nf1–e3, hitting d5 and covering the light squares around your own king. The knight has been on d2 since move eight precisely so it could make this journey.",
                    "h4–h5 or f2–f4–f5, once the knight is on e3 and the rook on e1. Black's kingside is where the pawns point and Black has fewer pieces there than you do.",
                    "Watch for ...c5. It is Black's whole plan, it hits d4 which holds e5, and it also gives Black the passed-pawn chances on the queenside majority. Meet it with dxc5 and pressure on d5, not by ignoring it.",
                ],
                "endgame": "Be careful what you trade into. Black's queenside majority is the healthy one — three pawns against two, with no doubled pawn among them — so a pure pawn ending is a bad ending to head for. Your 4-against-3 includes the e5 wedge, which is a space advantage and not a passer. Keep enough pieces on to make the d5-pawn a target.",
            },
            "moves": "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2 b6 e4 Bb7 e5 Ne8 cxd5 exd5 Re1",
            "notes": {
                4: "Preparing ...d5. Against 3.Nc3 this would be the Nimzo-Indian move order; against 3.g3 it heads for a Catalan.",
                5: "The Catalan move, played before Nc3 so that ...Bb4 has nothing to pin.",
                6: "Black takes the classical centre and prepares to defend it with everything.",
                7: "The bishop is aimed at d5 and gets no further while a black pawn stands there. That pawn is what the next twenty moves are about.",
                8: "Development.",
                9: "Development — and the knight on f3 now stands on the bishop's diagonal, so for the moment the bishop is shut in by its own side as well as by Black's.",
                10: "King safety.",
                11: "King safety, and the crossroads: 6...dxc4 is the Open Catalan, this is where the Closed one starts.",
                12: "The Closed Catalan. Black declines the pawn and develops the knight to d7, where it supports both ...c5 and ...e5 and does not block the c-pawn.",
                13: "Qc2 supports a future e4 and adds the queen to the c-file. This is the ECO E08 tabiya and it is the most tested move here.",
                14: "The defining move. Black blocks the long diagonal with a pawn, and now nothing White does to the d5-pawn wins it — it is defended by the pawns on c6 and e6 and by the knight on f6, and the queen on d8 cannot help because Black's own knight stands on d7.",
                15: "The knight goes to d2 rather than c3, which is the single most characteristic Catalan detail. On c3 it would block the c-file the queen is using; on d2 it supports e4 now and reroutes through f1 to e3 later.",
                16: "Black prepares ...Bb7 or ...Ba6, which is the only way the c8-bishop ever gets a diagonal.",
                17: "The break the whole set-up was for. White takes the full centre while Black is still developing, and the engine agrees this is the move: the alternatives keep an edge of a fifth of a pawn, this one keeps twice that.",
                18: "Black develops behind the wall, and look at where the bishop ends up: on b7, aiming at d5 through its own pawn on c6. That is the Closed Catalan's price, and both sides pay a version of it. 9...Ba6 is the other try, hitting c4 down a diagonal that is actually clear.",
                19: "e5, with tempo — the knight on f6 is attacked and has to move, and every square it has is worse than the one it is on. This is the move that makes the whole plan worth playing, and playing it here rather than a quiet move like b3 is worth about two-thirds of a pawn.",
                20: "Black's knight goes backwards. On e8 it covers c7 and d6 and is ready to come to c7, but it has left the kingside, which is exactly where White is going.",
                21: "Resolving the tension on White's terms. Black must choose which pawn recaptures on d5, and both answers cost something.",
                22: "Taking towards the centre. It keeps the pawn on c6, which means the bishop on b7 stays shut in behind it — the price of the Closed Catalan, paid one last time.",
                23: "The rook comes to the file that is about to matter. Black is solid and has no weaknesses; what Black has instead is less room, a bishop on b7 that cannot see past its own pawn on c6, and a knight on e8 that needs three moves to be useful again.",
            },
        },
        {
            "name": "Fianchetto Benoni (3...c5)",
            "note": "Black refuses the Catalan and hits the centre at once. The game becomes a Benoni, and the fianchetto is one of White's best set-ups against it.",
            "tier": "Plans",
            "drill": True,
            "plan": {
                "tier": "Plans",
                "point": "A Benoni, and the count is the thing to know: your a4 and b2 against Black's a7, b7 and c5 means Black has the queenside majority, and your e2, f2, g3 and h2 against f7, g6 and h7 means you have the other one. Seven pawns each. And notice what the bishop on g2 is doing here — nothing like its Catalan job. Its diagonal ends on your own pawn on d5, so it is a defender of the spearhead and a guard on e4, not a raking piece.",
                "next": [
                    "Nd2–c4, hitting d6 and b6. The knight left f3 for exactly this. Black's c-pawn is on c5 and can never come back to attack it, and the b-pawn cannot reach b5 for free while your pawn stands on a4.",
                    "a4 is already in, and it is doing the most important defensive job in the position: without it ...b5 comes and Black's majority starts rolling with tempo. Follow with Ra3 or Rb1 and e2–e4.",
                    "Do not rush e4. The pawn lands on your own bishop's diagonal, and it gives Black something to hit with ...f5 — the standard Benoni counter-break, which is much less appealing for Black when there is nothing on e4 to aim at.",
                ],
                "endgame": "Benoni endgames are decided by which majority moves first. Black's three queenside pawns can produce a passer and yours cannot, so an endgame where Black is free to push ...b5 and ...c4 is a bad one. Keep a piece on c4 or a pawn on a4, and remember that the pawn on d5 needs a defender for the whole game — it is a space advantage and a target at the same time.",
            },
            "moves": "d4 Nf6 c4 e6 g3 c5 d5 exd5 cxd5 d6 Nc3 g6 Bg2 Bg7 Nf3 O-O O-O Re8 Nd2 Nbd7 a4",
            "notes": {
                4: "Black keeps the options open and has no intention of playing ...d5.",
                5: "The Catalan set-up. White fianchettoes before committing the queen's knight.",
                6: "Black hits the centre before a Catalan can happen. There is nothing wrong with it — it costs about a fifth of a pawn against 3...d5 — but it is a different game entirely.",
                7: "White pushes past. 4.Nf3 is the other move and leads to a Symmetrical English; 4.d5 is the one that plays for the space advantage.",
                8: "Black opens the e-file. 4...b5, the Blumenfeld idea, is the sharp try and it does not work here: 5.dxe6 fxe6 and Black's f-pawn is gone with the king still on e8, for less than a pawn's worth of centre.",
                9: "Now the structure is fixed for the rest of the game. White has no c-pawn and a spearhead on d5; Black has no e-pawn and the half-open e-file to use.",
                10: "Black takes the standard Benoni set-up, and this pawn is the one White's pieces will aim at all game.",
                11: "Development, and the knight belongs on c3 here rather than d2 — there is no c-file pressure to block, because White has no c-pawn.",
                12: "The Benoni fianchetto. Black's bishop is going to g7, where it will look down the other long diagonal at d4, c3 and b2 — the dark squares, which is a different fight from the one your bishop is in.",
                13: "The bishop takes the diagonal, and note what it is doing: the pawn on d5 is at the end of it. This bishop defends the spearhead and controls e4. In the Catalan proper it does the opposite job.",
                14: "Both bishops are fianchettoed now and they can never meet — yours works the light squares from g2, Black's the dark ones from g7. Black's points at d4 and b2 the moment the knight on f6 steps aside.",
                15: "Development.",
                16: "King safety.",
                17: "King safety.",
                18: "The rook takes the half-open file. This is Black's most testing ninth move — the engine likes it best of the five reasonable tries.",
                19: "The knight begins the journey the whole system is built on: d2, then c4, where it attacks d6 and b6. Only one black pawn can ever chase it from there — the b-pawn, via ...b5 — and White's next move is about that.",
                20: "Black develops the last knight, heading for e5 or c5 via the squares the position offers. 10...Na6 looks natural and costs almost a full pawn — the knight on a6 has no good follow-up once White plays Nc4.",
                21: "a4, and it is not a wing lunge — it is the move that stops ...b5. Black's queenside majority is the one that can make a passed pawn, and ...b5 is how it starts. Be honest about the evaluation: the engine calls this level, and it is. What White has is more space, a knight with an obvious square, and a plan that runs itself — while Black has to keep finding the accurate move.",
            },
        },
    ],
    "deep": {
        "name": "Deep dive — a4, and what the knight on f3 was in the way of",
        "note": "Twelve more moves, no tactics, and one pawn on b5 that gets harder to defend with every one of them. This is what a Catalan advantage actually looks like.",
        "tier": "Plans",
        "drill": True,
        "plan": {
            "structure": 'catalan-held-queenside',
            "tier": "Mastery",
            "point": "Six pawns each once Black recaptures — the knight on d5 is not a free piece — and the a-file is completely open, with both rooks on it and nothing else. Black's pawn on b5 is defended by exactly one thing, the pawn on c6, and the pawn on c6 is the last thing blocking the bishop on g2. Those are not two facts, they are one fact, and Black cannot fix either without giving up the other.",
            "next": [
                "17...cxd5 is the engine's choice and it dissolves the c6-pawn: the diagonal opens and b5 is suddenly defended by no pawn at all. 17...exd5 keeps c6 and costs about half a pawn instead. Neither is comfortable; that is the point of the trade.",
                "Bf3 next, hitting d5 and h5 at once from the square the knight vacated on move fourteen. Trading the light-squared bishops helps Black, so make Black pay a tempo for it.",
                "The rook on a1 is on an open file with only Black's rook to argue. Do not hurry it — the b5-pawn is not running anywhere and every piece you add to the queenside is one Black has to answer.",
            ],
            "endgame": "This is the endgame the whole opening plays for: level material, one weak pawn, and a bishop that gets better as pieces come off. The honest evaluation here is about a sixth of a pawn, which sounds like nothing and is not — Black has to find accurate moves for another twenty and White has to find natural ones. That asymmetry is the Catalan's entire value, and it is worth being clear that it is the only thing on offer.",
        },
        "moves": "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1 c6 a4 Nbd7 Nc3 Bg6 Nh4 Bh5 h3 Nd5 axb5 axb5 Nxd5",
        "notes": {
            22: "The main line, and the engine's first choice. Black spends a move giving b5 a pawn defender — and the same move puts a pawn on the long diagonal, so the bishop on g2 now has three things in front of it: its own knight on f3, Black's bishop on e4, and a pawn on c6.",
            23: "Ask the question anyway. Black has just committed to holding b5 with pawns, which is exactly when a4 is worth playing: whatever Black does about it costs something.",
            24: "Development, and there is only one square for it: the pawn on c6 has taken the knight's natural one, which is part of what 11...c6 costs.",
            25: "Three things at once: the knight on c3 attacks b5, d5 and the bishop on e4. It is also the move Black can go badly wrong against — 13...b4?? 14.Nxe4 Nxe4 15.Qxc6! and the queen hits the knight on e4 and the rook on a8 from the same square.",
            26: "Back it goes. Count the bishop's journey — c8, b7, e4, g6 — four moves, and from g6 it is not attacking a single white piece. White has spent none of those moves.",
            27: "The key move of the whole line, and it does two jobs. It attacks the bishop on g6, and it steps off f3 — so for the first time since move five the bishop on g2 is looking at e4, d5 and c6 rather than at the back of its own knight.",
            28: "The bishop steps to h5, the one retreat that keeps it aiming at something — from there it eyes the pawn on e2 and still has g4 to drop back to.",
            29: "Quiet, and it prepares g3–g4, hitting the bishop on h5. Every move Black spends keeping that bishop alive is a move not spent on ...c5, which is the only break Black has.",
            30: "Black centralises and offers trades, which is correct — with a piece under threat and less space, exchanges are what Black needs.",
            31: "Now, and the point is which recapture Black is left with. Taking with the a-pawn opens the file both rooks are already on; taking with the c-pawn would open the diagonal instead, which is worse.",
            32: "Recapturing with the a-pawn. The alternative 16...cxb5 costs about a pawn and a half, and the reason is the one that keeps coming back: the pawn on c6 was the last thing shutting the long diagonal, and taking with it opens the diagonal for free.",
            33: "The question, and both answers give something up. 17...cxd5 opens the diagonal and leaves b5 with no pawn defending it at all; 17...exd5 keeps the c6-pawn and hands White about half a pawn. Nothing is won here and nothing is going to be won for a long time — what White has is an open file, a better bishop, and a target that cannot move.",
        },
    },
    # Deviations, keyed by the position they answer rather than by a ply number.
    # This is a White repertoire, so nearly all of these are Black's replies; the
    # sets at White-to-move positions are the doors out of the repertoire and the
    # move-order questions that decide which defences you have to know.
    "branches": {

        # ── ply 1 · Black does not play 1...Nf6 ──────────────────────────────────
        "d4": [
            {"san": "d5", "severity": "playable", "tier": "Foundation",
             "name": "Queen's Gambit territory",
             "why": "The other great answer to 1.d4, and it does not stop you: 2.c4 e6 3.g3 is the same Catalan by a different door, because Black will almost always play ...Nf6 next. What it does change is that 2...c6 and 2...dxc4 are now available a move earlier, and neither of those is a Catalan.",
             "line": "c4 e6 Nc3 Nf6 cxd5",
             "see": "queensgambit"},
            {"san": "f5", "severity": "playable", "tier": "Structure",
             "name": "Dutch Defence",
             "why": "Black takes e4 with a wing pawn and opens a diagonal towards their own king to do it. There is nothing to punish — it costs about a quarter of a pawn — and the fianchetto you were going to play anyway is the main line against it. Play g3 and Bg2 and the bishop stares at the light squares Black has just given up.",
             "line": "g3 Nf6 Bg2 e6 c4"},
            {"san": "g6", "severity": "playable", "tier": "Structure",
             "name": "King's Indian and Grünfeld",
             "why": "Black fianchettoes first and decides between ...d6 and ...d5 afterwards. It is fully sound and it takes you out of Catalan structures entirely, because Black's bishop on g7 makes the a8–h1 diagonal a contested one rather than yours. Play 2.c4 and treat it as the King's Indian it usually becomes.",
             "line": "c4 Bg7 Nc3 d5 cxd5",
             "see": "kid"},
        ],

        # ── ply 2 · your own second move ─────────────────────────────────────────
        "d4 Nf6": [
            {"san": "Nf3", "severity": "playable", "tier": "Plans",
             "why": "Just as good, and it is the move order Kramnik used against Carlsen in the model game below. 2.Nf3 e6 3.c4 d5 4.g3 is the same position by transposition; what it costs is that 2...d5 3.c4 c6 heads for the Slav and 2...e6 3.c4 c5 for a Benoni or a Symmetrical English, both a move earlier than you wanted.",
             "line": "e6 c4 d5 g3 Be7"},
            {"san": "Bf4", "severity": "playable", "tier": "Foundation",
             "name": "London System",
             "why": "A different repertoire, not a mistake — the engine puts it a twentieth of a pawn behind 2.c4. The bishop comes out before the pawn on e3 shuts it in and White plays the same six moves against almost everything. If you want a system rather than a body of theory, this is the one.",
             "line": "e6 e3 d5 c3 c5",
             "see": "london"},
            {"san": "g3", "severity": "playable", "tier": "Plans",
             "why": "The fianchetto one move early, and it reaches the same place after 2...e6 3.c4 d5. The difference is what it allows in between: with the c-pawn still at home, Black gets 2...d5 3.Bg2 c5, hitting d4 before White has challenged d5 at all. Most Catalan players play c4 first for exactly that reason.",
             "line": "e6 c4 d5 Bg2 Be7"},
        ],

        # ── ply 3 · Black's second move — the whole Indian map ────────────────────
        "d4 Nf6 c4": [
            {"san": "g6", "severity": "playable", "tier": "Foundation",
             "name": "King's Indian and Grünfeld",
             "why": "Much the most common alternative to 2...e6, and the one Catalan players have to have an answer to, because there is no Catalan after it. Black's bishop is going to g7 and the long diagonal becomes a fight rather than a possession. You need a separate system: 3.Nc3 and 4.e4 for the King's Indian, or 3.Nf3 to avoid the Grünfeld.",
             "line": "Nc3 Bg7 e4 d6 Nf3",
             "see": "kid"},
            {"san": "e5", "severity": "playable", "tier": "Mastery",
             "name": "Budapest Gambit",
             "why": "A pawn for immediate activity, and it is sounder than its reputation — about a fifth of a pawn behind 2...e6. Take it: 3.dxe5 Ng4 4.e4 Nxe5 5.f4 chases the knight again and leaves White with the whole centre. What you must not do is try to hold the pawn with pieces.",
             "line": "dxe5 Ng4 e4 Nxe5 f4"},
            {"san": "c5", "severity": "playable", "tier": "Structure",
             "name": "Benoni move order",
             "why": "The same idea as the third-move version in the main line, one move earlier, and it lets you steer straight into the fianchetto Benoni: 3.d5 e6 4.Nc3 exd5 5.cxd5 and the third line here is on the board. Black can also play the Benko Gambit with 3...b5, which is a different animal and worth knowing separately.",
             "line": "d5 e6 Nc3 exd5 cxd5",
             "see": "catalan#benoni"},
        ],

        # ── ply 4 · your own third move — which defence you agree to face ─────────
        "d4 Nf6 c4 e6": [
            {"san": "Nc3", "severity": "playable", "tier": "Foundation",
             "name": "Nimzo-Indian move order",
             "why": "The most testing third move by the numbers, and the reason not to play it is 3...Bb4. That is the Nimzo-Indian, it is one of the best defences to 1.d4 there is, and it exists only because a knight went to c3. Choose 3.Nc3 if you would rather face the Nimzo than the Bogo-Indian and the Queen's Indian.",
             "line": "Bb4 Nf3 O-O Qc2 d5",
             "see": "nimzo"},
            {"san": "Nf3", "severity": "playable", "tier": "Plans",
             "why": "The other Catalan move order, and the one to know: 3.Nf3 d5 4.g3 is the same position, so this is about what happens in between. 3.Nf3 rules out the Nimzo and lets in 3...b6, the Queen's Indian, and 3...Bb4+, the Bogo-Indian. 3.g3 rules out the Nimzo too and lets in 3...c5 and 3...Bb4+. Pick by which of those you would rather study.",
             "line": "d5 g3 Be7 Bg2 O-O"},
            {"san": "Bg5", "severity": "playable", "tier": "Mastery",
             "name": "Neo-Indian Attack",
             "why": "Also called the Seirawan Attack. The bishop comes out before anything is pinned, and Black's simplest answer is to put the question at once: 3...h6 4.Bf4 Bb4+ and White has spent two moves on a bishop that is now on its third square. It is playable and it is a third of a pawn behind the main moves.",
             "line": "h6 Bf4 Bb4+ Nd2 c5"},
        ],

        # ── ply 5 · Black's third move — every door out of the Catalan ────────────
        "d4 Nf6 c4 e6 g3": [
            {"san": "d5", "severity": "playable", "tier": "Foundation",
             "name": "Catalan proper",
             "why": "The main move and the one the first two lines are about. Black takes the centre and the whole game becomes the question of whether that pawn stays on d5. Everything else on this list is Black declining to have that argument.",
             "line": "Bg2 Be7 Nf3 O-O O-O"},
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "name": "Fianchetto Benoni",
             "why": "The most common way of refusing a Catalan, and a good one — a fifth of a pawn, which is nothing. Black strikes at d4 before the fianchetto is finished. Answer 4.d5 and the game becomes a Benoni where your bishop has a different but perfectly good job. That is the third line here.",
             "line": "d5 exd5 cxd5 d6 Nc3",
             "see": "catalan#benoni"},
            {"san": "Bb4+", "severity": "playable", "tier": "Structure",
             "name": "Bogo-Catalan Defence",
             "why": "The check that sidesteps everything, and it costs Black almost nothing. Block with 4.Bd2 — not 4.Nc3, which turns the game into a Nimzo-Indian you did not choose, and not 4.Nbd2, which puts the knight on d2 before you know you want it there. After 4.Bd2 Black usually plays ...Be7 or ...a5 and you carry on with Bg2 and Nf3.",
             "line": "Bd2 a5 Nf3 O-O Bg2"},
            {"san": "b6", "severity": "playable", "tier": "Structure",
             "name": "Queen's Indian set-up",
             "why": "Black solves the problem bishop first and worries about the centre later. The point of 4.Bg2 here is that the two bishops end up on the same diagonal, and Black's is the one that will be looking at a black pawn on d5. A good practical answer is 4.Bg2 d5 5.cxd5 exd5, when Black's bishop on b7 is looking at their own pawn.",
             "line": "Bg2 d5 cxd5 exd5 Nc3"},
            {"san": "d6", "severity": "playable", "tier": "Mastery",
             "why": "A modest move that keeps ...e5 in reserve, and it costs about a third of a pawn — the most of anything on this list, because it does nothing about the centre. Play 4.Bg2 and 5.Nf3 and you will usually transpose back into a Catalan or a King's Indian anyway once Black commits.",
             "line": "Bg2 Be7 Nf3 O-O O-O"},
        ],

        # ── ply 6 · your own fourth move ─────────────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5": [
            {"san": "Nf3", "severity": "playable", "tier": "Plans",
             "why": "Identical by the numbers and it transposes almost always. The one difference worth knowing: with the bishop still on f1, 4...dxc4 can be met by 5.Qa4+ before Bg2 — the E02 line — and some players prefer to keep that option rather than commit the bishop first.",
             "line": "Be7 Bg2 O-O O-O dxc4"},
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "It resolves the tension and gives away the point of the opening: after 4...exd5 you have no c-pawn left to challenge d5, so the only lever against it is e2–e4 and until then the bishop on g2 is aimed at a pawn it cannot remove. It is not bad — under half a pawn — but you have played a Catalan and got an Exchange Queen's Gambit with the bishop on the wrong square.",
             "line": "exd5 Nc3 c6 Nf3 Be7"},
        ],

        # ── ply 7 · Black's fourth move ──────────────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2": [
            {"san": "dxc4", "severity": "playable", "tier": "Structure",
             "name": "Open Catalan, E04",
             "why": "Taking a move earlier than the main line, and the difference is real: Black has not played ...Be7 yet, so after 5.Nf3 the moves ...c5 and ...Nc6 are both available and the pawn is harder to recover in comfort. 5.Qa4+ is the other road, recovering the pawn at once at the cost of an early queen move.",
             "line": "Nf3 Nc6 Qa4 Bb4+ Bd2"},
            {"san": "c6", "severity": "playable", "tier": "Structure",
             "name": "Closed Catalan set-up",
             "why": "Black builds the wall before developing. It comes to the same thing as the second line here after 5.Nf3 Be7 6.O-O Nbd7, and it is worth noticing what has happened to your bishop: with pawns on d5 and c6 the diagonal is blocked twice over, which is exactly what Black wants and exactly why e2–e4 is the answer.",
             "line": "Nf3 Be7 O-O Nbd7 Nbd2"},
        ],

        # ── ply 9 · Black's fifth move ───────────────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3": [
            {"san": "dxc4", "severity": "playable", "tier": "Plans",
             "why": "Taking before castling, which lets White answer 6.Qa4+ — a genuine check here, because Black's d-pawn left d7 on move three and nothing else stands on the a4–e8 diagonal. After 6...Bd7 7.Qxc4 the pawn is back at once and Black's bishop is committed to d7 rather than b7. The cost to Black is a quarter of a pawn.",
             "line": "Qa4+ Bd7 Qxc4 Bc6 O-O"},
            {"san": "c6", "severity": "playable", "tier": "Structure",
             "why": "The Closed Catalan without ...Nbd7 first. It is solid and it commits Black's structure early, which gives you a free hand: 6.Nc3 is available because there is no ...dxc4 coming to punish the blocked c-file, and Qd3 with e2–e4 follows.",
             "line": "Nc3 Nbd7 Qd3 O-O O-O"},
        ],

        # ── ply 11 · the crossroads — Open or Closed ──────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O": [
            {"san": "dxc4", "severity": "playable", "tier": "Foundation",
             "name": "Open Catalan",
             "why": "The critical test and the engine's first choice. Black takes and White has to prove that the diagonal and the development are worth a pawn for a few moves. They are — but only if you recover the pawn without weakening anything, which is what the first line here is about.",
             "line": "Qc2 a6 a4 Bd7 Qxc4"},
            {"san": "Nbd7", "severity": "playable", "tier": "Foundation",
             "name": "Closed Catalan",
             "why": "Black declines and builds. It costs about a sixth of a pawn against 6...dxc4 and buys a position with no weaknesses at all — the price is that Black has less room and a bishop on c8 with no diagonal. This is the second line here, and the answer is e2–e4.",
             "line": "Qc2 c6 Nbd2 b6 e4"},
            {"san": "c6", "severity": "playable", "tier": "Structure",
             "why": "The same wall a move earlier, and it transposes to the Closed Catalan in almost every case. What it costs is flexibility: with ...c6 committed, Black can no longer meet Qc2 with ...dxc4 and ...c5 in one go.",
             "line": "Qc2 b6 Rd1 Nbd7 Nbd2"},
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "why": "The principled break, played before White is organised. Answer 7.dxc5 Bxc5 8.cxd5 exd5 and Black has an isolated pawn on d5 — the square your bishop is aimed at, though not yet: the knight on f3 is still in the way, and moving it is how you attack the pawn.",
             "line": "dxc5 Bxc5 cxd5 exd5 a3"},
            {"san": "b6", "severity": "playable", "tier": "Structure",
             "why": "The Queen's Indian treatment, and the answer is the one that comes up again and again in this opening: 7.cxd5 exd5 first. Now Black's bishop goes to b7 to look at a black pawn on d5, and yours is aimed at the same pawn from behind the knight on f3 — which is the knight that is going to move.",
             "line": "cxd5 exd5 Nc3 Bb7 Bf4"},
        ],

        # ── ply 12 · your own seventh — the four ways to get the pawn back ────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4": [
            {"san": "Ne5", "severity": "playable", "tier": "Plans",
             "why": "The most forcing recovery and the most instructive one. The knight attacks c4 and c6 at the same time — and, the part that matters more, it steps off f3 and hands the bishop on g2 the whole diagonal in one move. It is worth the same as 7.Qc2 to a tenth of a pawn; the difference is that this commits the knight and Qc2 does not.",
             "line": "Nc6 Bxc6 bxc6 Nxc6 Qe8"},
            {"san": "Qa4", "severity": "playable", "tier": "Plans",
             "why": "Also fine, and note that it is not a check here: Black castled two moves ago, so the a4–e8 diagonal ends on an empty square. From a4 the queen hits c4 and eyes the a4–e8 diagonal, and Black's usual answer is 7...a6 anyway, when you transpose back with 8.Qxc4.",
             "line": "a6 Qxc4 b5 Qc2 Bb7"},
            {"san": "a4", "severity": "playable", "tier": "Structure",
             "why": "The right idea at the wrong moment. Stopping ...b5 before it happens looks natural and it costs a fifth of a pawn, because Black answers 7...c5! and hits the centre while your queenside pawn is committed and your pieces are not. a4 is a very good move in this opening — three or four moves later.",
             "line": "c5 dxc5 Nbd7 Nfd2 Nxc5"},
            {"san": "Na3", "severity": "playable", "tier": "Mastery",
             "why": "The knight goes round the outside to reach c4. It is playable and it costs a fifth of a pawn, mostly because Black can simply take it: 7...Bxa3 8.bxa3 and White has the bishop pair and doubled a-pawns. If you want the knight on c4, the Closed Catalan route through d2 is the better road.",
             "line": "Bxa3 bxa3 Bd7 Ne5 Bc6"},
        ],

        # ── ply 13 · Black's seventh, after 7.Qc2 ────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2": [
            {"san": "b5", "severity": "playable", "tier": "Structure",
             "why": "Defending the pawn at once instead of preparing it with ...a6. It costs a little because a4 comes immediately: 8.a4 Bb7 9.axb5 a6 10.bxa6 Nxa6 and the material is level again — but Black is left with doubled c-pawns on c4 and c7, no a-pawn, no b-pawn and a knight on the rim.",
             "line": "a4 Bb7 axb5 a6 bxa6"},
            {"san": "Nc6", "severity": "playable", "tier": "Plans",
             "why": "Not a defence of c4 — a knight on c6 does not reach it — but a developing move that hits d4 and dares White to spend time. It costs about a third of a pawn: 8.Qxc4 Qd5 9.Qa4 and the queens shuffle while White stays a step ahead. Note that the knight is safe on c6 only while the pawn is still on b7, which is the whole trap two moves later.",
             "line": "Qxc4 Qd5 Qa4 Qh5 Nc3"},
            {"san": "Bd7", "severity": "playable", "tier": "Structure",
             "why": "The bishop steps out heading for c6 rather than b7 — on c6 it blocks the diagonal and has the pawn on b7 behind it as a defender. Perfectly sound. 8.Qxc4 Bc6 9.Nc3 and the game is about whether Black gets ...b5 and ...a6 in without loosening anything.",
             "line": "Qxc4 Bc6 Nc3 a6 Qd3"},
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "why": "The freeing break, played while a pawn up. 8.dxc5 Nc6 9.Qxc4 and the material is level with a completely open position — which favours the side with the fianchettoed bishop and the extra development. A fifth of a pawn, and a much sharper game than the main line.",
             "line": "dxc5 Nc6 Qxc4 Qd5 Qxd5"},
        ],

        # ── ply 14 · your own eighth ─────────────────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6": [
            {"san": "a4", "severity": "playable", "tier": "Plans",
             "why": "Stopping ...b5 rather than recovering the pawn, and it is the engine's own preference by a whisker. The pawn is not going anywhere — nothing defends c4 — so you can spend a move on the thing Black actually wanted. The cost is that a4 and b4 are now squares no pawn of yours will ever cover.",
             "line": "Bd7 Qxc4 Bc6 Bg5 Nbd7"},
            {"san": "Rd1", "severity": "playable", "tier": "Structure",
             "why": "Useful in itself and a move too slow here: 8...b5 and the pawn on c4 is defended, so recovering it now costs real time. Around four-tenths of a pawn. The rook belongs on d1 in this variation, just not before the pawn comes home.",
             "line": "b5 Ne5 Nd5 b3 cxb3"},
            {"san": "Bg5", "severity": "inaccuracy", "tier": "Structure",
             "why": "The pin looks natural and it is half a pawn worse than taking. Same reason as 8.Rd1: 8...b5 arrives and the c4-pawn now has a defender, so the recovery costs you a4, axb5 and a couple of tempi. In the Catalan the bishop on c1 is patient; the pawn is the thing with a deadline.",
             "line": "b5 Ne5 Ra7 a4 c6"},
        ],

        # ── ply 15 · Black's eighth, after 8.Qxc4 ────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4": [
            {"san": "Nc6", "severity": "inaccuracy", "tier": "Plans",
             "why": "Developing to the square that will shortly be a hole. It costs about half a pawn: 9.Rd1 Qd5 10.b3 and Black's queen is stuck watching d5 while White finishes developing. The knight is safe on c6 for the moment, defended by the pawn on b7 — it is the instant Black plays ...b5 that it becomes a loose piece, which is exactly what happens one move later in the main line.",
             "line": "Rd1 Qd5 b3 b5 Qc2"},
            {"san": "Bd7", "severity": "playable", "tier": "Structure",
             "why": "The bishop takes the other road, heading for b5 or c6. It is sound and it costs about a third of a pawn, because 9.Ne5 arrives with the knight hitting d7 and the bishop on g2 suddenly looking down the diagonal as far as the pawn on b7.",
             "line": "Ne5 Bb5 Qc2 Nc6 Nxc6"},
            {"san": "c5", "severity": "inaccuracy", "tier": "Plans",
             "why": "The break at the wrong moment, and it costs the best part of a pawn: 9.dxc5 Qd5 10.Nfd2! and White holds the extra pawn for a while with the queens still on. The break is right when the queen is not on c4 looking at the squares it opens.",
             "line": "dxc5 Qd5 Nfd2 Qxc5 Qxc5"},
        ],

        # ── ply 17 · Black's ninth — the two blunders that decide games ───────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2": [
            {"san": "Nc6", "severity": "blunder", "tier": "Foundation",
             "why": "It loses a piece to 10.Qxc6, and the reason is worth carrying into every game you play in this opening. Black's own pawn moves emptied both squares that would have defended c6: ...d5 and ...dxc4 took the d-pawn away for good, and ...b5 took the other one off b7. The knight arrives on c6 with no defender and a white queen already on the file.",
             "line": "Qxc6 Bd7 Qc2 Rc8 Qd3"},
            {"san": "Nbd7", "severity": "blunder", "tier": "Foundation",
             "why": "10.Ne5! and the exchange goes. This is the single clearest demonstration of what the Catalan bishop is for: the knight on f3 was the last thing standing on the a8–h1 diagonal, and the moment it moves the bishop on g2 sees e4, d5, c6, b7 and a8 — with a black rook standing on the end of it. 10...Nxe5 11.Bxa8 and White is the exchange up.",
             "line": "Ne5 Nxe5 Bxa8 Qxd4 Qxc7"},
            {"san": "Nd5", "severity": "inaccuracy", "tier": "Structure",
             "why": "Centralising into a pawn break. 10.e4! kicks it immediately, and the knight has nowhere good: 10...Nb4 11.Qd1 and Black has spent two moves on a knight that is about to spend a third. About a pawn's worth of nothing.",
             "line": "e4 Nb4 Qd1 Bb7 a3"},
            {"san": "Ra7", "severity": "playable", "tier": "Mastery",
             "why": "Odd-looking and completely serious: the rook steps off the long diagonal in advance, so Ne5 no longer comes with a threat behind it. It costs about four-tenths of a pawn and it is a known way of playing this. Answer 10.a4 and get on with the queenside.",
             "line": "a4 bxa4 Nc3 Bb7 e4"},
        ],

        # ── ply 18 · your own tenth ──────────────────────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7": [
            {"san": "Bf4", "severity": "playable", "tier": "Plans",
             "why": "Exactly as good as 10.Bd2 by the numbers. The bishop goes outside the pawn chain and hits c7, which means Black usually has to answer with ...Nc6 and ...Nb4. Pick it if you would rather have the bishop active than have it available for c3 and a5.",
             "line": "Nc6 Nc3 Nb4 Qd2 Rc8"},
            {"san": "Bg5", "severity": "playable", "tier": "Structure",
             "why": "The third square, and also fine. It pins nothing that matters yet but it prepares Bxf6, which takes away the knight covering h5, h7 and g8. 10...Nbd7 11.Bxf6 Nxf6 12.Nbd2 is the typical follow-up.",
             "line": "Nbd7 Bxf6 Nxf6 Nbd2 Rc8"},
            {"san": "a4", "severity": "playable", "tier": "Plans",
             "why": "The plan move, played a fraction early — about a fifth of a pawn. Black is not obliged to take: 10...Nbd7 11.Bg5 Rc8 and the a-file opens on Black's terms rather than yours. Develop the queenside pieces first and a4 costs nothing at all.",
             "line": "Nbd7 Bg5 Rc8 axb5 axb5"},
        ],

        # ── ply 19 · Black's tenth — where Anand and Carlsen went their own ways ──
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2": [
            {"san": "Ra7", "severity": "playable", "tier": "Plans",
             "name": "Anand's rook lift",
             "why": "Anand's choice against Kramnik at Wijk aan Zee in 2007, and it costs under a tenth of a pawn. The rook leaves the long diagonal and defends the second rank sideways, so Ne5 and Rc1 both lose some of their point. White answers 11.Rc1, and the game becomes a slow manoeuvring fight — Kramnik won it in fifty-three moves.",
             "line": "Rc1 Be4 Qb3 Nc6 e3"},
            {"san": "Nc6", "severity": "playable", "tier": "Foundation",
             "name": "Carlsen's knight",
             "why": "Now this is safe, because the bishop on b7 defends c6 — compare it with 9...Nc6, which simply loses a piece. Carlsen played it against Kramnik at Dortmund in 2007. It costs under a fifth of a pawn and the answer is 11.e3, when 11...Nb4 12.Bxb4 Bxb4 13.a3 makes Black spend two more moves on the bishop.",
             "line": "e3 Nb4 Bxb4 Bxb4 Rd1",
             "see": "catalan#kramnik-carlsen-2007"},
            {"san": "Nbd7", "severity": "playable", "tier": "Structure",
             "why": "Natural development, and it costs about a quarter of a pawn because it lets the bishop take a better diagonal with tempo: 11.Ba5! and the queen and c7 are both awkward. Black usually has to answer ...Rc8 and the knight on d7 has still not decided where it is going.",
             "line": "Ba5 Rc8 Nbd2 Nb6 Qd3"},
            {"san": "Bd6", "severity": "playable", "tier": "Mastery",
             "why": "The bishop takes the b8–h2 diagonal instead of waiting on e7, and it is playable — an eighth of a pawn. Kramnik met it with 11.Bg5, and after 11...Nbd7 12.Nbd2 White has every piece on a natural square while Black's bishop on d6 is aimed at the pawn on g3.",
             "line": "Bg5 Nbd7 Nbd2 Rc8 Bxf6"},
        ],

        # ── ply 20 · your own eleventh — two ways to lose the queen ───────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4": [
            {"san": "Nc3", "severity": "blunder", "tier": "Foundation",
             "why": "Blocking the attack on the queen with a piece that does not block it. The bishop on e4 hits the queen along e4–d3–c2, and a knight on c3 is on neither of those squares: 11...Bxc2 simply takes it. The rook White picks up on a8 afterwards does not come close — the engine puts the position near seven pawns for Black.",
             "line": "Bxc2 Ne1 Bg6 Bxa8 c5"},
            {"san": "Qd3", "severity": "blunder", "tier": "Foundation",
             "why": "Offering the queen a square the bishop already attacks. 11...Bxd3 12.exd3 and White has a bishop for a queen. It is the kind of move that gets played at speed because d3 looks like a developing square. The square is fine; the diagonal it sits on is not.",
             "line": "Bxd3 exd3 a5 a3 c6"},
            {"san": "Qb3", "severity": "inaccuracy", "tier": "Structure",
             "why": "Legal, and it costs about half a pawn. The queen is safe on b3, off the c-file, and looking down the a2–g8 diagonal into Black's own pawn on e6. Black gets in 11...c5 with a free hand: 12.dxc5 Nbd7 and the initiative has changed sides.",
             "line": "c5 dxc5 Nbd7 Rc1 Rc8"},
            {"san": "Qd1", "severity": "playable", "tier": "Plans",
             "why": "The other retreat, and it is only a quarter of a pawn behind 11.Qc1 — but notice what it gives up. From c1 the queen still controls the c-file, which is the file the whole opening is played on; from d1 it stands behind its own pawn on d4 and controls nothing extra.",
             "line": "c5 dxc5 Bxc5 Bg5 Nbd7"},
        ],

        # ── ply 26 · deep dive · Black's thirteenth, with the bishop attacked ─────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1 c6 a4 Nbd7 Nc3": [
            {"san": "b4", "severity": "blunder", "tier": "Structure",
             "why": "Pushing past the attack and losing a pawn and the position with it: 14.Nxe4 Nxe4 15.Qxc6! and from c6 the queen attacks the knight on e4 and the rook on a8 at the same time. Black gets the knight back and White is a clean pawn up with the diagonal open — the engine calls it three pawns' worth.",
             "line": "Nxe4 Nxe4 Qxc6 Nxd2 Nxd2"},
            {"san": "Qb6", "severity": "inaccuracy", "tier": "Plans",
             "why": "Defending b5 with the queen and leaving the bishop on e4 to its fate: 14.Nxe4 Nxe4 15.Be3 and Black has traded off the piece that was doing the blocking while White's structure is untouched. Just over two pawns' worth of drift, and it comes from answering the wrong half of the threat.",
             "line": "Nxe4 Nxe4 Be3 bxa4 Qc2"},
            {"san": "Bd5", "severity": "playable", "tier": "Mastery",
             "why": "The bishop steps to the other central square rather than retreating, and it is only a fifth of a pawn behind 13...Bg6. It does keep the diagonal plugged, which is the job — the cost is that 14.Qb1 and 15.Bf4 come with the bishop on d5 having nowhere better to go.",
             "line": "Qb1 Bb3 Bf4 Nd5 Nxd5"},
        ],

        # ── ply 13 · Closed Catalan, your own seventh (ECO E07 → E08) ─────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7": [
            {"san": "b3", "severity": "playable", "tier": "Plans",
             "why": "The quiet set-up: b3, Bb2 and Nbd2, aiming the second bishop down the long diagonal as well. It costs about a sixth of a pawn against 7.Qc2 and it gives up the fastest route to e2–e4, which is the break that makes the Closed Catalan worth playing.",
             "line": "b6 Bb2 Bb7 Nc3 Rc8"},
            {"san": "Nbd2", "severity": "playable", "tier": "Structure",
             "why": "The knight goes to its Catalan square first and the queen decides later. Equivalent to a sixth of a pawn, and the difference is small and real: the queen stays home for now, so Black's 7...b6 does not have to reckon with it raiding c6 down a file that a trade on d5 has just cleared — which is a genuine resource once the queen has gone to c2.",
             "line": "b6 b3 Bb7 cxd5 exd5"},
            {"san": "cxd5", "severity": "playable", "tier": "Structure",
             "why": "Releasing the tension and giving away most of the point. After 7...exd5 you have no c-pawn left to challenge d5, so your bishop is aimed at that pawn for the rest of the game with nothing to do about it. Under half a pawn, and a permanently duller game.",
             "line": "exd5 Nc3 c6 Bf4 Re8"},
        ],

        # ── ply 15 · Closed Catalan, Black's seventh ─────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2": [
            {"san": "c5", "severity": "playable", "tier": "Plans",
             "why": "The break at once, without ...c6 first. It is sound — a sixth of a pawn — and it changes the opening completely: 8.dxc5 Nxc5 and the position is open, which suits the bishop on g2. Black gets free pieces and gives up the wall.",
             "line": "dxc5 Nxc5 Nc3 b6 Rd1"},
            {"san": "dxc4", "severity": "playable", "tier": "Structure",
             "why": "Transposing to an Open Catalan a move behind: the knight is already committed to d7, where it does less than on c6 or b7's diagonal. 8.Qxc4 c5 9.Rd1 and White regains the pawn with the better structure. About a quarter of a pawn.",
             "line": "Qxc4 c5 Rd1 a6 Qc2"},
            {"san": "b6", "severity": "playable", "tier": "Mastery",
             "why": "Developing the bishop before the wall goes up, and the punishment is the one that recurs in this opening: 8.cxd5 Nxd5 9.a3 and Black's bishop reaches b7 to look at a knight on d5 that White can trade off whenever the moment suits. Just under half a pawn.",
             "line": "cxd5 Nxd5 a3 Bb7 e4"},
        ],

        # ── ply 17 · Closed Catalan, your own eighth ─────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6": [
            {"san": "Rd1", "severity": "playable", "tier": "Plans",
             "why": "Identical by the numbers, and a matter of taste: the rook is going to d1 anyway, so this keeps the knight's options open a move longer. The one thing to watch is that the knight still has to reach d2 rather than c3 — the c-file is the queen's.",
             "line": "b6 Nbd2 Bb7 e4 c5"},
            {"san": "Bf4", "severity": "playable", "tier": "Structure",
             "why": "The bishop outside the chain, hitting the b8–h2 diagonal before Black's pieces cover it. A tenth of a pawn behind 8.Nbd2 and perfectly playable; it does mean the e2–e4 break is a move or two further away.",
             "line": "b6 Rd1 Bb7 Ne5 Nh5"},
            {"san": "Nc3", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The one square this knight must not go to, and the reason is concrete rather than general: it stands between the queen on c2 and the pawn on c4, so after 8...dxc4 the recapture Qxc4 no longer exists. 9.a4 a5 and getting the pawn back costs several moves. Over half a pawn, and the mistake every new Catalan player makes.",
             "line": "dxc4 a4 a5 Rd1 Nd5"},
        ],

        # ── ply 19 · Closed Catalan, Black's eighth ──────────────────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2": [
            {"san": "b5", "severity": "inaccuracy", "tier": "Structure",
             "why": "Grabbing queenside space and locking the position on White's terms: 9.c5! and the pawn on b5 has nothing left to do. Black's queenside is frozen, the b8–h2 diagonal is White's, and the break Black needs — ...e5 — is now the only one left. Six-tenths of a pawn.",
             "line": "c5 Qc7 Nb3 a5 Bf4"},
            {"san": "a5", "severity": "playable", "tier": "Mastery",
             "why": "Taking b4 away from White's pieces and preparing ...Ba6. Also a tenth of a pawn, and it is a real system rather than a waiting move — Black wants to answer e4 with ...dxe4 and get the light-squared bishop into the game before the centre closes.",
             "line": "e4 dxe4 Nxe4 e5 Nxe5"},
        ],

        # ── ply 21 · Closed Catalan, your own ninth — the break ───────────────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2 b6": [
            {"san": "b3", "severity": "playable", "tier": "Structure",
             "why": "Shoring up c4 and preparing Bb2. It is sound and it costs about a fifth of a pawn against 9.e4, because it lets Black finish developing in peace: 9...Bb7 10.Bb2 c5 and the wall is dissolving on Black's terms rather than being blown up on yours.",
             "line": "Bb7 Bb2 c5 cxd5 Nxd5"},
            {"san": "cxd5", "severity": "inaccuracy", "tier": "Foundation",
             "why": "The wrong capture at the wrong time, and it costs the best part of a pawn. After 9...cxd5 there is no pawn on the c-file at all — it is open for both sides — and the piece standing on it is your queen, with a black rook due on c8. Take on d5 only when Black has to recapture with the e-pawn.",
             "line": "cxd5 e4 dxe4 Nxe4 Bb7"},
        ],

        # ── ply 23 · Closed Catalan, your own tenth — space or solidity ───────────
        "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2 b6 e4 Bb7": [
            {"san": "b3", "severity": "playable", "tier": "Structure",
             "why": "Defending c4 and settling for a small edge — about four-tenths of a pawn less than 10.e5. It is not a mistake, it is a different bargain: you keep the tension and Black gets 10...c5 with a fully playable game. If you played e4 in order to play e5, play e5.",
             "line": "c5 exd5 exd5 Bb2 Rc8"},
            {"san": "exd5", "severity": "inaccuracy", "tier": "Plans",
             "why": "Resolving in the centre and handing Black the position back. After 10...cxd5 Black's bishop on b7 finally has something to look at, the c-file is Black's, and the pawn on c4 needs watching. Three-quarters of a pawn, and the engine prefers Black's side of it.",
             "line": "cxd5 b3 Rc8 Bb2 Rc7"},
        ],

        # ── ply 6 · fianchetto Benoni, your own fourth ───────────────────────────
        "d4 Nf6 c4 e6 g3 c5": [
            {"san": "Nf3", "severity": "playable", "tier": "Plans",
             "why": "Declining to push and heading for a Symmetrical English instead: 4...cxd4 5.Nxd4 and the game is about the centre rather than about a pawn on d5. A sixth of a pawn, and a much quieter, less committal choice than 4.d5.",
             "line": "cxd4 Nxd4 d5 Bg2 e5"},
            {"san": "dxc5", "severity": "playable", "tier": "Structure",
             "why": "Taking the pawn and giving it back: 4...Bxc5 develops with tempo and Black has an easy game with no weaknesses. It costs about four-tenths of a pawn, and the reason is that White has traded a centre pawn for a wing pawn and gained nothing structural for it.",
             "line": "Bxc5 Bg2 O-O Nf3 d5"},
            {"san": "e3", "severity": "inaccuracy", "tier": "Structure",
             "why": "Propping up d4 with the pawn, which is the one thing the fianchetto set-up cannot afford — the bishop on g2 now has its own pawn chain in front of it as well as Black's. Over half a pawn: 4...cxd4 5.exd4 and White has an isolated pawn and a bishop with no diagonal.",
             "line": "cxd4 exd4 d5 Nf3 dxc4"},
        ],

        # ── ply 7 · fianchetto Benoni, Black's fourth ────────────────────────────
        "d4 Nf6 c4 e6 g3 c5 d5": [
            {"san": "d6", "severity": "playable", "tier": "Plans",
             "why": "Keeping the tension and reaching the same structure by a different road — the engine cannot separate it from 4...exd5. Black waits to see whether White commits the knight to c3 before deciding to open the e-file.",
             "line": "Nc3 g6 Bg2 exd5 cxd5"},
            {"san": "b5", "severity": "inaccuracy", "tier": "Mastery",
             "why": "The Blumenfeld idea, offering a wing pawn for the centre, and here it does not work: 5.dxe6! fxe6 and Black's f-pawn is gone with the king still on e8, in return for a pawn White can hand back whenever it suits. Almost a full pawn, and the cleanest answer is the simplest capture.",
             "line": "dxe6 fxe6 Bg2 d5 cxd5"},
        ],

        # ── ply 9 · fianchetto Benoni, Black's fifth ─────────────────────────────
        "d4 Nf6 c4 e6 g3 c5 d5 exd5 cxd5": [
            {"san": "g6", "severity": "playable", "tier": "Foundation",
             "why": "The same set-up in a different order, and the engine's own preference by a whisker. It transposes into the main line after ...d6, and it keeps the option of meeting an early e4 with ...Bg7 already in place.",
             "line": "Bg2 d6 a4 Bg7 Nf3"},
            {"san": "b5", "severity": "playable", "tier": "Mastery",
             "why": "The Benko idea inside a Benoni: a pawn for the a- and b-files. It costs about a third of a pawn here, which is less than you might expect, and White's cleanest answer is 6.e4, taking the centre while Black is still on the wing.",
             "line": "e4 Nxe4 Bg2 Nd6 Nf3"},
        ],

        # ── ply 11 · fianchetto Benoni, Black's sixth ────────────────────────────
        "d4 Nf6 c4 e6 g3 c5 d5 exd5 cxd5 d6 Nc3": [
            {"san": "Be7", "severity": "playable", "tier": "Structure",
             "why": "Developing without the fianchetto, which costs about a quarter of a pawn. The bishop on e7 does nothing about d4 and nothing about the long diagonal, so White gets a free hand in the centre: 7.e4 O-O 8.Nf3 and the pawn duo rolls.",
             "line": "e4 O-O Nf3 a6 a4"},
            {"san": "Bf5", "severity": "inaccuracy", "tier": "Plans",
             "why": "Developing the problem bishop to the square that looks best and is not available. 7.e4! hits it at once, and every active retreat is a second target — 7...Bg4 8.f3 and 7...Bg6 8.h4 both chase it again, so it goes back to c8 having achieved nothing. Over a pawn for two wasted moves.",
             "line": "e4 Bc8 f4 Be7 Nf3"},
        ],

        # ── ply 17 · fianchetto Benoni, Black's ninth ────────────────────────────
        "d4 Nf6 c4 e6 g3 c5 d5 exd5 cxd5 d6 Nc3 g6 Bg2 Bg7 Nf3 O-O O-O": [
            {"san": "Na6", "severity": "playable", "tier": "Structure",
             "why": "The knight heads for c7 and b5, or for c5 once ...a6 and ...Rb8 are in. A quarter of a pawn behind 9...Re8, and the reason is that the rook move is more useful more often — the e-file is the one Black opened on move four.",
             "line": "Re1 Re8 Nd2 Nc7 a4"},
            {"san": "Nbd7", "severity": "playable", "tier": "Plans",
             "why": "The other knight square, aiming at e5 and c5. It is fine — a quarter of a pawn — and it does commit the knight: from d7 it gives up the a6 and c7 route, which is the one that supports ...b5, and White's a4 and a5 gain in value.",
             "line": "Bf4 Qe7 a4 a6 h3"},
            {"san": "Bg4", "severity": "inaccuracy", "tier": "Structure",
             "why": "Pinning a knight that is happy to be pinned. 10.Nd2! steps out of it and heads for c4, and the bishop on g4 is left hitting nothing at all — it has to spend another move going to h3 or coming back. Just under a pawn, and it is the most common way to spoil a good Benoni position.",
             "line": "Nd2 Qd7 a4 Bh3 Nc4"},
        ],

        # ── ply 19 · fianchetto Benoni, Black's tenth ────────────────────────────
        "d4 Nf6 c4 e6 g3 c5 d5 exd5 cxd5 d6 Nc3 g6 Bg2 Bg7 Nf3 O-O O-O Re8 Nd2": [
            {"san": "a6", "severity": "playable", "tier": "Plans",
             "why": "The most accurate move in the position — it prepares ...Rb8 and ...b5, which is Black's whole plan, and it does it before White's a4 arrives. Play a4 in reply and the game is level: Black has the queenside majority, you have the space, and neither is going anywhere fast.",
             "line": "a4 Nbd7 e4 Rb8 Nc4"},
            {"san": "Na6", "severity": "inaccuracy", "tier": "Structure",
             "why": "The knight goes to the rim just as White's knight is arriving on c4, and the two facts do not fit together: 11.Nc4 and Black's knight on a6 has no route anywhere useful while d6 needs defending. Eight-tenths of a pawn — the biggest single mistake available in this structure.",
             "line": "Nc4 Bf8 Bf4 Nh5 Bd2"},
            {"san": "Nfd7", "severity": "inaccuracy", "tier": "Mastery",
             "why": "Making room for ...f5, which is a real Benoni plan and the wrong one here — the knight leaves f6 while b5 is still weak. 11.Nb5! hits d6 straight away and Black has to give something up: 11...Ne5 12.f4 and the knight is chased again. Nearly nine-tenths of a pawn.",
             "line": "Nb5 Ne5 f4 a6 Nxd6"},
        ],

    },
    "games": [
        {
            "id": 'kramnik-carlsen-2007',
            "name": "Kramnik – Carlsen, Dortmund 2007 — the main line, and one quiet mistake",
            "tier": 'Structure',
            "note": "Ten moves of the first line here, then Carlsen chose 10...Nc6 instead of 10...Be4. Nothing dramatic happens for fifteen moves; then the b5-pawn falls on move twenty-five and the game is over five moves later. This is what the Catalan looks like when it works.",
            "moves": (
                'Nf3 Nf6 c4 e6 g3 d5 d4 Be7 Bg2 O-O O-O dxc4 Qc2 a6 Qxc4 b5 '
                'Qc2 Bb7 Bd2 Nc6 e3 Nb4 Bxb4 Bxb4 a3 Be7 Nbd2 Rc8 b4 a5 Ne5 Nd5 '
                'Nb3 axb4 Na5 Ba8 Nac6 Bxc6 Nxc6 Qd7 Bxd5 exd5 axb4 Rfe8 Ra5 Bf8 '
                'Ne5 Qe6 Rxb5 Rb8 Rxb8 Rxb8 Qxc7 Bd6 Qa5 Bxb4 Rb1 Qd6 Qa4'
            ),
            "notes": {
                7: "d4, on move four. Kramnik reached the Catalan through 1.Nf3 and 2.c4 for most of his career, and this is why it is worth knowing the move order — the position after 6.O-O is the same one the first line here reaches, and several of Black's early tries never get a chance.",
                12: "6...dxc4 and we are in the main line: the Open Catalan, with White a pawn down and Black about to spend three moves keeping it that way.",
                20: "10...Nc6, and this is the move to look at twice. It is fine here and it loses a piece one move earlier — the difference is the bishop on b7, which is the only thing defending c6. With that bishop still on c8, 9...Nc6 10.Qxc6 simply wins it.",
                22: "11...Nb4 attacks the queen on c2 and forces the trade of White's dark-squared bishop. Black is not worse: the engine has the position at a quarter of a pawn, which is the normal Catalan number.",
                29: "15.b4, fixing a target. The pawn on b5 is now blocked by a white pawn on b4 and can never advance again, and a3–a4 is one move away from hitting it. Black's queenside pawns are frozen where they stand.",
                31: "16.Ne5, and look at what moving the knight does — the bishop on g2 now attacks b7, d5 and e4 down a diagonal that has been shut by White's own knight ever since the bishop arrived on it. This is the move the whole opening is built around, and Black should answer 16...Bxg2 at once.",
                32: "16...Nd5? The mistake, and it is completely quiet. Before it the engine has the game dead level; after it White is better by a pawn and a quarter. Carlsen left the bishop on b7 to be traded on White's terms instead of his own.",
                33: "17.Nb3, and the knight starts a four-move journey — b3, a5, c6 — to the square Black's pawns can no longer reach: attacking c6 needs a pawn on b7 or d7, and Black's d-pawn came off on move six while the b-pawn is already past it on b5.",
                37: "19.Nac6, the destination. Both knights have converged on the hole that ...dxc4 and ...b5 created twelve moves ago.",
                41: "21.Bxd5 exd5, and Kramnik gives up the famous bishop without hesitating. It was the right moment: the knight on d5 was Black's best-placed piece, and four moves after it goes the b5-pawn goes with it.",
                49: "25.Rxb5. There is the pawn — played on move eight, taken on move twenty-five. Seventeen moves of pressure to win one pawn, and that is the honest description of what this opening does.",
                53: "27.Qxc7 takes the second one, and now it is technique.",
                59: "30.Qa4, and Carlsen resigned. A clean pawn up, five against four, with the a-, b- and c-files all open; the engine has it past five pawns. The plan that won it was chosen on move fifteen.",
            },
        },
        {
            "id": 'carlsen-mamedyarov-2022',
            "name": "Carlsen – Mamedyarov, Wijk aan Zee 2022 — can Black keep the pawn?",
            "tier": 'Plans',
            "note": "Black takes on c4 and does everything possible to hold it — ...a5, ...b5, the rook to a6 and b6. The pawn survives for twenty moves and Black loses anyway, because the moves spent holding it were moves not spent on the centre.",
            "moves": (
                'd4 Nf6 Nf3 d5 c4 e6 g3 dxc4 Bg2 Bb4+ Bd2 a5 O-O O-O e3 Ra6 '
                'Qc2 b5 a4 c6 Nc3 Rb6 e4 Be7 e5 Nd5 axb5 cxb5 Nxd5 exd5 Bxa5 Nc6 '
                'Bxb6 Qxb6 Ra8 h6 Rfa1 Be6 Qd1 b4 b3 c3 R8a6 Qc7 Ne1 f6 Nd3 fxe5 '
                'Nxe5 Nxe5 Rxe6 c2 Qe1'
            ),
            "notes": {
                8: "4...dxc4, taking before ...Be7 — the deviation this game is about. Black intends to hold it properly rather than give it back.",
                12: "6...a5. Now the whole game has one question in it: can the pawn on c4 be kept? The answer takes twenty moves to arrive and it is no.",
                16: "8...Ra6, the rook out sideways to hold the queenside from the third rank. It is a genuine idea and it is also a rook that has stopped doing anything a rook does.",
                18: "9...b5, and the chain is built: c4 defended by b5, a5 defended by the rook that came to a6 last move — and b5 itself defended by nothing at all, which is what White's next move is about. Count the black pawns: a5, b5, c4, c7, e6, f7, g7, h7, and three of the eight are propping up one extra pawn.",
                19: "10.a4! and it does not win the pawn. The engine has this position level, and that is worth being honest about: a4 is not a refutation, it is a way of making Black keep answering questions on the wing while White builds in the centre.",
                23: "12.e4. Here is the payment. Black's rook is on b6, the queen is on d8 and the queenside is full of pawns that need watching — so the centre is where Black is short of pieces, and that is where White breaks.",
                25: "13.e5 gains space with tempo. The knight has six squares and only one that does anything — d5 — and it is a square White can trade on whenever it suits.",
                27: "14.axb5 cxb5 15.Nxd5 exd5 — the clearing trades. Now count again: Black is holding a5, b5, c4 and d5, four pawns on four files, and a5 at the bottom of it is defended by nothing while White's rook and bishop both bear on it.",
                31: "16.Bxa5! The first pawn falls, and the bishop lands on a square where it also attacks the rook on b6.",
                33: "17.Bxb6 Qxb6, and White is the exchange up with the pawns level at six each. Everything from here is Black trying to make the far-advanced c-pawn matter — and it is not a passed pawn: White's b2-pawn covers c3.",
                40: "20...b4 and 21...c3 — the pawn Black spent the whole opening defending finally runs, and it runs into a position where both white rooks are already on the open a-file.",
                46: "23...f6, breaking up the e5-pawn because there is nothing else left to try.",
                51: "26.Rxe6 takes the bishop, and White is the exchange ahead with the black king open.",
                53: "27.Qe1, and Mamedyarov resigned. The pawn on c2 is one square from a queen and it will never take that square: c1 is covered twice, by the rook on a1 and by the queen that has just arrived on e1. No white piece has to touch the pawn — it simply stands there for the rest of the game.",
            },
        },
    ],
    "progression": {
        "arc": "The Catalan is a long game. You accept a tiny edge on move ten and you are still pressing on move sixty. It rewards patience more than any other opening in this course.",
        "stages": [
            {
                "tier": "Foundation",
                "when": "Weeks one to three",
                "goal": "Get the set-up right and know how the c4-pawn comes back.",
                "learn": [
                    "The seven moves: d4, c4, g3, Bg2, Nf3, O-O, and the queen's knight to d2 rather than c3.",
                    "The three ways to recover the pawn after ...dxc4 — Qc2 and Qxc4, Qa4+, and Ne5 — and why Ne5 is different from the other two.",
                    "Why g3 comes before Nc3: with no knight on c3 there is nothing for ...Bb4 to pin, so the Nimzo-Indian never appears.",
                ],
                "drill": "Play ten games where Black takes on c4 and hold yourself to recovering it within six moves without weakening anything.",
                "mistake": "Chasing the pawn at once with a4 and Na3. Development and the diagonal are worth more than the pawn for four or five moves.",
                "ready": "You are comfortable being a pawn down for five moves and you know exactly when it comes back.",
            },
            {
                "tier": "Structure",
                "when": "Months one to two",
                "goal": "Understand what the g2-bishop is actually doing — including when it is doing nothing.",
                "learn": [
                    "The a8–h1 diagonal and the three things that block it: a black pawn on d5, a black pawn on c6, and your own knight on f3.",
                    "Open Catalan against Closed Catalan. In one the diagonal is open and Black's queenside is loose; in the other neither is true and you play e4 instead.",
                    "The fianchetto Benoni, where the same bishop defends your own d5-pawn and never rakes anything.",
                ],
                "drill": "Set up the Closed Catalan and play only for e4 and e5. Ten games. Notice how much of the position changes on the move the wedge lands.",
                "mistake": "Believing the bishop is doing work it is not. If d5, c6 and f3 are all occupied, you have a fianchettoed bishop and no Catalan.",
                "ready": "You can look at any Catalan position and say in one sentence what is on the diagonal.",
            },
            {
                "tier": "Plans",
                "when": "Months two to six",
                "goal": "Learn the squeeze.",
                "learn": [
                    "a4 against a pawn on b5: what the trade opens, and why Black's ...bxa4 and ...b4 both concede something.",
                    "Nbd2–b3 or –e5, and Bd2–c3 or –a5. The pieces have two or three squares each and the right one depends on where Black's bishop went.",
                    "The queen trade. A bishop on g2 in an endgame with open queenside files is a better piece than anything Black has left.",
                ],
                "drill": "Take twenty of Kramnik's Catalans and note the move on which he first plays a4. It is almost always earlier than you expect.",
                "mistake": "Looking for a kingside attack. Black's king sits behind three unmoved pawns and you have nothing pointing at it.",
                "ready": "You have converted a Catalan endgame where your only advantage was the bishop and one weak pawn.",
            },
            {
                "tier": "Mastery",
                "when": "Ongoing",
                "goal": "Handle everything Black plays to avoid it.",
                "learn": [
                    "3...c5 into the fianchetto Benoni, and 3...Bb4+ — the Bogo-Catalan — which sidesteps the whole thing with a check.",
                    "The move-order question: 3.g3 against 3.Nf3, and which of the Nimzo-Indian, Bogo-Indian and Queen's Indian each of them allows.",
                    "Open Catalan theory with ...a6 and ...b5. This is the main line and it goes twenty-five moves deep in places.",
                ],
                "drill": "Prepare an answer to 3...c5 and 3...Bb4+ before you play the Catalan in a serious game. They are much the two most common ways out.",
                "mistake": "Playing g3 without knowing why you chose it over 3.Nf3 or 3.Nc3. Each of the three allows a different defence and forbids another.",
                "ready": "Every Black third move has a prepared answer and you can say what each one gives up.",
            },
        ],
        "study": "Tartakower invented it at Barcelona in 1929 at the organisers' request. Kramnik made it a world-championship weapon — three of his games against Topalov in the 2006 match were Catalans, and he won two of them; Anand did the same to the same opponent in 2010, three games and two wins. Carlsen opened with it in game two of the 2021 match.",
        "next": "Pair it with the Queen's Gambit. The pawns are the same and the piece play is the opposite, so between them you have an answer to almost every 1.d4 defence.",
    },
}

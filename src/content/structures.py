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
            "fourknights — the Metger reaches this centre with an extra pawn on c2 after ...Bxc3 bxc3. Same duo, same plans, one more pawn to explain: it has its own card.",
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
            "scotch — no Scotch line reaches the duo at all, because the d-pawn is traded on move three. The Göring Gambit reaches the other half of this card: e4 against ...d6 with the c-file half-open and nothing on d4.",
            "italian — the Pianissimo reaches it whenever Black answers the delayed d4 with ...exd4 and White recaptures with the c-pawn.",
        ],
    },

    {
        "id": "carlsbad",
        "name": "The Carlsbad — two queenside pawns against three",
        "tier": "Structure",
        "taxonomy": "A named chapter in Flores Rios (Chess Structures) and in Soltis, and one of the few structures in this course named after a tournament rather than a variation. The Exchange QGD is where it is easiest to learn; the Nimzo Rubinstein and the Semi-Slav exchange reach the identical pawns. The Exchange Slav looks like it belongs here and does not — there Black recaptures on d5 with the c-pawn and both sides keep two queenside pawns, which is a different game entirely.",
        "fen": "r1bqrnk1/pp2bppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/1R3RK1 b - - 10 11",
        "white_plans": [
            "The minority attack: a4, b4, b5 and bxc6. Two pawns marching at three sounds wrong until you see what it leaves behind — a black pawn on c6 that no pawn can ever defend, on a file your rooks already own.",
            "It is a two-for-two trade, not a way of winning a pawn. What you are buying is the target, so do not start it until Rb1, a4 and b4 are all ready and ...a5 has been dealt with.",
            "The other plan is f3 and e3–e4, and it is why the knight goes to e2 rather than f3 — from e2 it supports the break instead of standing in front of it. Pick one plan; the two do not mix.",
            "Once c6 is fixed, Na4–c5 and Rc1. A knight on c5 is worth more than the pawn on c6 you are attacking.",
        ],
        "black_plans": [
            "Attack on the kingside, where your own pawns point: ...Ne4, ...Ng6, ...f5. You are faster than White because White's pawns are committed to the other wing.",
            "...a5 stops b4 before it starts. One move, and White's whole queenside plan needs rebuilding.",
            "...Ne4 and ...Nxc3 bxc3 is the cleanest antidote of all — White's b-pawn lands on c3, and a minority attack needs a b-pawn.",
            "Do not take on c6 with a piece if the pawn can do it: which pawn recaptures decides whether you have a weakness or a wall.",
        ],
        "key_squares": ["c6", "c5", "e4", "e5", "the c-file"],
        "pawn_breaks": ["White: b4–b5 (the minority attack), and e3–e4 after f3",
                        "Black: ...c6–c5 to dissolve the target, ...f7–f5 and ...e6–e5 on the other wing"],
        "pitfalls": [
            "Starting b4–b5 with the rooks still at home. The pawns are not the attack; the file they open is.",
            "As Black, meeting b5 with ...cxb5. That hands over the very structure you were defending and opens the c-file for free — the whole point of ...a5 is that you never face the question.",
            "Treating a backward pawn as a won pawn. c6 is a target for the rest of the game, and targets are how you win a middlegame, not a way of being a pawn up.",
        ],
        "endgame_note": "The side that owns c6 owns the endgame — which cuts both ways: if Black gets ...c5 in under decent circumstances the structure is symmetrical again and the whole plan has bought nothing. So White should be counting the defenders of c6 and Black should be counting the moves to ...c5.",
        "also_in": [
            "carokann — the Exchange Caro-Kann is this card with the colours swapped: White keeps three queenside pawns and Black two, so it is Black who has the minority and Black who plays the attack. Every plan here works, with the sides exchanged.",
            "nimzo — the Rubinstein with ...d5 and cxd5 exd5 lands here whenever White trades on d5 rather than pushing.",
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
            "...Rc8 and ...Rd8, pressing on both files at once. The blockading bishop goes to e6 only when the e-file is clear — and it usually is not: every line in this course that reaches this structure still has a black pawn on e6, so the bishop belongs on b7 after ...b6, or on g4 to trade off the knight that defends d4.",
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
            "italian — the Giuoco Piano main line 5.d4 exd4 6.cxd4 Bb4+ 7.Bd2 Bxd2+ 8.Nbxd2 d5 9.exd5 Nxd5 reaches it as a deviation rather than as a line of its own.",
            "scotch — the Göring and the 4.Nxd4 lines transpose here whenever Black answers the centre with ...d5 and White recaptures with a piece.",
        ],
    },

    {
        "id": "crippled-majority",
        "name": "The crippled majority (4-against-3 healthy against 4-against-3 doubled)",
        "tier": "Structure",
        "taxonomy": "No chapter in Flores Rios or Soltis — both taxonomies are built around 1.d4 structures. The old name for it is the crippled queenside majority, and the Spanish Exchange is where it is easiest to learn: one side's four pawns can make a passer, the other side's four cannot.",
        "fen": "r1b1k1nr/1pp3pp/p2b1p2/2p5/4P3/1N6/PPP2PPP/RNBR2K1 w kq - 1 10",
        "white_plans": [
            "Trade pieces, not pawns. Every trade takes you closer to the pure pawn ending, and the pure pawn ending is winning.",
            "Roll the kingside majority — f4, g4, e5 — but only once the pieces cannot punish the holes it leaves.",
            "Put a knight where a doubled pawn cannot chase it: c5, d5 and e6 are all squares Black's structure can no longer cover.",
            "Refuse to open the queenside. Black's extra pawn there is worth something only if lines open for the bishops.",
        ],
        "black_plans": [
            "Keep pieces on. The two bishops need open lines and targets; a pawn ending gives them neither. In the Berlin the queens come off by force on move eight, so 'pieces' means the rooks and both bishops — that is the whole reason the Berlin holds and the Exchange grinds.",
            "...c5 and ...c4 to fix White's queenside and give the bishops a diagonal — the pawn count on that wing is real as long as pieces are still on the board.",
            "...f6 and ...Bd6 to hold e5, then trade the knights, not the bishops.",
            "Aim at f2 and the light squares. The compensation is dynamic and it expires; use it early.",
        ],
        "key_squares": ["c5", "d5", "e6", "f5", "the c-file"],
        "pawn_breaks": ["White: f2–f4 and e4–e5, then g4–g5 to make the passer",
                        "Black: ...c5–c4 and ...b5–b4, and ...f6–f5 to open lines for the bishops"],
        "pitfalls": [
            "Trading into the pawn ending as the side with the bishops. It is lost, and it usually looks equal one move earlier.",
            "As White, pushing the majority before the pieces are placed. Pawns that advance without support become the targets.",
            "Forgetting that the doubled pawn still defends squares. Two pawns on the c-file cover b5 and d5 twice over — the structure is crippled for making passers, not for holding ground.",
        ],
        "endgame_note": "This is the endgame the whole variation is played for. Four against three on the kingside produces a passed pawn by force; four against three on the queenside with two on the c-file produces nothing at all. If every piece comes off, White wins — so White should be counting trades and Black should be counting attackers.",
        "also_in": [
            "fourknights — the Scotch Four Knights doubles Black's c-pawns the same way after 6.Nxc6 bxc6, and ...d5 dissolves them. Doubled pawns you can cure are a structure; doubled pawns you cannot are a verdict.",
            "scotch — the Mieses looks like this card and is not it. Four against three makes a passer by force; three against three, which is what the Scotch reaches, is a dead draw with the pieces off. Read the two endgame notes side by side — it is the clearest way to see that 'doubled pawns lose the endgame' is about the count, not the doubling.",
            "italian — Bxc6 in an Italian move order produces the identical trade, and the identical bargain.",
        ],
    },

    {
        "id": "doubled-c-pawns-open-b-file",
        "name": "Doubled c-pawns with the b-file open (the Metger structure)",
        "tier": "Structure",
        "taxonomy": "Flores Rios covers the Nimzo-Indian version at length; the Four Knights version is the same pawns one rank lower and with the centre still on the board. Not a weakness and not a strength — a bargain, with clear terms on both sides.",
        "fen": "r1b2rk1/pp2qppp/3pnn2/1Bp1p3/3PP3/2P2N2/P1P2PPP/R1BQR1K1 w - - 0 12",
        "white_plans": [
            "Play d4 and keep the two centre pawns abreast. The doubled c-pawn is what pays for the big centre — spend it.",
            "Rb1 and pressure b7 down the file the doubled pawn opened. It is the one open line in the position.",
            "d4–d5 to close the centre when Black's pieces are awkward, then Nh4–f5 or f2–f4 on the wing.",
            "Trade the c-pawn off with c3–c4 and d4–d5 only if it comes with a target; otherwise it is a defender of d4 and b4 and should stay.",
        ],
        "black_plans": [
            "...Nd8–e6, the Metger route: from e6 the knight hits d4 and c5 and kicks a bishop off g5 on the way.",
            "...c5 to hit the base of the centre, and ...Qe7 and ...Rad8 behind it.",
            "Trade the light-squared bishop and then aim at c3 and c2 with a rook. Doubled pawns on a half-open file are targets in an endgame even when they are useful in a middlegame.",
            "Never allow d4–d5 for free: it gains space and unfreezes White's worst pawn at the same time.",
        ],
        "key_squares": ["d5", "b7", "c4", "e6", "f5"],
        "pawn_breaks": ["White: d3–d4 and d4–d5, later f2–f4 and c3–c4",
                        "Black: ...c7–c5 and ...d6–d5, ...f7–f5 once a knight reaches g6"],
        "pitfalls": [
            "Taking on c6 or c3 'to fix the structure' before you know which side the extra pawn helps. It usually helps whoever gets the open file.",
            "Playing d4–d5 early. It stops being a pawn duo and starts being a locked centre where the bishop pair matters more than the file.",
            "As Black, going after the c-pawns with pieces in the middlegame. They are defended, and hunting them costs the time you need for ...d5.",
        ],
        "endgame_note": "Queenless, the doubled pawns are simply a pawn worse: three pawns on the queenside doing the work of four. So the side with them wants pieces on and the centre alive, and the side against them wants trades. That is the same rule as the isolani card, and it is not a coincidence — every structural weakness gets worse as the pieces come off.",
        "also_in": [
            "italian — the Evans Gambit reaches a version of it after ...Bxb4 and c2–c3, except that there the pawns are a sacrifice rather than a structure.",
        ],
    },

    {
        "id": "mieses-wedge",
        "name": "The Mieses structure — a wedge on e5 against doubled c-pawns",
        "tier": "Structure",
        "taxonomy": "No chapter in Flores Rios or Soltis, and no settled name in the literature either — it is known by the variation, the Mieses. Worth a card anyway, because it is the structure the whole Scotch is played for, and because it is the one place in this course where doubled pawns do NOT hand anybody an endgame.",
        "fen": "2kr1b1r/p1ppqppp/b1p5/3nP3/2P5/1P4P1/P3QP1P/RNB1KB1R b KQ - 0 10",
        "white_plans": [
            "Play against c6, not against the pawn count. It has exactly one pawn defender — d7 — and ...d6 or ...d7-d5 is also Black's only freeing move, so Black cannot free the position and defend c6 with the same pawn.",
            "That is what g3 and Bg2 are for. The bishop's diagonal to c6 is blocked by one thing, Black's knight on d5, so every time that knight moves the target is live.",
            "Castle before you defend e5. It is guarded once, by the queen down the file the pawn vacated, and 12.Qxe5 loses to ...Qxe5+ and ...Qxa1 while the rook is still at home.",
            "Keep c4. It is the only pawn or piece attacking d5, which is why Black's bishop goes to a6 rather than b7, and why b3 is a real move rather than a formality.",
        ],
        "black_plans": [
            "Aim everything at e5. ...Re8, ...f6 and ...Qe6 turn one attacker into three, and White cannot add defenders as fast as Black adds attackers.",
            "Win that pawn and know what it buys: after ...f6 and ...fxe5 Black is a pawn up and the engine still prefers White by half a pawn. It is compensation for the structure, not an advantage on top of it.",
            "...Ba6 hits c4 with White's queen behind it on the same diagonal — the move that argues about d5 instead of conceding it.",
            "Head for a pure pawn ending. The queenside that looks broken is a draw with only kings left, so every piece that comes off helps Black.",
        ],
        "key_squares": ["e5 (the wedge)", "c6 (the target)", "d5", "c4", "the e-file"],
        "pawn_breaks": ["White: f2–f4 to prop e5; a2–a4 and b3–b4 only with pieces behind them, never as an endgame plan",
                        "Black: ...f7–f6 and ...d7–d6 against the wedge — the only two breaks that matter"],
        "pitfalls": [
            "Counting the queenside as a majority. It is three against three, and three pawns on three files do not beat three on two files by themselves: with only kings left it is 0.00 at depth 26, in every pawn placement the variation reaches. The doubling is a target, not a won endgame.",
            "Trading pieces on the strength of that count — the exact opposite of what the Exchange Ruy teaches with the same-looking pawns. Here the pieces are the advantage and the pawn ending is the draw.",
            "Treating e5 as a pawn to hold. It is a tempo-generator to spend: it cramps Black for a dozen moves and then comes off. Defending it is how White ends up worse.",
            "As Black, playing ...c5 to tidy the pawns up in the middlegame. It fixes nothing, takes support off d5 and costs about a pawn — even though the same move is the drawing move once the pieces are gone.",
        ],
        "endgame_note": "The honest evaluation, and the reason this card exists: with everything traded, White is not winning. The bare queenside is a dead draw and the full pawn ending is barely a third of a pawn, because Black's king simply collects the wedge on e5. So the doubled c-pawns are worth playing against only while pieces are on the board and c6 needs defending — White plays for the middlegame here, and Black plays for every trade.",
        "also_in": [
            "fourknights — the Scotch Four Knights hands Black the identical doubled c-pawns after 6.Nxc6 bxc6, with White's pawn still on e4 rather than wedged on e5. Same pawn count, none of the pressure — and ...d5 dissolves it, which is exactly what the Mieses does not allow.",
            "scotch — the Scotch Gambit reaches the same queenside after 8.Bxc6 bxc6, with pawns facing off on d5 and e5 instead of a wedge. Same target on c6, and the same warning about the endgame.",
        ],
    },

    {
        "id": "sicilian-small-centre",
        "name": "The Sicilian small centre — e4 against d6+e5, with the c-file half-open",
        "tier": "Structure",
        "taxonomy": "Flores Rios gives the Najdorf/Scheveningen skeleton its own chapter and Soltis treats it as the Sicilian structure. Every Open Sicilian ends up here or in a close relative — the Dragon and the Scheveningen reach the identical pawns and differ only in where the pieces stand.",
        "fen": "r2q1rk1/1p1nbppp/p2pbn2/4p3/4P1P1/1NN1BP2/PPPQ3P/2KR1B1R b - - 0 11",
        "white_plans": [
            "Storm with g4–g5 and h4–h5. The kings are on opposite wings, so this is a race and every defensive move you make is a move you lose it by.",
            "d5 is the square the whole structure is about. Three things cover it — the knight on c3, the queen on d2 and the pawn on e4 — and a knight that lands there rather than merely watching it is usually worth a pawn or an exchange.",
            "Bxb6 or Nd5 to strip the guards before the storm arrives, not after. Black defends d5 with the e6-bishop and the f6-knight; trade one and the other has a job it cannot do alone.",
            "Count the queenside before you commit: three pawns against two is a genuine majority, and it is what you are left with if the attack does not land.",
        ],
        "black_plans": [
            "...b5–b4 chases the knight on c3 — the piece that wants to *land* on d5, not just watch it. Winning that race is the difference between an attack and a bad position.",
            "...Rc8 and, when it is right, ...Rxc3. If bxc3 has to recapture, White's king on c1 is sitting behind doubled c-pawns with the b-file open.",
            "...Nb6–a4 and ...a5–a4–a3. Your pawns point at the king; use them the way White is using theirs.",
            "When g5 comes, retreat the knight to e8 rather than d7 — d7 is occupied, and a knight on e8 holds d6 and comes back via c7.",
        ],
        "key_squares": ["d5", "b4", "c3", "f5", "the c-file"],
        "pawn_breaks": ["White: g4–g5 and h4–h5, and f3–f4 once the pieces support it",
                        "Black: ...b5–b4, ...a5–a4–a3, and ...d6–d5 the moment it is playable"],
        "pitfalls": [
            "Defending in a race. One tempo spent on a quiet defensive move is the whole margin — if you are not attacking, you are losing this structure.",
            "Moving the only defender of d5 or f5. Both squares are one sacrifice away from deciding the game, and the sacrifice does not need to be sound to work over the board.",
            "As White, assuming the queenside majority is a fallback plan. It is a real asset, but it needs an endgame, and this structure rarely reaches one with the kings where they are.",
        ],
        "endgame_note": "Pawn counts are level at seven each, and White's f- and g-pawns have already left home — so with the queens off, the side that has not weakened its king usually stands better, and that is Black. This is why White attacks and why a White player who trades queens has generally already lost the argument.",
        "also_in": [
            "sicilian — the Dragon and the Scheveningen reach the same skeleton; the Dragon puts the bishop on g7 and the Scheveningen leaves the pawn on e6, and every plan on this card survives both changes.",
        ],
    },

    {
        "id": "mar-del-plata-locked-chain",
        "name": "The Mar del Plata locked chain (c4+d5+e4 against c7+d6+e5)",
        "tier": "Structure",
        "taxonomy": "Flores Rios gives it a chapter as the King's Indian chain; Soltis files it under the closed centre. The name is genuinely used in the literature and comes from Najdorf–Gligorić, Mar del Plata 1953.",
        "fen": "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 1 9",
        "white_plans": [
            "c4–c5 and cxd6, then Nb5 and Rc7. Black's d6-pawn has no pawn that can ever defend it and cannot advance, and c7 becomes a hole the moment the c-pawns come off.",
            "Rc1 and b2–b4 first. The break is the plan; the rook behind it is what makes the break worth playing.",
            "Do not play c5 while a black knight can reach it — ...Nxc5 is simply a pawn, and it is the one tactical accident in an otherwise strategic position.",
            "Count moves, not merits. This is a race between two attacks on opposite wings, and the loser is whoever spends a move defending.",
        ],
        "black_plans": [
            "...f5 is the whole opening. Play ...Ne7–g6 or ...Nf6–d7 first to unblock the pawn, then ...f4, ...g5, ...h5, ...g4.",
            "Once the pawns are rolling, everything joins behind them: ...Rf7–g7, ...Bf8, ...Ng6–f8–h7. A piece landing on g3 or h3 is usually worth more than the piece it costs.",
            "...Rf7 and ...Bf8 hold d6 without spending an attacker on it — the one piece of defence that is not a lost tempo.",
            "Never spend a move stopping c5. You cannot stop it and you do not need to; you need to be faster.",
        ],
        "key_squares": ["c5, c7, b5 and d6 for White", "f4, g3, h3 and g4 for Black"],
        "pawn_breaks": ["White: b2–b4 and c4–c5, and cxd6 to open the c-file",
                        "Black: ...f7–f5 and ...f5–f4, then ...g5–g4 and ...g3"],
        "pitfalls": [
            "Defending. In a locked chain there is no such thing as a useful defensive move — both attacks arrive, and the only question is which arrives first.",
            "As White, pushing c5 with a black knight a move from d7. It costs a pawn for nothing.",
            "As Black, opening the position. Every trade and every open file helps the side whose attack is slower to arrive, and that is not you.",
        ],
        "endgame_note": "There is no good endgame here for Black, and that is not a flaw in the plan — it is the plan. The kingside attack is the compensation for a structure that is worse the moment queens come off, so a Black player who reaches an endgame has usually already lost the argument, and a White player who survives to one has usually already won it.",
        "also_in": [
            "kid — the Sämisch reaches the same pawns with White castled queenside, which changes who is attacking whom: the pawn storm becomes White's, and Black plays on the other wing instead.",
        ],
    },

    {
        "id": "french-chain",
        "name": "The French chain (d4+e5 against d5+e6)",
        "tier": "Foundation",
        "taxonomy": "The literature names this structure after the opening rather than after the pawns, which is unusual and tells you how completely one variation owns it. A pawn chain is attacked at its base, and this is the chain every book uses to teach that rule.",
        "fen": "r1b1kbnr/pp3ppp/1qn1p3/2ppP3/3P4/2P2N2/PP3PPP/RNBQKB1R w KQkq - 3 6",
        "white_plans": [
            "Hold d4 and keep adding to it — c3, Nf3, then Bb2 or Nb1–a3–c2 when c3 is taken. The whole opening is a counting exercise on one square, and the board above is the count: two attackers, three defenders.",
            "Trade the knight that reaches f5. Bd3 and Bxf5 costs you a bishop for Black's best piece, and Black does not have a second one.",
            "Kingside space with g4 and h4 — but only once d4 holds. Every pawn that leaves the kingside is a square your own king wanted.",
            "dxc5 is almost always a concession: it hands back the centre and takes the last defender off e5.",
        ],
        "black_plans": [
            "...c5, ...Nc6 and ...Qb6 — three attackers on the base, in that order, and the whole plan of the opening.",
            "...Nh6–f5 is the fourth attacker and blocks nothing on the way. ...Nge7–f5 gets there too, but shuts the f8-bishop in while it waits.",
            "...f6 second, never first, and only once the king has chosen a wing — the file it opens runs at whoever is standing on it.",
            "Pick a route for the light-squared bishop by move ten: ...Bd7–b5, ...b6 and ...Ba6, or ...Bd7–e8–g6. It is the piece the whole structure imprisons, and it will not free itself.",
        ],
        "key_squares": ["d4 (the base)", "e5 (the head)", "f5", "b2", "the c-file"],
        "pawn_breaks": ["White: f2–f4 to prop e5, g2–g4 and h2–h4 for space; dxc5 only as a concession",
                        "Black: ...c7–c5 against d4 and ...f7–f6 against e5. There are no others, which is what makes them easy to prepare for and impossible to avoid"],
        "pitfalls": [
            "White defending d4 with the c1-bishop. Be3 and Bd2 both leave b2 with nothing on it, and Black's queen is already looking at it.",
            "White playing Bd3 or Nd2 and counting it as a defender. Both block the queen's own defence of d4 down the d-file, so both turn three defenders into two.",
            "Black releasing the tension on d4 without a reason. It costs almost nothing by the engine's count and it costs you every future choice.",
            "Black playing ...f6 with the king still on e8.",
        ],
        "endgame_note": "Once both c-pawns die on d4 the count is two, two and three a side: no majority anywhere and no passer to make, so the ending turns entirely on the bishops. White's dark-squared bishop is walled in by White's own pawn on d4; Black's light-squared bishop has one diagonal shut by Black's own pawn on e6 and one wide open toward b5 and a4. Whoever solves their bad bishop first wins — which is what all four of those bishop routes are for.",
        "also_in": [
            "carokann — the Advance Caro-Kann reaches the identical chain with Black's pawn on c6 instead of e6. That one square is the whole difference between the two openings: the bishop comes out before the wall goes up, and the ...c5 break then costs a tempo.",
        ],
    },

    {
        "id": "catalan-held-queenside",
        "name": "The Catalan queenside — a2+b2 against a6+b5+c7, and the long diagonal",
        "tier": "Structure",
        "taxonomy": "Neither Flores Rios nor Soltis gives it a chapter; the literature describes it by variation — 'the Open Catalan' — rather than by pawns. It earns a card anyway, because the pawn count is what decides every plan in the variation.",
        "fen": "rn1q1rk1/2p1bppp/p3pn2/1p6/3Pb3/5NP1/PP1BPPBP/RNQ2RK1 b - - 5 11",
        "white_plans": [
            "a2–a4 and only a4. You have two queenside pawns against three, so b4 is not a plan — the a-file you open is the plan, and b5 is the target on it. Count b5's defenders and there is exactly one, the pawn on a6; behind that is a rook that cannot leave a8.",
            "Get the pieces there first: Bc3, Nbd2–b3, Rfc1. Pushing a4 before they arrive lets Black answer ...c5 with a free hand and the whole idea evaporates.",
            "Ne5 and Bc3 fight for c6 and d5. The pawn you gave up on c4 bought this time; spend it on squares, not on winning the pawn back.",
            "Look at the bishop on g2 before you rely on it. With your own knight on f3 it attacks f1, f3, h1 and h3 and nothing else — the diagonal only opens when the knight moves, which is what Ne5 is really for.",
        ],
        "black_plans": [
            "...c5 in one move, never ...c6 first. The whole point of ...a6 and ...b5 was to make that break possible with the queenside intact.",
            "...Bb7–e4 to shut the long diagonal down, and keep it shut. A bishop on e4 is worth more than the tempo it costs.",
            "Count the wing: three pawns against two is a real majority, and it survives losing b5. Every trade takes you closer to the ending where it tells.",
            "Do not spend the b-pawn defending itself. If a4 costs you b5 but wins the a-file for your rook and gets ...c5 in, that is a fair trade.",
        ],
        "key_squares": ["b5", "c6", "d5", "the a-file", "the long diagonal"],
        "pawn_breaks": ["White: a2–a4, and e2–e4 when the centre allows it",
                        "Black: ...c7–c5 against d4, and ...b5–b4 to fix a2 and b2 if White ever plays a4 too early"],
        "pitfalls": [
            "Reading this as the Carlsbad. It is the reverse bargain: there the minority side has the target, here the side with two pawns is the one whose pawns can be attacked, and it is Black who owns the majority.",
            "As White, trading into a pawn ending. Black's three against two on the queenside does not stop being a majority because you won a pawn back somewhere else.",
            "As Black, treating the extra pawn on c4 as material. It is a tempo you sold — spend the time it bought on ...c5, or you have simply lost a pawn for nothing.",
        ],
        "endgame_note": "Black's queenside majority is the long-term asset and White's initiative is the short-term one, which is the whole tension of the opening: White has to make the a-file and the diagonal count before the pieces come off, and Black has to survive to an ending where three pawns against two on one wing is worth more than anything White has left.",
        "also_in": [
            "slav — the ...dxc4 and ...b5 lines reach the same bargain from the other side of the board: Black holds the pawn with ...a6 and ...b5, and White plays a4 against it. The pawns are the same and the piece placement is not.",
        ],
    },

    {
        "id": "evans-open-lines",
        "name": "The gambit imbalance — open lines for three pawns, two once you take on c3",
        "tier": "Plans",
        "taxonomy": "Not a pawn structure in the taxonomic sense, and it would be dishonest to pretend otherwise. It is a material-for-time imbalance, and it needs its own card because the plans are nothing like the Italian's.",
        "fen": "r1b1k1nr/pppp1ppp/2n3q1/b3P3/2B5/1Qp2N2/P4PPP/RNB2RK1 w kq - 1 10",
        "white_plans": [
            "Nxc3 first. It is the only move that takes the pawn back and develops in the same breath — the knight leaves b1 for a square it wants anyway. Recapturing is not spending your tempo here; it is the cheapest way to bring the last piece.",
            "Then Re1 and Ba3 — the file and the diagonal Black's king cannot cover. How much Ba3 is worth depends on what Black has on e7: with the diagonal clear it hits f8 and castling stops being simple, and with a knight there it is just a good bishop.",
            "e4–e5 as a wedge: it takes f6 and d6 from Black's pieces and it is worth more than the pawn it costs.",
            "Do not go pawn-hunting with Qxb7 or a4. You are three pawns down and none of them is coming back by force — what you bought was time, and a queen on b7 is a queen not attacking the king.",
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

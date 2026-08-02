# Sources, and the prompts that get something out of them

Recorded from the session that coached the Ruy Lopez and the Four Knights. The
failures are listed too, because the failure mode is *plausible vagueness* rather
than an error message.

## Wikibooks — Chess Opening Theory

**Best for: deviations.** One page per position, each reply named and assessed in
a sentence or two. This maps directly onto a `branches` set.

URL is the move path, with `._` after a White move number and `...` before a
Black one:

```
https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Bb5
https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Bb5/3...a6/4._Ba4
https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6/3._Nc3/3...Nf6/4._Bb5
```

Prompt that works — name the replies you expect, so a missing one is visible:

> List every Black fourth move reply covered with names and assessments
> (4...Nf6, 4...d6, 4...b5, 4...Nge7, 4...f5, 4...Bc5, 4...g6 etc). Quote the
> commentary text for each.

Deep pages exist for the main lines (the 9.h3 crossroads of the Closed Ruy has
its own page listing Chigorin / Breyer / Zaitsev / Karpov / Smyslov). Not every
position has a page; a miss returns an empty-ish answer rather than a 404.

**Coverage is deep for 1.e4 and thin for 1.d4 systems.** The Catalan has four
pages under `3.g3`, every assessment a bare `=`, and the Open Catalan pages were
never written; Wikipedia's article has one variation section. Check early how much
is actually there, and when the answer is "not much", switch sources rather than
grinding: ECO code lists give you the names, and the **PGN archives give you the
theory** — replaying what Kramnik and Anand actually played in a variation tells
you more than a page of `=` signs, and it is verifiable.

**Take moves and names from these pages. Never take adjectives.** The move lists
and the variation names are what the page is good at; the verdicts are old,
unsourced and sometimes attached to the wrong position. Both of these came from
Wikibooks in the Scotch session and both are false:

- "5.Nf5 … it is losing to 5...d5" — the engine says −0.6, an inaccuracy.
- "5.Nb5 Blumenfeld loses to 6...Bxe3 7.fxe3 Qh4+" — that refutation belongs to a
  different position (after 5.Be3 Qf6 6.Nb5). It does not play from where the
  page puts it.

A wrong verdict costs you nothing if you were always going to run the position
through the engine, and ships as a confident lie if you were not.

## Wikipedia — the opening article

**Best for: named traps, historical context, and the shape of a whole opening.**
The same rule applies as above: names and moves yes, assessments no.

**For a name attached to a specific move, go to Wikibooks instead** — the article
is organised by story, not by position. The Scotch article lists neither Haxo nor
Benima nor London, gives no ECO codes, and does not say which of two moves the
Blumenfeld Attack is, which is how that name ended up on the wrong move here. The
Wikibooks page for the position the move is played from named all four fifth moves
correctly in one fetch.

Ask for one bounded thing. This worked (Four Knights, one call, complete):

> Give the complete variation list with ECO codes and exact move sequences:
> Spanish Four Knights (4.Bb5) including the Symmetrical/Metger unpin, Rubinstein
> 4...Nd4 with its main lines and traps, … and any famous trap/miniature move
> sequences quoted in the article.

This failed twice on the Ruy Lopez article — the answer came back truncated and
hedged, because the article is long and the request had a dozen clauses:

> List every named variation of the Ruy Lopez with its ECO code and defining
> moves, exactly as given: all Black third-move alternatives … White's
> fourth-move options … Black's fourth/fifth move systems … and the main traps.

When the article is big, go to the **dedicated trap and variation articles**
instead. They are short and they quote exact moves:
`Noah's_Ark_Trap`, `Ruy_Lopez,_Tarrasch_Trap`, `Ruy_Lopez,_Mortimer_Trap`,
`Marshall_Attack`, `Ruy_Lopez,_Zaitsev_Variation`.

> Give the exact move sequence of the Noah's Ark Trap in the Ruy Lopez, the
> historical game it is named from, and any related traps mentioned. Quote exact
> moves.

## Everything else on the web: treat as a lead, not a source

Coaching sites and video pages are useful for *finding* a trap's name and rough
shape, and unreliable for its moves — several give the trap without the player,
the year, or the last four moves. Take the name from them, then get the moves
from Wikipedia, Wikibooks, or a PGN file, and put them through the engine.

Two concrete examples from the session:

- The Four Knights symmetry trap was found via a coaching site that named
  Capablanca but gave neither opponent nor year. The moves were verified with
  python-chess (the mate is real) and shipped **without** the attribution, since
  no reliable source for the game turned up. ECO does call the line the
  Capablanca Variation, which is what the text says.
- The Halloween Gambit "refutation" is quoted on Wikipedia as Kaufman's line and
  described elsewhere as leaving Black a piece up. At depth 20 it is level.
  Quote the line; check the evaluation yourself.

## Game scores: PGN only

`scripts/fetch-games.py` pulls a player archive from pgnmentor.com and filters it
by ECO, opponent, year, result and length. Player names are the file names on
<https://www.pgnmentor.com/files.html> (`Karpov`, `Morphy`, `Capablanca`,
`Rubinstein`, `Kramnik`, `Alekhine`, `Tarrasch`, `Marshall`, `Spielmann`,
`Nimzowitsch`, …).

chessgames.com returns 403 to fetchers and Blogspot bounces through a Google
interstitial, so neither is usable in an agent run.

Archives are cached under `.engine/pgn/` after the first fetch, so filtering the
same player again is free. `--headers` prints every PGN tag: Round and Site are
the two a `note` needs before it can say "the sixteenth game of the match".

pgnmentor also publishes archives **by variation** rather than by player, under
`openings/` on the same page — `RuyLopezMarshall`, `RuyLopezBerlin`,
`RuyLopezOther5` and so on. `scripts/explorer.py` fetches those (into
`.engine/openings/`) and counts them, which is where a `record` comes from and the
cheapest way to find out what is actually played in a position. The per-variation
files partition an opening between them, so fetch the whole family — the fifteen
`RuyLopez*` files are the Ruy Lopez, and a subset silently under-counts every
position that lives in the file you left out.

Cross-check what you pull: the header should agree with the event and year you
expect, and the ECO code should match the line you are illustrating. A game whose
first ten moves do not reach the position you are teaching is the wrong game,
however famous it is.

**Attributions are verifiable from these archives too, not just scores.** "Karpov
played this in game 16 of the 1990 match", "Kasparov used it against Short,
Yusupov, Topalov and Anand", "Carlsen played it four times at the 2009 World
Blitz" — all of that is a filter away, and all of it is the kind of claim that
otherwise gets written from memory and is wrong about the round, the year or the
opponent. Filter, read the headers, then write the sentence.

"Anand and Caruana play this move here" is checkable the same way, and it is worth
doing before you write it: replay every one of their games in that ECO code up to
the tabiya and count what they actually chose. Twenty lines of python-chess over
the cached archives confirmed the two names and showed the claim was overstated —
the move they play most from that position is the one the text said was *never*
urgent.

## Engine

There is no engine in the repo and none in the environment. `setup-engine.sh`
clones and builds Stockfish (aarch64 here, so `ARCH=armv8`). Depth 20 is the
working depth for opening claims — it takes a second or two per position and it
is stable enough to compare two candidate moves. Depth 22–24 is worth it for a
claim you are about to print as a fact.

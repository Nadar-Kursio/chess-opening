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

## Wikipedia — the opening article

**Best for: variation names, ECO codes, named traps, historical context.**

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

Cross-check what you pull: the header should agree with the event and year you
expect, and the ECO code should match the line you are illustrating. A game whose
first ten moves do not reach the position you are teaching is the wrong game,
however famous it is.

## Engine

There is no engine in the repo and none in the environment. `setup-engine.sh`
clones and builds Stockfish (aarch64 here, so `ARCH=armv8`). Depth 20 is the
working depth for opening claims — it takes a second or two per position and it
is stable enough to compare two candidate moves. Depth 22–24 is worth it for a
claim you are about to print as a fact.

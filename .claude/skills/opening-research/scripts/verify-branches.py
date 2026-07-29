#!/usr/bin/env python3
"""Engine-check every authored deviation in one opening.

    .venv/bin/python3 .claude/skills/opening-research/scripts/verify-branches.py ruylopez
    DEPTH=24 … verify-branches.py fourknights --set "e4 e5 Nf3 Nc6 Bb5"

For each branch it prints three numbers, all in centipawns from White's point of
view:

    position   the eval BEFORE the deviation -- the baseline severity is measured
               against, and the engine's own best line for comparison
    after      the eval once the deviation is played
    end        the eval at the end of the branch's `line`

`after` decides the severity. `end` audits the continuation you wrote: if your
line is supposed to refute something and `end` says the other side is better,
the line is wrong even though the build accepted it as legal.

The bands below are deliberately wider than the editorial table in SKILL.md, so
a row is flagged only when no reading of the eval supports the label. Silence
here is not agreement -- it means nothing is provably wrong.
"""
import argparse
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import chess                                                        # noqa: E402
from _engine import board_after, open_engine, opening, score        # noqa: E402

BANDS = {
    "playable":   (-10000, 150),
    "inaccuracy": (10, 400),
    "blunder":    (150, 10000),
}
# What a refutation has to be worth by the end of the line it is written in.
REFUTED = 150


def flag(severity, cost, punished):
    """'?' the severity does not fit the eval, '!' the line does not back it up."""
    lo, hi = BANDS[severity]
    if not lo <= cost <= hi:
        return "?"
    if severity == "blunder" and punished < REFUTED:
        return "!"
    return " "


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("opening", help="module name in src/content/openings, e.g. ruylopez")
    ap.add_argument("--set", dest="only", default=None,
                    help="check only the branch set with this SAN prefix")
    args = ap.parse_args()

    branches = (opening(args.opening).get("branches") or {})
    if not branches:
        raise SystemExit(f"{args.opening} has no branches")
    if args.only and args.only not in branches:
        raise SystemExit(f"no branch set keyed '{args.only}'")

    flags = 0
    with open_engine() as eng:
        for prefix, entries in branches.items():
            if args.only and prefix != args.only:
                continue
            base = board_after(prefix)
            here, pv = score(eng, base)
            print(f"\n=== after {prefix}\n    position {here:+5d}   engine likes {pv}")
            for br in entries:
                board = base.copy()
                # This runs on content the build has not necessarily accepted
                # yet, so one illegal move must not end a twenty-minute run.
                try:
                    board.push_san(br["san"])
                    after, _ = score(eng, board)
                    for san in br.get("line", "").split():
                        board.push_san(san)
                    end, endpv = score(eng, board)
                except ValueError as e:
                    print(f"  x {br['san']:8s} {br['severity']:10s} ILLEGAL — {e}")
                    flags += 1
                    continue
                # Both numbers are "how bad for the side that played the
                # deviation", so the sign flips when that side is White.
                sign = 1 if base.turn == chess.BLACK else -1
                cost = sign * (after - here)
                mark = flag(br["severity"], cost, sign * end)
                flags += mark != " "
                print(f"  {mark} {br['san']:8s} {br['severity']:10s} after {after:+5d} "
                      f"(cost {cost:+5d}) end {end:+5d}  {endpv}")

    print(f"\n{flags} row(s) flagged.  ? = the eval cannot support that severity."
          f"\n                        ! = it is called a blunder and the line does not punish it."
          f"\n                        x = the move does not play from that position.")


if __name__ == "__main__":
    main()

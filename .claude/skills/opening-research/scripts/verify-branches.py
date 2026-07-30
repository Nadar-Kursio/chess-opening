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
    kept       end minus after, from the point of view of whoever is answering
               the deviation: negative means your own line gave the edge back

`cost` decides the severity. `kept` audits the continuation you wrote, and
`best` -- the engine's reply to the deviation -- is what to write instead when it
is negative. A line that refutes nothing is the most common real error in this
content, and it is invisible to the build, which only proves the moves legal.

The bands below are deliberately wider than the editorial table in SKILL.md, so
a row is flagged only when no reading of the eval supports the label. Silence
here is not agreement -- it means nothing is provably wrong.

A full opening takes 20-40 minutes and the module is read ONCE, at start-up, so
the rows describe the file as it was then. The run re-checks the file's timestamp
at the end and says so if you edited it meanwhile -- otherwise a clean report for
text you have since replaced reads as a clean report for the text you now have.
"""
import argparse
import hashlib
import os
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import chess                                                                   # noqa: E402
from _engine import ROOT, board_after, open_engine, opening, score, source_of   # noqa: E402

BANDS = {
    "playable":   (-10000, 150),
    "inaccuracy": (10, 400),
    "blunder":    (150, 10000),
}
# What a refutation has to be worth by the end of the line it is written in.
REFUTED = 150
# A line that ends this far ahead settles the question: the deviation lost by
# force, whatever the eval said one move after it. Forced material often costs
# less than 150cp on the spot -- a pawn and the castling rights measured +124 --
# and flagging those as mislabelled was the script crying wolf at its own band edge.
DECISIVE = 400
# How much of what the deviation conceded a written line may hand back before the
# line is the problem. Wide enough to absorb depth noise between two positions.
GAVE_BACK = 75


def fingerprint(name):
    """A hash of what this script actually checks: moves and labels, not prose.

    Re-imported from disk, so it reflects the file now rather than at start-up.
    The point is to tell "you changed a line I already verified" from "you fixed a
    typo in a `why`", because a bare mtime check calls both of them stale and a
    40-minute run gets thrown away for a comma.
    """
    for mod in [m for m in sys.modules if m == "content" or m.startswith("content.")]:
        del sys.modules[mod]
    branches = (opening(name).get("branches") or {})
    shape = [(prefix, [(b.get("san"), b.get("severity"), b.get("line")) for b in entries])
             for prefix, entries in sorted(branches.items())]
    return hashlib.sha256(repr(shape).encode()).hexdigest()


def flag(severity, cost, punished, kept):
    """One character per row, worst first.

    '?' the severity does not fit the eval.
    '!' it is called a blunder and the line does not punish it.
    '~' the line hands back what the deviation conceded -- at ANY severity. Most
        of the bad lines found in practice were labelled `playable` or
        `inaccuracy` and answered with a move that returned the whole edge, which
        '!' cannot see because it only looks at blunders.
    """
    lo, hi = BANDS[severity]
    if not lo <= cost <= hi and not (severity == "blunder" and punished >= DECISIVE):
        return "?"
    if severity == "blunder" and punished < REFUTED:
        return "!"
    if kept < -GAVE_BACK:
        return "~"
    return " "


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("opening", help="module name in src/content/openings, e.g. ruylopez")
    # Repeatable, because re-verifying two edited sets otherwise means two process
    # starts and two engine launches -- which is the whole fix-and-check loop.
    ap.add_argument("--set", dest="only", action="append", default=None,
                    help="check only this branch set (repeatable)")
    args = ap.parse_args()

    branches = (opening(args.opening).get("branches") or {})
    if not branches:
        raise SystemExit(f"{args.opening} has no branches")
    for prefix in args.only or []:
        if prefix not in branches:
            raise SystemExit(f"no branch set keyed '{prefix}'")

    src = source_of(args.opening)
    read_at = os.path.getmtime(src)
    shape_at_start = fingerprint(args.opening)
    print(f"read {os.path.relpath(src, ROOT)} at mtime {read_at:.0f}", flush=True)

    flags = 0
    with open_engine() as eng:
        for prefix, entries in branches.items():
            if args.only and prefix not in args.only:
                continue
            base = board_after(prefix)
            here, pv = score(eng, base)
            print(f"\n=== after {prefix}\n    position {here:+5d}   engine likes {pv}", flush=True)
            for br in entries:
                board = base.copy()
                # This runs on content the build has not necessarily accepted
                # yet, so one illegal move must not end a twenty-minute run.
                try:
                    board.push_san(br["san"])
                    after, afterpv = score(eng, board)
                    for san in br.get("line", "").split():
                        board.push_san(san)
                    end, endpv = score(eng, board)
                except ValueError as e:
                    print(f"  x {br['san']:8s} {br['severity']:10s} ILLEGAL — {e}", flush=True)
                    flags += 1
                    continue
                # Both numbers are "how bad for the side that played the
                # deviation", so the sign flips when that side is White.
                sign = 1 if base.turn == chess.BLACK else -1
                cost = sign * (after - here)
                kept = sign * (end - after)
                mark = flag(br["severity"], cost, sign * end, kept)
                flags += mark != " "
                print(f"  {mark} {br['san']:8s} {br['severity']:10s} after {after:+5d} "
                      f"(cost {cost:+5d}) end {end:+5d} (kept {kept:+5d})", flush=True)
                # The engine's reply to the deviation, which is the answer to the
                # question a bad row raises. Without it every fix costs a second
                # scan.py run on the same position.
                print(f"      best  {afterpv}", flush=True)
                if endpv:
                    print(f"      then  {endpv}", flush=True)

    print(f"\n{flags} row(s) flagged.  ? = the eval cannot support that severity."
          f"\n                        ! = it is called a blunder and the line does not punish it."
          f"\n                        ~ = the line hands back {GAVE_BACK}cp+ of what the deviation conceded."
          f"\n                        x = the move does not play from that position."
          f"\n\n'best' is the engine's reply to the deviation — write your line from that."
          f"\n'then' is what follows the end of the line you wrote.")
    if os.path.getmtime(src) != read_at:
        where = os.path.relpath(src, ROOT)
        if fingerprint(args.opening) == shape_at_start:
            print(f"\n-- {where} changed while this ran, but only its prose: every move, "
                  f"severity and line above is still what the file says. Nothing to re-run.")
        else:
            print(f"\n!! {where} changed while this ran, and a move, severity or line "
                  f"changed with it. The rows above describe the version read at start-up "
                  f"— re-run the sets you edited.")


if __name__ == "__main__":
    main()

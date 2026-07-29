#!/usr/bin/env python3
"""Pull real PGN for a player and filter it, so game scores are never retyped.

    .claude/skills/opening-research/scripts/fetch-games.py Karpov --eco C98 --opponent Unzicker
    … fetch-games.py Morphy --eco C4 --result 0-1 --max-plies 60
    … fetch-games.py Capablanca --year 1914 --print          # full move lists

Archives come from pgnmentor.com, whose file names are the player names on
<https://www.pgnmentor.com/files.html>. They are cached under .engine/pgn/ (that
directory is gitignored) so a second query costs nothing.

`--eco` matches a prefix, so C4 catches every Four Knights code. Without
`--print` you get one line per game: players, event, year, result, ECO and
length, which is enough to choose one.
"""
import argparse
import io
import os
import re
import subprocess
import sys
import urllib.request
import zipfile

try:
    import chess                    # only used to replay what we found
except ModuleNotFoundError:
    chess = None                    # run under the venv python to get this check

ROOT = subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)),
                       "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True, check=True).stdout.strip()
CACHE = os.path.join(ROOT, ".engine", "pgn")
URL = "https://www.pgnmentor.com/players/{}.zip"


def archive(player):
    path = os.path.join(CACHE, f"{player}.pgn")
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print(f"fetching {URL.format(player)}", file=sys.stderr)
        # pgnmentor answers urllib's default User-Agent with HTTP 465.
        request = urllib.request.Request(URL.format(player), headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(request, timeout=120) as r:
            blob = r.read()
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            name = next(n for n in z.namelist() if n.endswith(".pgn"))
            with open(path, "wb") as f:
                f.write(z.read(name))
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()


RESULTS = ("1-0", "0-1", "1/2-1/2", "*")


def mainline(movetext):
    """The mainline SAN, in the shape `moves` takes in an opening module.

    Annotated PGN is the danger here, not malformed PGN: a comment containing a
    legal move (`{Nf3 was better}`) would otherwise be spliced into the game as a
    real move and produce a game that replays legally and is not the game that
    was played. Sidelines, comments and glyphs all have to go before tokenising.
    """
    text = re.sub(r"\{[^}]*\}", " ", movetext)          # {comments}
    text = re.sub(r";[^\n]*", " ", text)                # ; to end of line
    while "(" in text:                                  # (sidelines), nested
        stripped = re.sub(r"\([^()]*\)", " ", text)
        if stripped == text:
            break
        text = stripped
    text = re.sub(r"\$\d+", " ", text)                  # $1 NAGs
    text = re.sub(r"\d+\.(\.\.)?", " ", text)           # move numbers
    out = []
    for token in text.split():
        if token in RESULTS or token.startswith("("):
            continue
        out.append(token.rstrip("!?"))                  # Nf3!?, Bc5!! …
    return " ".join(out)


def games(text):
    for block in re.split(r"\n\n(?=\[Event)", text):
        tags = dict(re.findall(r'\[(\w+)\s+"([^"]*)"\]', block))
        parts = block.split("]\n\n")
        yield tags, mainline(parts[-1] if len(parts) > 1 else "")


def replay(san):
    """None if the move list replays, else the ply that broke — the same check
    src/build.py runs, done here so a bad score never reaches a content file."""
    board = chess.Board()
    for i, move in enumerate(san.split(), 1):
        try:
            board.push_san(move)
        except Exception as e:
            return f"does not replay at ply {i} '{move}': {e}"
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("player")
    p.add_argument("--eco", default="", help="ECO prefix, e.g. C67 or C4")
    p.add_argument("--opponent", default="")
    p.add_argument("--year", default="")
    p.add_argument("--result", default="", choices=["", "1-0", "0-1", "1/2-1/2"])
    p.add_argument("--max-plies", type=int, default=0)
    p.add_argument("--print", action="store_true", help="print the SAN move list")
    args = p.parse_args()

    hits = 0
    for tags, san in games(archive(args.player)):
        names = tags.get("White", "") + " " + tags.get("Black", "")
        if args.eco and not tags.get("ECO", "").startswith(args.eco):
            continue
        if args.opponent and args.opponent.lower() not in names.lower():
            continue
        if args.year and not tags.get("Date", "").startswith(args.year):
            continue
        if args.result and tags.get("Result") != args.result:
            continue
        plies = len(san.split())
        if args.max_plies and plies > args.max_plies:
            continue
        hits += 1
        broken = replay(san) if chess else None
        print(f"{tags.get('White','?')} – {tags.get('Black','?')} | {tags.get('Event','?')} "
              f"{tags.get('Date','?')[:4]} | {tags.get('Result','?')} | {tags.get('ECO','?')} "
              f"| {plies} plies ({(plies + 1) // 2} moves)"
              f"{'  !! ' + broken if broken else ''}")
        if args.print:
            # A game that does not replay is not a game -- printing it invites a
            # copy-paste of moves that were never played.
            print(f"  {san}\n" if not broken else "  (not printed: does not replay)\n")

    if not hits:
        print("no games matched — check the player file name at "
              "https://www.pgnmentor.com/files.html", file=sys.stderr)


if __name__ == "__main__":
    main()

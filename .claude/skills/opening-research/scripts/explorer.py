#!/usr/bin/env python3
"""Count what master games actually did from a position, so a `record` is never guessed.

    explorer.py "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5"
    explorer.py --file positions.txt --top 8
    explorer.py --fetch RuyLopezMarshall,RuyLopezOpen "e4 e5 Nf3 Nc6 Bb5"

Each position prints how many games in the corpus reached it, how they finished,
and the replies played from it. The score line is the one a line's `record` key
ships: White wins / draws / Black wins, as percentages of the games that got there.

The corpus is every PGN under `.engine/openings/` — pgnmentor's per-variation
archives, whose names are the zip files on <https://www.pgnmentor.com/files.html>.
`--fetch` pulls the ones you name and caches them there (gitignored, like the
player archives `fetch-games.py` uses).

Positions are matched by EPD, not by move order, so a game that transposes into
the position is counted and a game that plays the same moves in a different order
is not counted twice. One pass over the corpus answers every position you pass,
which is what makes a whole opening's worth of records affordable: 190k games is
about three minutes, so ask for all of them at once.
"""
import argparse
import io
import multiprocessing
import os
import re
import subprocess
import sys
import urllib.request
import zipfile

try:
    import chess
except ModuleNotFoundError:
    raise SystemExit("run this under the project venv: .venv/bin/python3 "
                     ".claude/skills/opening-research/scripts/explorer.py …")

ROOT = subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)),
                       "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True, check=True).stdout.strip()
CACHE = os.path.join(ROOT, ".engine", "openings")
URL = "https://www.pgnmentor.com/openings/{}.zip"

RESULTS = ("1-0", "0-1", "1/2-1/2", "*")


def fetch(names):
    os.makedirs(CACHE, exist_ok=True)
    for name in names:
        path = os.path.join(CACHE, f"{name}.pgn")
        if os.path.exists(path):
            continue
        print(f"fetching {URL.format(name)}", file=sys.stderr)
        # pgnmentor answers urllib's default User-Agent with HTTP 465.
        request = urllib.request.Request(URL.format(name), headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(request, timeout=180) as r:
            blob = r.read()
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            member = next(n for n in z.namelist() if n.endswith(".pgn"))
            with open(path, "wb") as f:
                f.write(z.read(member))


def mainline(movetext, limit):
    """The first `limit` SAN tokens of the mainline.

    Same stripping as fetch-games.py: a comment holding a legal move would
    otherwise be spliced in as a move that was never played.
    """
    text = re.sub(r"\{[^}]*\}", " ", movetext)
    text = re.sub(r";[^\n]*", " ", text)
    while "(" in text:
        stripped = re.sub(r"\([^()]*\)", " ", text)
        if stripped == text:
            break
        text = stripped
    text = re.sub(r"\$\d+", " ", text)
    text = re.sub(r"\d+\.(\.\.)?", " ", text)
    out = []
    for token in text.split():
        if token in RESULTS:
            continue
        out.append(token.rstrip("!?"))
        if len(out) >= limit:
            break
    return out


def blocks(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        text = f.read()
    for block in re.split(r"\n\n(?=\[Event)", text):
        yield dict(re.findall(r'\[(\w+)\s+"([^"]*)"\]', block)), block


def game_key(tags):
    return tuple(tags.get(t, "") for t in ("White", "Black", "Date", "Event", "Round", "Result"))


def keys_of(path):
    """Every game key in one archive, for the duplicate pass. No board work."""
    return path, [game_key(tags) for tags, _ in blocks(path) if tags.get("White")]


def scan_file(job):
    """Tally one archive against the target EPDs. Runs in a worker process."""
    path, targets, depth, contested = job
    tally = {epd: {"1-0": 0, "0-1": 0, "1/2-1/2": 0, "next": {}} for epd in targets}
    seen_games = set()
    for tags, block in blocks(path):
        result = tags.get("Result")
        if result not in ("1-0", "0-1", "1/2-1/2"):
            continue
        # The archives are cut by variation and about 1% of games sit in two of
        # them, so one archive owns each repeated key and the others skip it.
        key = game_key(tags)
        if contested.get(key, path) != path or key in seen_games:
            continue
        seen_games.add(key)
        parts = block.split("]\n\n")
        moves = mainline(parts[-1] if len(parts) > 1 else "", depth + 1)
        if not moves:
            continue

        board = chess.Board()
        hit = set()
        for i, san in enumerate(moves):
            epd = board.epd()
            if epd in tally and epd not in hit:
                hit.add(epd)
                tally[epd][result] += 1
                tally[epd]["next"][san] = tally[epd]["next"].get(san, 0) + 1
            if i >= depth:
                break
            try:
                board.push_san(san)
            except Exception:
                break       # a game we cannot replay is not evidence of anything
        epd = board.epd()
        if epd in tally and epd not in hit:
            tally[epd][result] += 1
    return tally


def epd_of(prefix):
    board = chess.Board()
    for san in prefix.split():
        board.push_san(san)
    return board.epd()


def split(counts, total):
    """Whole percentages that add up to 100, by largest remainder.

    Rounding each share on its own gives 40/32/27 as often as not, and a bar
    built from three numbers summing to 99 is a bar with a gap in it.
    """
    if not total:
        return [0] * len(counts)
    exact = [100 * n / total for n in counts]
    out = [int(x) for x in exact]
    for i in sorted(range(len(out)), key=lambda i: exact[i] - out[i], reverse=True)[:100 - sum(out)]:
        out[i] += 1
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("positions", nargs="*", help="SAN prefixes, e.g. \"e4 e5 Nf3 Nc6 Bb5\"")
    p.add_argument("--file", help="one SAN prefix per line; # comments and blanks ignored")
    p.add_argument("--fetch", default="", help="comma-separated pgnmentor openings archives to cache first")
    p.add_argument("--top", type=int, default=6, help="replies to list per position")
    p.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    args = p.parse_args()

    if args.fetch:
        fetch([n for n in args.fetch.split(",") if n])

    prefixes = list(args.positions)
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            prefixes += [ln.split("#")[0].strip() for ln in f]
    prefixes = [x for x in prefixes if x]
    if not prefixes:
        raise SystemExit("nothing to look up — pass a SAN prefix or --file")

    targets = {}
    for prefix in prefixes:
        try:
            targets.setdefault(epd_of(prefix), prefix)
        except Exception as e:
            raise SystemExit(f"'{prefix}' is not playable: {e}")
    depth = max(len(x.split()) for x in prefixes)

    files = sorted(os.path.join(CACHE, n) for n in os.listdir(CACHE)) if os.path.isdir(CACHE) else []
    files = [f for f in files if f.endswith(".pgn")]
    if not files:
        raise SystemExit(f"no archives in {CACHE} — pass --fetch RuyLopezMarshall,… first")
    print(f"{len(files)} archive(s), {len(targets)} position(s), to ply {depth}", file=sys.stderr)

    with multiprocessing.Pool(min(args.jobs, len(files))) as pool:
        owner, contested = {}, {}
        for path, keys in pool.map(keys_of, files):
            for key in keys:
                if owner.setdefault(key, path) != path:
                    contested[key] = owner[key]
        print(f"{len(contested)} game(s) appear in more than one archive", file=sys.stderr)
        parts = pool.map(scan_file, [(f, set(targets), depth, contested) for f in files])

    total = {epd: {"1-0": 0, "0-1": 0, "1/2-1/2": 0, "next": {}} for epd in targets}
    for part in parts:
        for epd, row in part.items():
            for key in ("1-0", "0-1", "1/2-1/2"):
                total[epd][key] += row[key]
            for san, n in row["next"].items():
                total[epd]["next"][san] = total[epd]["next"].get(san, 0) + n

    for epd, prefix in targets.items():
        row = total[epd]
        games = row["1-0"] + row["0-1"] + row["1/2-1/2"]
        print(f"\n{prefix}")
        if not games:
            print("  no games reached this position")
            continue
        white, draw, black = split((row["1-0"], row["1/2-1/2"], row["0-1"]), games)
        print(f"  {games} games — white {white}%  draw {draw}%  black {black}%  "
              f"(white scores {100 * (row['1-0'] + row['1/2-1/2'] / 2) / games:.1f}%)")
        print(f'  "record": {{"at": {len(prefix.split())}, "games": {games}, '
              f'"white": {white}, "draw": {draw}, "black": {black}}},')
        for san, n in sorted(row["next"].items(), key=lambda kv: -kv[1])[:args.top]:
            print(f"    {san:6s} {n:6d}  {100 * n / games:4.1f}%")


if __name__ == "__main__":
    main()

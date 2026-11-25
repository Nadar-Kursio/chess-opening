"""Lichess's opening explorer and cloud evaluations, asked one position at a time and cached.

Three sources, all keyed by EPD so transpositions meet, as everywhere else in the skill:

  club     what 1200-2000 rated players chose (blitz, rapid, classical), over one window of
           months of the Lichess database. Every game in the window, not a sample of the stream.
  masters  over-the-board games between strong players: the `record` win bars and model games.
  cloud    Stockfish analyses Lichess users ran and shared, at whatever depth they reached.
           Research only: what ships is scored by .engine/stockfish, at one depth.

Lichess asks API clients to send one request at a time and to wait a full minute after a 429.
Every process on the box takes the same lock around a request, so several scripts and agents
running at once still look like one polite client. The explorer publishes no limit and sends no
rate headers, so the gap between requests is learned, for each endpoint on its own: each 429
doubles it (up to MAX_PAUSE) after the minute's wait, and every CALM answers in a row shorten
it again. The cloud's limit is a quota more than a rate, so a caller that can do without it
(the dossier) asks impatiently: a 429 rests the cloud for REST seconds instead of waiting. Answers are appended to files under
.engine/lichess/ (gitignored, shared by every worktree through the .engine symlink), so a
position is fetched once ever; a re-run after a content edit only asks for what is new.

The club explorer needs a personal API token (any account, no scopes): ~/.config/lichess-token,
or LICHESS_TOKEN. Masters and cloud answer without one.
"""
import fcntl
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

from _engine import ROOT

CACHE = os.path.join(ROOT, ".engine", "lichess")
EXPLORER = "https://explorer.lichess.ovh"
CLOUD = "https://lichess.org/api/cloud-eval"
RATINGS = (1200, 1400, 1600, 1800)
SPEEDS = "blitz,rapid,classical"
MOVES = 40
MAX_PAUSE = 4.0
CALM = 50
REST = 300
_pace = {}


class Busy(Exception):
    """Lichess asked for a pause, and the caller said it would rather go without the answer."""
MATE = 10000
START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"


def token():
    if os.environ.get("LICHESS_TOKEN"):
        return os.environ["LICHESS_TOKEN"].strip()
    path = os.path.expanduser("~/.config/lichess-token")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    return None


def latest_month():
    """The newest whole month the club explorer has indexed, as YYYY-MM.

    The explorer lags by a few weeks, so the month before the current one may still be empty:
    step back until the starting position has games."""
    year, month = time.gmtime().tm_year, time.gmtime().tm_mon
    for _ in range(4):
        month -= 1
        if month == 0:
            year, month = year - 1, 12
        stamp = f"{year}-{month:02d}"
        reply = _get(f"{EXPLORER}/lichess", _club_params(_fen(START), stamp, stamp, moves=1), auth=True)
        if reply and reply["white"] + reply["draws"] + reply["black"]:
            return stamp
    raise SystemExit("the club explorer has no games in the last four months: is the token valid?")



def _fen(epd):
    return f"{epd} 0 1"


def _club_params(fen, since, until, moves=MOVES):
    return {"variant": "standard", "speeds": SPEEDS, "ratings": ",".join(map(str, RATINGS)),
            "since": since, "until": until, "moves": moves, "topGames": 0, "recentGames": 0, "fen": fen}


def _get(url, params, auth=False, patient=True):
    """One request, under the box-wide lock. None when Lichess has nothing for the position."""
    os.makedirs(CACHE, exist_ok=True)
    headers = {"User-Agent": "chesslab-course-builder", "Accept": "application/json"}
    key = token()
    if auth and not key:
        raise SystemExit("the club explorer needs a Lichess API token: put one (no scopes needed, "
                         "https://lichess.org/account/oauth/token/create) in ~/.config/lichess-token")
    if key:
        # Sent everywhere it exists: cloud-eval allows a signed-in client far more than about one
        # request a second, which is where an anonymous one meets 429 and a minute's wait.
        headers["Authorization"] = f"Bearer {key}"
    request = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}", headers=headers)
    pace = _pace.setdefault(url, {"pause": 0.05, "calm": 0})
    with open(os.path.join(CACHE, ".network.lock"), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        for attempt in range(6):
            try:
                with urllib.request.urlopen(request, timeout=30) as r:
                    body = json.load(r)
                pace["calm"] += 1
                if pace["calm"] >= CALM:
                    pace.update(pause=max(0.05, pace["pause"] * 0.8), calm=0)
                time.sleep(pace["pause"])
                return body
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return None
                if e.code == 401:
                    raise SystemExit(f"Lichess refused the token for {url} (401)")
                wait = 60 if e.code == 429 else 5 * (attempt + 1)
                if e.code == 429:
                    pace.update(pause=min(MAX_PAUSE, max(0.5, pace["pause"] * 2)), calm=0)
                    if not patient:
                        raise Busy(url)
                print(f"  Lichess answered {e.code} for {url}: waiting {wait} s, then one request "
                      f"every {pace['pause']:.2f} s", file=sys.stderr, flush=True)
                time.sleep(wait)
            except (urllib.error.URLError, TimeoutError):
                time.sleep(5 * (attempt + 1))
        raise SystemExit(f"Lichess did not answer {url} after six tries")


class _Store:
    """An append-only file of answers, one JSON object per line, loaded once per process."""

    def __init__(self, name):
        self.path = os.path.join(CACHE, f"{name}.jsonl")
        self.rows = {}
        if os.path.exists(self.path):
            with open(self.path, encoding="utf-8") as f:
                for raw in f:
                    try:
                        row = json.loads(raw)
                    except ValueError:
                        continue        # a line cut short by a killed run
                    self.rows[row["epd"]] = row

    def __contains__(self, epd):
        return epd in self.rows

    def __getitem__(self, epd):
        return self.rows[epd]

    def add(self, row):
        row = {**row, "t": int(time.time())}
        self.rows[row["epd"]] = row
        os.makedirs(CACHE, exist_ok=True)
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(row, separators=(",", ":")) + "\n")


def _moves(reply):
    """[[san, white, draws, black], ...], most played first."""
    rows = [[m["san"], m["white"], m["draws"], m["black"]] for m in (reply or {}).get("moves", [])]
    return sorted(rows, key=lambda r: -(r[1] + r[2] + r[3]))


class Club:
    """What club players chose in each position, in one window of months.

    get(epd) answers like the dicts club_counts() used to return: a Counter of SAN to games, or
    None when nobody reached the position. results(epd) keeps white/draws/black per move for the
    dossier's win rates."""

    def __init__(self, since=None, until=None):
        self.until = until or since or latest_month()
        self.since = since or self.until
        window = self.since if self.since == self.until else f"{self.since}_{self.until}"
        self.store = _Store(f"club-{RATINGS[0]}-{RATINGS[-1] + 200}-{window}")
        self.asked = 0

    @property
    def source(self):
        """'Lichess rated games, October 2026', the words every file and page has used."""
        def month(stamp):
            return time.strftime("%B %Y", time.strptime(stamp, "%Y-%m"))
        if self.since == self.until:
            return f"Lichess rated games, {month(self.since)}"
        return f"Lichess rated games, {month(self.since)} to {month(self.until)}"

    def results(self, epd):
        if epd not in self.store:
            self.asked += 1
            reply = _get(f"{EXPLORER}/lichess", _club_params(_fen(epd), self.since, self.until), auth=True)
            self.store.add({"epd": epd, "moves": _moves(reply)})
        return self.store[epd]["moves"]

    def get(self, epd, default=None):
        counts = Counter({san: w + d + b for san, w, d, b in self.results(epd)})
        return counts if counts else default

    def games(self, epd):
        return sum(w + d + b for _, w, d, b in self.results(epd))


class Masters:
    """Master games from each position: the moves, how they finished, and the best-known games."""

    def __init__(self):
        self.store = _Store("masters")
        self.asked = 0

    source = "Lichess masters explorer (over-the-board games, both players 2200+)"

    def lookup(self, epd):
        if epd not in self.store:
            self.asked += 1
            reply = _get(f"{EXPLORER}/masters", {"fen": _fen(epd), "moves": MOVES, "topGames": 15})
            reply = reply or {}
            self.store.add({"epd": epd, "white": reply.get("white", 0), "draws": reply.get("draws", 0),
                            "black": reply.get("black", 0), "moves": _moves(reply),
                            "games": [{"id": g["id"], "white": g["white"]["name"], "black": g["black"]["name"],
                                       "elo": [g["white"].get("rating"), g["black"].get("rating")],
                                       "year": g.get("year"), "result": g.get("winner") or "draw"}
                                      for g in reply.get("topGames", [])]})
        return self.store[epd]

    def record(self, epd, at):
        """The `record` a line ships for the position at ply `at`, or None with no master games."""
        row = self.lookup(epd)
        counts = [row["white"], row["draws"], row["black"]]
        total = sum(counts)
        if not total:
            return None
        white, draw, black = whole_percentages(counts)
        return {"at": at, "games": total, "white": white, "draw": draw, "black": black}


def pgn(game_id):
    """A master game's PGN, by the id the masters explorer lists."""
    store = _Store("masters-pgn")
    if game_id not in store:
        request = urllib.request.Request(f"{EXPLORER}/masters/pgn/{game_id}",
                                         headers={"User-Agent": "chesslab-course-builder"})
        with open(os.path.join(CACHE, ".network.lock"), "w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            with urllib.request.urlopen(request, timeout=30) as r:
                text = r.read().decode("utf-8")
            time.sleep(0.05)
        store.add({"epd": game_id, "pgn": text})
    return store[game_id]["pgn"]


class Cloud:
    """Lichess's shared analyses: centipawns from White's side, and the depth behind them.

    A miss is cached too, so the same unknown position isn't asked about on every run. An
    impatient Cloud answers None while Lichess has asked it to rest, and caches nothing then."""

    def __init__(self, patient=True):
        self.store = _Store("cloud")
        self.asked = 0
        self.patient = patient
        self.resting = 0
        self.skipped = 0

    def known(self, epd):
        """The cached analysis, without asking Lichess."""
        row = self.store.rows.get(epd)
        return row if row and "cp" in row else None

    def lookup(self, epd):
        if epd not in self.store:
            if time.time() < self.resting:
                self.skipped += 1
                return None
            try:
                reply = _get(CLOUD, {"fen": _fen(epd), "multiPv": 1}, patient=self.patient)
            except Busy:
                self.skipped += 1
                self.resting = time.time() + REST
                print(f"  the cloud is resting for {REST // 60} min: walking on masters and club moves",
                      file=sys.stderr, flush=True)
                return None
            self.asked += 1
            row = {"epd": epd}
            if reply and reply.get("pvs"):
                pv = reply["pvs"][0]
                cp = pv["cp"] if "cp" in pv else (MATE if pv["mate"] > 0 else -MATE)
                row.update({"cp": cp, "depth": reply["depth"], "pv": pv["moves"].split()[:6]})
            self.store.add(row)
        row = self.store[epd]
        return row if "cp" in row else None


def whole_percentages(counts):
    """Whole percentages that add up to exactly 100, by largest remainder."""
    total = sum(counts)
    exact = [100 * n / total for n in counts]
    out = [int(x) for x in exact]
    for i in sorted(range(len(counts)), key=lambda i: out[i] - exact[i])[:100 - sum(out)]:
        out[i] += 1
    return out

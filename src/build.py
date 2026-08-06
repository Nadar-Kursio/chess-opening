"""Compile the course: validate every line, generate move intel, emit the JSON.

Run from the repo root:

    python3 src/build.py --emit     validate everything, write web/content/

Every move in every line is replayed on a real board. An illegal move fails the
build loudly, naming the opening, line and ply. The site under web/ consumes
what this writes; nothing else does.
"""
import json
import os
import re
import shutil
from html import escape

try:
    import chess
except ModuleNotFoundError:
    # The dependency lives in a virtualenv, so the system python3 will not find
    # it. Saying so beats a traceback that only names the missing module.
    raise SystemExit(
        "python-chess is not installed for this interpreter.\n"
        "\n"
        "  Run the build with the project's virtualenv:\n"
        "    .venv/bin/python3 src/build.py\n"
        "\n"
        "  or activate it once for this shell:\n"
        "    source .venv/bin/activate\n"
        "\n"
        "  If .venv does not exist yet:\n"
        "    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
    )

from content.common import COMMON
from content.openings import load
from content.sections import SECTIONS
from content.structures import STRUCTURES
from engine.board import board_array
from engine.intel import move_data
from engine.lesson import build_lesson
from engine.notes import parse_notes

SRC = os.path.dirname(os.path.abspath(__file__))
NOTES = os.path.join(SRC, "content", "notes")
EVALS = os.path.join(SRC, "content", "evals")
PRIMER = os.path.join(SRC, "content", "primer.html")
WEB_CONTENT = os.path.join(os.path.dirname(SRC), "web", "content")

# The openings the app under web/ ships. --emit writes only these; validation
# still covers the whole catalogue, so an opening joins the new site by giving
# its lines slugs and adding its id here — nothing else changes.
PORTED = ["ruylopez", "scholarsmate", "friedliver"]

OPENING_NOTE = ("The starting position. White moves first — and that single tempo "
                "is the whole reason opening theory exists.")


LINE_EXTRAS = ("tier", "drill", "plan", "record", "side")

RECORD_KEYS = ("at", "games", "white", "draw", "black")

TIERS = ("Foundation", "Structure", "Plans", "Mastery")
SEVERITIES = ("blunder", "inaccuracy", "playable")

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def slug_errors(op_id, lines):
    """What the lines' slugs get wrong, for an opening the web app ships.

    Slugs are authored, not derived: line names carry '—', '×' and '!?', which
    no derivation rule would turn into a URL anyone should have to read. A slug
    is the line's stable identity — its URL and its progress key — so it must
    exist, read like a path segment, and never collide within the opening.
    """
    out = []
    seen = {}
    for i, line in enumerate(lines):
        where = f"{op_id} / line {i} '{line.get('name')}'"
        slug = line.get("slug")
        if not slug or not SLUG_RE.match(slug):
            out.append(f"{where}: needs a slug — lowercase letters, digits and hyphens")
            continue
        if slug in seen:
            out.append(f"{where}: slug '{slug}' already belongs to line {seen[slug]}")
        seen[slug] = i
    return out


def san_overclaim(board, move, san):
    """What an authored SAN token claims and the move does not do, or None.

    Legality is not enough. python-chess reads `Bxd4` on an empty d4 as `Bd4` and
    `Qh4#` on a mere check as `Qh4+`, so a marker that lies is legal, silent, and
    ships to the learner as a fact about the position.

    Disambiguation is deliberately not compared: `Nge7` where `Ne7` is
    unambiguous names the knight for the reader, and that is a choice, not a
    claim.
    """
    if ("x" in san) != board.is_capture(move):
        return "says a capture that is not one" if "x" in san else "is a capture and does not say so"
    if san.endswith("#"):
        after = board.copy()
        after.push(move)
        if not after.is_checkmate():
            return "claims mate, and the move is not mate"
    elif san.endswith("+") and not board.gives_check(move):
        return "claims check, and the move gives none"
    return None


def record_errors(where, record, moves):
    """What a line's `record` gets wrong about the games behind it, if anything.

    The numbers come from counting real games (the `explorer.py` script in the
    research skill), so nothing here can tell a true count from an invented one.
    What it can do is stop the two mistakes that make the bar lie about itself:
    shares that do not add up to a whole result, and a ply that is not on this
    line -- `at` names the position counted, and a record measured somewhere the
    reader never visits is a number about a different opening.
    """
    out = []
    missing = [k for k in RECORD_KEYS if k not in record]
    if missing:
        return [f"{where}: record is missing {missing}"]
    if not 0 <= record["at"] <= len(moves):
        out.append(f"{where}: record counted at ply {record['at']}, "
                   f"and the line is {len(moves)} moves long")
    share = record["white"] + record["draw"] + record["black"]
    if share != 100:
        out.append(f"{where}: record shares add up to {share}%, not 100%")
    if record["games"] < 1:
        out.append(f"{where}: record covers no games")
    return out


class BranchIndex:
    """The opening's deviations, resolved from SAN prefixes to positions.

    Deviations are authored by the position they answer, not by a ply number.
    The Italian's main line and its Two Knights line share their first five
    moves, and the Four Knights transposes into three of the same positions;
    keyed by ply, that content would have to be written out several times and
    would drift apart the first time one copy was edited.

    EPD, not FEN: it carries castling rights and the en-passant square but not
    the move counters, which is exactly what position identity means here.

    Each set is built at most once and handed out by index, so a position four
    lines pass through still ships its deviations one time.
    """

    def __init__(self, op, errors, notes, evals):
        self.op_id = op["id"]
        self.errors = errors
        self.notes = notes
        self.evals = evals
        self.sets = []          # what gets emitted
        self.authored = {}      # epd -> raw entries
        self.built = {}         # epd -> index into self.sets
        self.played = {}        # epd -> the moves the lines themselves play there
        for prefix, entries in (op.get("branches") or {}).items():
            board = chess.Board()
            try:
                for san in prefix.split():
                    board.push_san(san)
            except Exception as e:
                errors.append(f"{op['id']}: branch prefix '{prefix}' is not playable: {e}")
                continue
            if board.epd() in self.authored:
                errors.append(f"{op['id']}: branch prefix '{prefix}' reaches a position "
                              f"another prefix already covers")
                continue
            self.authored[board.epd()] = entries

    def slot(self, board, where, ply, played=None):
        epd = board.epd()
        if played is not None:
            self.played.setdefault(epd, set()).add(played)
        if epd not in self.authored:
            return None
        if epd not in self.built:
            self.built[epd] = len(self.sets)
            self.sets.append(build_branches(self.op_id, f"{where} / ply {ply}", board,
                                            self.authored[epd], ply, self.errors,
                                            self.notes, self.evals))
        return self.built[epd]

    def unused(self, op_id):
        return [f"{op_id}: branches authored for a position no line reaches"
                for epd in self.authored if epd not in self.built]

    def dead(self, op_id):
        """Entries that can never render, because they are the move the line plays.

        The renderer drops a deviation that matches the line's own next move --
        rightly, since it is not a deviation from that line. When several lines
        share a position that is harmless: the entry still shows for the others.
        When only one line passes through, the entry is invisible, the build is
        happy, and the author has no way to find out.
        """
        out = []
        for epd, entries in self.authored.items():
            plays = self.played.get(epd, set())
            for br in entries:
                if plays and plays == {br.get("san")}:
                    out.append(f"{op_id}: deviation '{br.get('san')}' is the move every line "
                               f"plays there, so it never renders")
        return out


def build_branches(op_id, where, board, entries, ply, errors, notes, evals):
    """Validate and build the deviations attached to one position.

    `board` is the position the branches answer, so every branch is parsed
    against the real position and every continuation is replayed from after the
    branch move.

    A branch is built in the same ply shape as a main line. That is the whole
    trick: the board, the arrows, the move tape and the commentary all render a
    deviation with no code of their own.

    A branch that happens to be the move some line plays is NOT filtered here.
    Positions are shared, so the same move can be a deviation from one line and
    the main move of another; only the line being rendered knows which, and it
    drops it at render time.
    """
    out = []
    for br in entries:
        san = br.get("san", "")
        if br.get("severity") not in SEVERITIES:
            errors.append(f"{where} branch '{san}': severity {br.get('severity')!r} "
                          f"is not one of {SEVERITIES}")
        if br.get("tier") and br["tier"] not in TIERS:
            errors.append(f"{where} branch '{san}': tier {br['tier']!r} is not one of {TIERS}")

        work = board.copy()
        try:
            work.parse_san(san)
        except Exception as e:
            errors.append(f"{where} branch '{san}': {e}")
            continue

        plies, num = [], ply
        for i, step in enumerate([san] + br.get("line", "").split()):
            try:
                played = work.parse_san(step)
            except Exception as e:
                errors.append(f"{where} branch '{san}' / continuation {i} '{step}': {e}")
                break
            claim = san_overclaim(work, played, step)
            if claim:
                errors.append(f"{where} branch '{san}' / continuation {i} '{step}': {claim}")
            mover = "w" if work.turn == chess.WHITE else "b"
            arrows, tactics = move_data(work, played)
            work.push(played)
            plies.append({
                "san": step, "fen": board_array(work),
                "from": chess.square_name(played.from_square),
                "to": chess.square_name(played.to_square),
                "num": f"{(num + 1) // 2}.{'' if mover == 'w' else '..'}{step}",
                "turn": mover, "check": work.is_check(),
                "arrows": arrows, "tactics": tactics,
            })
            notes.attach(work, plies[-1])
            evals.attach(op_id, work, plies[-1], f"{where} branch '{san}' / {step}")
            num += 1

        record = {"san": san, "sev": br["severity"], "why": br["why"], "plies": plies}
        for key in ("tier", "name", "see"):
            if br.get(key):
                record[key] = br[key]
        out.append(record)
    return out


class EvalIndex:
    """Every scored position, keyed by EPD, across every opening that has a file.

    One index rather than one per opening, because a position is a position: the
    Four Knights transposing into a Ruy Lopez position gets the Ruy Lopez's
    number without either file knowing about the other, exactly the way branches
    and personal notes already work.

    A missing score is a warning, not an error. The files are generated from the
    content, so any edit to a line puts them out of date, and stopping the build
    over that would mean a typo in a note could not be fixed without an hour of
    engine time first. The count is printed on every build instead, and it is the
    only thing that will tell you the bar has gaps.
    """

    def __init__(self, errors):
        self.scores = {}        # epd -> {"v": cp, "n": mate}
        self.covered = set()    # opening ids with a file of their own
        self.skipped = set()    # model games their file deliberately left out
        self.depth = None
        self.engine = None
        self.generated = None
        self.used = set()
        self.missing = []
        for name in sorted(os.listdir(EVALS)) if os.path.isdir(EVALS) else []:
            if not name.endswith(".json"):
                continue
            self.covered.add(name[:-len(".json")])
            with open(os.path.join(EVALS, name), encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except ValueError as e:
                    errors.append(f"evals/{name}: {e}")
                    continue
            # One depth for every number on the page. Two positions searched to
            # different depths cannot be compared, and the bar is on screen for
            # both of them precisely so they can be.
            if self.depth is not None and data.get("depth") != self.depth:
                errors.append(f"evals/{name}: searched at depth {data.get('depth')}, and "
                              f"another file used {self.depth} — one bar, one depth")
                continue
            self.depth = data.get("depth")
            self.engine = data.get("engine")
            self.generated = data.get("generated")
            self.skipped.update(data.get("skipped") or [])
            for epd, score in (data.get("scores") or {}).items():
                if not isinstance(score, dict) or not isinstance(score.get("v"), int):
                    errors.append(f"evals/{name}: {epd!r} has no centipawn score")
                    continue
                self.scores[epd] = score

    def attach(self, op_id, board, ply, where, scope=None):
        """Hang this position's score off the ply record, if there is one.

        Gated on the opening having a file of its own, and not merely on the
        position happening to be in one. Scores are keyed by position, so a
        transposition into a scored line would otherwise light up a bar for four
        plies of an opening that has none -- and a bar that comes and goes inside
        one variation is worse than no bar at all.

        `scope` is the model game a position belongs to, if any. A game its file
        names as skipped is out of scope rather than unscored: it draws no bar and
        is not reported as a gap. That is the same all-or-nothing rule one level
        down -- a game whose bar stopped at move fifteen would read as a bug, so
        a game is either scored throughout or not at all.
        """
        if op_id not in self.covered or (scope is not None and scope in self.skipped):
            return
        score = self.scores.get(board.epd())
        if score is None:
            self.missing.append(where)
            return
        self.used.add(board.epd())
        ply["ev"] = score["v"]
        if score.get("n") is not None:
            ply["mate"] = score["n"]

    def report(self):
        if not self.scores:
            return
        print(f"engine scores: {len(self.used)} of {len(self.scores)} positions used, "
              f"depth {self.depth}, {self.engine}")
        for game in sorted(self.skipped):
            print(f"  game '{game}' is deliberately unscored")
        if self.missing:
            print(f"  warning: {len(self.missing)} positions have no score — "
                  f"re-run position-evals.py. First: {self.missing[0]}")
        stale = len(self.scores) - len(self.used)
        if stale:
            print(f"  warning: {stale} scored positions no line reaches any more")


class NoteIndex:
    """One opening's personal notes, resolved from moves to positions.

    Same trick as BranchIndex and for the same reason: a note is authored after
    the move it is about, and stored against the position that move reaches. So
    a note written once in whatever move order the author happens to use shows
    up in every line, deep dive and deviation of that opening that arrives
    there -- and the transposition that would break a ply-keyed note is simply
    not a case this has to handle.

    The price is that a note can attach to nothing at all, when the author's
    move order reaches a position no line does. That is a warning rather than an
    error: the notes file is prose, and stopping the whole build over one
    sentence with nowhere to go would hide the twenty that landed.

    Prose here is escaped, unlike the authored content in content/ -- this file
    is typed casually and a stray '<' should not be the author's problem.
    """

    def __init__(self, op_id, errors):
        self.notes = {}         # epd -> what the ply record carries
        self.origin = {}        # epd -> where it was written, for the report
        self.used = set()
        try:
            with open(os.path.join(NOTES, f"{op_id}.txt"), encoding="utf-8") as f:
                text = f.read()
        except FileNotFoundError:
            return              # an opening nobody has taken notes on yet

        where = f"notes/{op_id}.txt"
        blocks, problems = parse_notes(text, where)
        errors.extend(problems)

        for block in blocks:
            board = chess.Board()
            for item in block["items"]:
                at = f"{where} line {item['at']} '{item['san']}'"
                try:
                    move = board.parse_san(item["san"])
                except Exception as e:
                    # Every note after this one would be a move out of step, so
                    # the block stops here rather than reporting all of them.
                    errors.append(f"{at}: {e}")
                    break
                claim = san_overclaim(board, move, item["san"])
                if claim:
                    errors.append(f"{at}: {claim}")
                board.push(move)
                note = self.record(item)
                if note is None:
                    continue
                epd = board.epd()
                if epd in self.notes:
                    errors.append(f"{at}: a note is already attached to this position")
                    continue
                self.notes[epd] = note
                self.origin[epd] = f"'{block['title']}' / {item['san']} (line {item['at']})"

    @staticmethod
    def record(item):
        note = {}
        if item.get("text"):
            note["text"] = escape(item["text"])
        for key in ("arrows", "spots"):
            if item.get(key):
                note[key] = item[key]
        return note or None

    def attach(self, board, ply):
        """Hang the note for this position, if there is one, off the ply record."""
        note = self.notes.get(board.epd())
        if note is not None:
            self.used.add(board.epd())
            ply["mine"] = note

    def unplaced(self, op_id):
        return [f"{op_id}: note on {self.origin[epd]} attaches to no position "
                f"this opening reaches"
                for epd in self.notes if epd not in self.used]


def with_deep_line(op):
    """Append the deep dive as an extra line, inheriting the main line's notes.

    A deep dive continues line 0, so it reuses that line's commentary for the
    moves they share and only supplies notes for the moves beyond it. It inherits
    line 0's optional settings too -- a deep dive of a drilled line is drilled.
    """
    deep = op["deep"]
    main = op["lines"][0]
    main_moves = main["moves"].split()
    if deep["moves"].split()[:len(main_moves)] != main_moves:
        raise SystemExit(f"{op['id']}: deep dive does not continue the main line")

    notes = dict(main["notes"])
    notes.update(deep["notes"])
    line = {
        "name": deep["name"],
        "note": deep["note"],
        "moves": deep["moves"],
        "notes": notes,
    }
    # The slug is deliberately NOT inherited: it is the line's identity, and two
    # lines sharing one would collide in the URL and the progress key alike.
    if deep.get("slug"):
        line["slug"] = deep["slug"]
    for key in LINE_EXTRAS:
        value = deep.get(key, main.get(key))
        if value is not None:
            line[key] = value
    return op["lines"] + [line]


def packed_legal(board):
    """Every legal move from this position, as fixed-width 4-char UCI records.

    Fixed width so the client can require a match to land on a record boundary.
    With a variable-width list, a plain substring search would match the tail of
    one move against the head of the next and call an illegal move legal.

    Promotions collapse to their from/to, which is all the drill ever compares --
    and no opening line reaches one.
    """
    seen = []
    for move in board.legal_moves:
        uci = chess.square_name(move.from_square) + chess.square_name(move.to_square)
        if uci not in seen:
            seen.append(uci)
    return "".join(seen)


def build_line(op_id, index, line, errors, branches=None, notes=None, evals=None):
    """Replay one line, returning its ply-by-ply record.

    Every position carries `legal` -- the only chess legality the browser ever
    sees. The board is an input surface on every position, so a ply without the
    list is one where the pieces go quiet; that is why it is unconditional, the
    final position included. It hangs off the ply that OWNS the position, not
    off the move played from it: those are two different positions, and putting
    them on one record invites a fencepost bug.

    Both sides, not just the learner's. The drill only ever asks about the
    learner's moves, but the deviation picker is the learner entering what their
    OPPONENT played, and telling them it is illegal is the one thing it must not
    get wrong.
    """
    board = chess.Board()
    plies = [{
        "san": "", "fen": board_array(board), "from": None, "to": None,
        "note": OPENING_NOTE, "num": "", "turn": "w",
    }]
    where = f"{op_id} / line {index} '{line['name']}'"
    if evals is not None:
        evals.attach(op_id, board, plies[0], f"{where} / the starting position")

    for i, san in enumerate(line["moves"].split()):
        plies[i]["legal"] = packed_legal(board)
        if branches is not None:
            # Built once per position and referenced by index. Four Italian lines
            # share their opening moves, so emitting the set inline would ship
            # the same deviations three or four times over.
            slot = branches.slot(board, f"{op_id} / line {index} '{line['name']}'", i + 1,
                                 played=san)
            if slot is not None:
                plies[i]["bx"] = slot
        try:
            move = board.parse_san(san)
        except Exception as e:
            errors.append(f"{op_id} / line {index} '{line['name']}' / ply {i+1} '{san}': {e}")
            break
        claim = san_overclaim(board, move, san)
        if claim:
            errors.append(f"{op_id} / line {index} '{line['name']}' / ply {i+1} '{san}': {claim}")
        mover = "w" if board.turn == chess.WHITE else "b"
        arrows, tactics = move_data(board, move)   # board is the position BEFORE the move
        board.push(move)

        ply = i + 1
        prefix = "" if mover == "w" else ".."
        plies.append({
            "san": san, "fen": board_array(board),
            "from": chess.square_name(move.from_square),
            "to": chess.square_name(move.to_square),
            "note": line["notes"].get(ply) or COMMON.get(f"{ply}:{san}"),
            "num": f"{(ply + 1) // 2}.{prefix}{san}",
            "turn": mover,
            "check": board.is_check(),
            "arrows": arrows, "tactics": tactics,
        })
        if notes is not None:
            notes.attach(board, plies[-1])
        if evals is not None:
            evals.attach(op_id, board, plies[-1], f"{where} / ply {ply} {san}")

    plies[-1]["legal"] = packed_legal(board)

    if line.get("record"):
        errors.extend(record_errors(f"{op_id} / line {index} '{line['name']}'",
                                    line["record"], line["moves"].split()))
    if line.get("side") and line["side"] not in ("white", "black"):
        errors.append(f"{op_id} / line {index} '{line['name']}': "
                      f"side {line['side']!r} is not a colour")

    out = {"name": line["name"], "note": line.get("note", ""), "plies": plies}
    # Forward the optional line-level settings. Building the record from a fixed
    # set of keys is what would otherwise drop them without a word.
    for key in ("slug", "tier", "plan", "record", "side"):
        if line.get(key):
            out[key] = line[key]
    return out


def build_openings(games, evals):
    errors = []
    warnings = []
    out = []
    written = placed = 0
    for op in load():
        notes = NoteIndex(op["id"], errors)
        branches = BranchIndex(op, errors, notes, evals)
        lines = with_deep_line(op)
        if op["id"] in PORTED:
            errors.extend(slug_errors(op["id"], lines))
        record = {k: v for k, v in op.items() if k not in ("deep", "branches", "games")}
        record["lines"] = [build_line(op["id"], i, line, errors, branches, notes, evals)
                           for i, line in enumerate(lines)]
        if branches.sets:
            record["branchsets"] = branches.sets
        errors.extend(branches.unused(op["id"]))
        warnings.extend(branches.dead(op["id"]))
        # After the lines, because a deviation's positions are only built when a
        # line reaches the position the set hangs off.
        warnings.extend(notes.unplaced(op["id"]))
        written += len(notes.notes)
        placed += len(notes.used)
        games.extend(build_game(op["id"], i, g, errors, evals)
                     for i, g in enumerate(op.get("games") or []))
        out.append(record)

    if errors:
        # Every error is printed before stopping, so one run shows an author every
        # problem rather than one per rebuild. Stopping matters: build_line breaks
        # out of a bad line, so continuing would write a silently truncated line
        # out as though it were the whole of it.
        print("=== CONTENT ERRORS ===")
        for e in errors:
            print(" ", e)
        raise SystemExit(f"{len(errors)} content error(s) — nothing written")
    print("All moves legal, and every capture, check and mate marker true.")
    for w in warnings:
        print("  warning:", w)

    total = missing = 0
    for op in out:
        for line in op["lines"]:
            for p in line["plies"][1:]:
                total += 1
                if not p["note"]:
                    missing += 1
                    print("  no note:", op["id"], "|", line["name"], "|", p["num"])
    print(f"{total} moves, {missing} without commentary")
    if written:
        print(f"{placed} of {written} personal notes attached to a position")
    evals.report()
    return out


def build_game(op_id, index, game, errors, evals):
    """Replay an annotated game into the same ply shape a line uses.

    Without engine intel, deliberately. intel.py is calibrated for openings --
    its idea of a key square is the centre -- so it would caption the middle of a
    mating attack with "controls d5". A game is annotated by its author or not at
    all.
    """
    board = chess.Board()
    plies = [{
        "san": "", "fen": board_array(board), "from": None, "to": None,
        "note": game.get("note", ""), "num": "", "turn": "w",
    }]
    where = f"{op_id} / game '{game['id']}'"
    evals.attach(op_id, board, plies[0], f"{where} / the starting position", game["id"])
    for i, san in enumerate(game["moves"].split()):
        try:
            move = board.parse_san(san)
        except Exception as e:
            errors.append(f"{op_id} / game {index} '{game['id']}' / ply {i + 1} '{san}': {e}")
            break
        claim = san_overclaim(board, move, san)
        if claim:
            errors.append(f"{op_id} / game {index} '{game['id']}' / ply {i + 1} '{san}': {claim}")
        mover = "w" if board.turn == chess.WHITE else "b"
        board.push(move)
        ply = i + 1
        plies.append({
            "san": san, "fen": board_array(board),
            "from": chess.square_name(move.from_square),
            "to": chess.square_name(move.to_square),
            "note": game.get("notes", {}).get(ply),
            "num": f"{(ply + 1) // 2}.{'' if mover == 'w' else '..'}{san}",
            "turn": mover, "check": board.is_check(),
        })
        evals.attach(op_id, board, plies[-1], f"{where} / ply {ply} {san}", game["id"])
    record = {k: game[k] for k in ("id", "name", "tier", "note") if k in game}
    record["op"] = op_id
    record["plies"] = plies
    return record


def build_structures(openings, errors):
    """Turn each authored structure into a renderable card.

    `openings` is the already-built catalogue, because the list of openings that
    reach a structure is derived from the lines pointing at it. A structure that
    named its own openings would go stale the first time a line moved.
    """
    known = {s["id"] for s in STRUCTURES}
    if len(known) != len(STRUCTURES):
        errors.append("structures.py: two structures share an id")

    reached = {}
    for op in openings:
        for line in op["lines"]:
            sid = (line.get("plan") or {}).get("structure")
            if not sid:
                continue        # not every line ends in a nameable structure
            if sid not in known:
                errors.append(f"{op['id']} / line '{line['name']}': plan points at "
                              f"unknown structure '{sid}'")
                continue
            reached.setdefault(sid, []).append(
                {"id": op["id"], "name": op["name"], "line": line["name"]})

    out = []
    for s in STRUCTURES:
        record = {k: v for k, v in s.items() if k != "fen"}
        try:
            # Not required to be a fully legal game position: a structure may be
            # an idealised skeleton, and only the board matters here.
            board = chess.Board(s["fen"])
        except Exception as e:
            errors.append(f"structure '{s['id']}': bad fen: {e}")
            continue
        if s.get("tier") and s["tier"] not in TIERS:
            errors.append(f"structure '{s['id']}': tier {s['tier']!r} is not one of {TIERS}")
        record["board"] = board_array(board)
        record["openings"] = reached.get(s["id"], [])
        # A warning, not an error: a structure is worth shipping as reference
        # before the openings that reach it have plan cards pointing at it.
        if not record["openings"]:
            print(f"  structure '{s['id']}': no line points here yet "
                  f"(reference only until one does)")
        out.append(record)
    return out


def feedback_level(line):
    """How sharp the drill's feedback can be for this built line, 0..2.

    The same vocabulary drill.js uses: 2 when deviations are written (`bx`),
    1 when the legal-move list shipped, 0 otherwise. Computed here because the
    web app's nav renders the badge from the catalog, without ever loading the
    opening's own payload.
    """
    if any("bx" in p for p in line["plies"]):
        return 2
    if any("legal" in p for p in line["plies"]):
        return 1
    return 0


def emit_files():
    """Everything --emit produces, as {relative path: text}.

    The JSON the app under web/ reads at build time, filtered to PORTED, so
    the site ships an opening only once its lines have slugs.

    catalog.json exists so the nav, home page and sitemap never load a full
    opening: it carries the summaries, the section list and the engine meta, and
    an opening is only as Coached as its weakest line, so the badge level is the
    minimum over them.
    """
    games = []
    errors = []
    evals = EvalIndex(errors)
    openings = build_openings(games, evals)
    structures = build_structures(openings, errors)
    if errors:
        print("=== CONTENT ERRORS ===")
        for e in errors:
            print(" ", e)
        raise SystemExit(f"{len(errors)} content error(s) — nothing written")

    ported = [op for op in openings if op["id"] in PORTED]
    ported_games = [g for g in games if g["op"] in PORTED]

    def line_summary(line):
        out = {"slug": line["slug"], "name": line["name"], "note": line["note"],
               "moveCount": len(line["plies"]) - 1}
        for key in ("tier", "side"):
            if line.get(key):
                out[key] = line[key]
        return out

    def brief(record, keys):
        return {k: record[k] for k in keys if record.get(k)}

    catalog = {
        "sections": SECTIONS,
        "engine": {"name": evals.engine, "depth": evals.depth,
                   "generated": evals.generated},
        "openings": [{
            **brief(op, ("id", "name", "eco", "section", "orientation",
                         "tagline", "level")),
            "feedback": min(feedback_level(line) for line in op["lines"]),
            "deviations": sum(len(s) for s in op.get("branchsets", [])),
            "lines": [line_summary(line) for line in op["lines"]],
        } for op in ported],
        "structures": [brief(s, ("id", "name", "tier")) for s in structures],
        "games": [brief(g, ("id", "name", "op", "tier")) for g in ported_games],
    }

    compact = lambda o: json.dumps(o, separators=(",", ":"))
    with open(PRIMER, encoding="utf-8") as f:
        primer = f.read()
    files = {"catalog.json": compact(catalog),
             # The front page's prose, authored as HTML in src/content/.
             "primer.html": primer}
    # The lesson is derived from the authored theory here, at emit time: it is
    # presentation, so it ships in the JSON and is never stored in the content
    # modules it was cut from.
    raw = {op["id"]: op for op in load()}
    for op in ported:
        lesson, found, on_board = build_lesson(
            op["id"], op["theory"],
            [line["moves"] for line in with_deep_line(raw[op["id"]])],
            lambda message: print("  lesson:", message))
        print(f"  lesson: {op['id']}: {on_board} of {found} notation runs on a board")
        files[f"openings/{op['id']}.json"] = compact({**op, "lesson": lesson})
    # Structures are shared reference content, so all of them ship — but the
    # derived back-references must only name openings the new site has pages
    # for, or the structure card would link into a 404.
    files["structures.json"] = compact([
        {**s, "openings": [o for o in s["openings"] if o["id"] in PORTED]}
        for s in structures])
    for g in ported_games:
        files[f"games/{g['id']}.json"] = compact(g)
    return files


def emit(outdir):
    """Write web/content/ fresh.

    The directory is generated and gitignored, so it is cleared first: an
    opening dropped from PORTED must take its file with it, not linger for the
    web build to find.
    """
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    for name, text in emit_files().items():
        path = os.path.join(outdir, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote {os.path.join('web', 'content', name)}", len(text) // 1024, "KB")


def main():
    emit(WEB_CONTENT)


if __name__ == "__main__":
    main()

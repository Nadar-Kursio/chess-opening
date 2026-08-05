"""Build the course: validate every line, generate move intel, emit the app.

Run from the repo root:

    python3 src/build.py            write docs/
    python3 src/build.py --check    fail if docs/ is stale, write nothing
    python3 src/build.py --serve    preview on localhost, write nothing

Every move in every line is replayed on a real board. An illegal move fails the
build loudly, naming the opening, line and ply.
"""
import contextlib
import http.server
import io
import json
import os
import sys
import time
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
from engine.notes import parse_notes

SRC = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(SRC, "app")
NOTES = os.path.join(SRC, "content", "notes")
DOCS = os.path.join(os.path.dirname(SRC), "docs")

# Concatenation order. CSS cascades and the scripts share a top-level scope, so
# both are order-dependent: responsive.css must land last, boot.js must run last.
# HEAD_SCRIPTS go in <head> ahead of the styles, which is the point of them:
# theme.js has to set the theme before the first paint, not after it.
HEAD_SCRIPTS = ["shim", "theme"]
STYLES = ["tokens", "base", "controls", "shell", "page", "board", "notation",
          "record", "coach", "notes", "deviation", "study", "strategy", "path",
          "structures", "primer", "progress", "responsive"]
SCRIPTS = ["state", "store", "appbar", "nav", "board", "arrows", "move",
           "drill", "deviation", "notepad", "plan", "structure", "render",
           "primer", "progress", "boot"]

OPENING_NOTE = ("The starting position. White moves first — and that single tempo "
                "is the whole reason opening theory exists.")


LINE_EXTRAS = ("tier", "drill", "plan", "record")

RECORD_KEYS = ("at", "games", "white", "draw", "black")

TIERS = ("Foundation", "Structure", "Plans", "Mastery")
SEVERITIES = ("blunder", "inaccuracy", "playable")


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

    def __init__(self, op, errors, notes):
        self.errors = errors
        self.notes = notes
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
            self.sets.append(build_branches(f"{where} / ply {ply}", board,
                                            self.authored[epd], ply, self.errors,
                                            self.notes))
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


def build_branches(where, board, entries, ply, errors, notes):
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
            num += 1

        record = {"san": san, "sev": br["severity"], "why": br["why"], "plies": plies}
        for key in ("tier", "name", "see"):
            if br.get(key):
                record[key] = br[key]
        out.append(record)
    return out


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


def build_line(op_id, index, line, errors, side=None, branches=None, notes=None):
    """Replay one line, returning its ply-by-ply record.

    When the line opts in with "drill": True, every position carries `legal` --
    the only chess legality the browser ever sees. It hangs off the ply that OWNS
    that position, not off the move played from it: those are two different
    positions, and putting them on one record invites a fencepost bug.

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
    drilled = bool(line.get("drill"))

    for i, san in enumerate(line["moves"].split()):
        if drilled:
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

    if line.get("record"):
        errors.extend(record_errors(f"{op_id} / line {index} '{line['name']}'",
                                    line["record"], line["moves"].split()))

    out = {"name": line["name"], "note": line.get("note", ""), "plies": plies}
    # Forward the optional line-level settings. Building the record from a fixed
    # set of keys is what would otherwise drop them without a word.
    for key in ("tier", "plan", "record"):
        if line.get(key):
            out[key] = line[key]
    return out


def build_openings(games):
    errors = []
    warnings = []
    out = []
    written = placed = 0
    for op in load():
        side = chess.WHITE if op["orientation"] == "white" else chess.BLACK
        notes = NoteIndex(op["id"], errors)
        branches = BranchIndex(op, errors, notes)
        lines = with_deep_line(op)
        record = {k: v for k, v in op.items() if k not in ("deep", "branches", "games")}
        record["lines"] = [build_line(op["id"], i, line, errors, side, branches, notes)
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
        games.extend(build_game(op["id"], i, g, errors)
                     for i, g in enumerate(op.get("games") or []))
        out.append(record)

    if errors:
        # Every error is printed before stopping, so one run shows an author every
        # problem rather than one per rebuild. Stopping matters: build_line breaks
        # out of a bad line, so continuing would write a silently truncated line
        # into docs/ that --check would then report as up to date.
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
    return out


def build_game(op_id, index, game, errors):
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


def read(*parts):
    with open(os.path.join(APP, *parts), encoding="utf-8") as f:
        return f.read()


def assemble(data_str, structures_str, games_str):
    """Inline every asset into one self-contained page.

    Plain concatenation, deliberately: the output has to keep working from a
    file:// URL with no server, which rules out ES modules and any external
    reference.
    """
    page = read("page.html")
    parts = {
        "__HEAD_SCRIPTS__": "\n".join(read("scripts", f"{n}.js") for n in HEAD_SCRIPTS),
        "__STYLES__": "\n".join(read("styles", f"{n}.css") for n in STYLES),
        "__PRIMER__": read("primer.html"),
        "__SCRIPTS__": "\n".join(read("scripts", f"{n}.js") for n in SCRIPTS),
    }
    for placeholder, text in parts.items():
        if placeholder not in page:
            raise SystemExit(f"page.html is missing the {placeholder} placeholder")
        page = page.replace(placeholder, text)

    # These three live inside state.js, so they only exist in the page after the
    # loop above has inlined the scripts. __DATA__ goes last: it is by far the
    # largest string and there is no reason to rescan it.
    for placeholder, text in (("__SECTIONS__", json.dumps(SECTIONS)),
                              ("__STRUCTURES__", structures_str),
                              ("__GAMES__", games_str),
                              ("__DATA__", data_str)):
        if placeholder not in page:
            raise SystemExit(f"assembled page is missing the {placeholder} placeholder")
        page = page.replace(placeholder, text)
    return page


def outputs():
    """Everything the build produces, as {filename: text}.

    .nojekyll turns off the Jekyll pass GitHub Pages runs by default. This page
    is already built; letting Jekyll near it only risks it rewriting or dropping
    files, and skipping it makes deploys faster.
    """
    games = []
    openings = build_openings(games)
    errors = []
    structures = build_structures(openings, errors)
    if errors:
        print("=== CONTENT ERRORS ===")
        for e in errors:
            print(" ", e)
        raise SystemExit(f"{len(errors)} content error(s) — nothing written")

    compact = lambda o: json.dumps(o, separators=(",", ":"))
    return {
        "chess-opening-course.html": assemble(compact(openings), compact(structures),
                                              compact(games)),
        "index.html": read("index.html"),
        ".nojekyll": "",
    }


def check():
    """Fail if docs/ no longer matches the sources, without writing anything."""
    stale = []
    for name, text in outputs().items():
        try:
            with open(os.path.join(DOCS, name), encoding="utf-8") as f:
                current = f.read()
        except FileNotFoundError:
            current = None
        if current != text:
            stale.append(name)
    if stale:
        raise SystemExit("docs/ is stale, run: python3 src/build.py\n  " + "\n  ".join(stale))
    print("docs/ is up to date.")


CONTENT_TYPES = {".html": "text/html; charset=utf-8"}


def reload_content():
    """Drop the cached content modules so an edit is picked up on the next build.

    import_module hands back whatever is already in sys.modules, so without this
    the server would serve the very first build forever while you edited an
    opening and wondered why nothing moved. The styles and scripts were never
    affected -- read() goes to disk every time -- which is exactly what makes
    this the kind of bug you find late.

    Only used by --serve. A one-shot build imports everything once anyway.
    """
    global COMMON, SECTIONS, STRUCTURES, load
    for name in [n for n in sys.modules if n == "content" or n.startswith("content.")]:
        del sys.modules[name]
    from content.common import COMMON
    from content.openings import load
    from content.sections import SECTIONS
    from content.structures import STRUCTURES


def serve(host, port):
    """Rebuild on every request and serve the result from memory.

    Nothing is written to docs/. A preview should not leave the repo half-built
    or produce a diff you did not ask for, and building per request means the
    page is always the one the sources currently describe -- the stale-build
    mistake that --check exists to catch in CI cannot happen here at all.

    A build is well under a second, which is what makes this affordable: edit a
    module, refresh, see it.
    """
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.respond(send_body=True)

        def do_HEAD(self):
            self.respond(send_body=False)

        def respond(self, send_body):
            name = self.path.split("?")[0].lstrip("/") or "index.html"
            started = time.time()
            chatter = io.StringIO()
            try:
                # The build narrates to stdout on every run, which per request is
                # just noise -- so it is held and only shown when it explains a
                # failure.
                with contextlib.redirect_stdout(chatter):
                    reload_content()
                    files = outputs()
            except SystemExit as e:
                self.fail(f"{chatter.getvalue()}\n{e}")
                return
            except Exception as e:
                self.fail(f"{chatter.getvalue()}\n{type(e).__name__}: {e}")
                return

            if name not in files:
                self.send_error(404, f"the build produces no file called {name!r}")
                return

            body = files[name].encode("utf-8")
            ms = int((time.time() - started) * 1000)
            print(f"  200  {name}  {len(body) // 1024} KB  rebuilt in {ms} ms", flush=True)
            self.send_response(200)
            self.send_header("Content-Type",
                             CONTENT_TYPES.get(os.path.splitext(name)[1], "text/plain"))
            self.send_header("Content-Length", str(len(body)))
            # The file changes on every build, so a cached copy is always wrong.
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if send_body:
                self.wfile.write(body)

        def fail(self, message):
            message = message.strip()
            print("\n=== BUILD FAILED ===", flush=True)
            print(message, flush=True)
            body = (f"<!doctype html><meta charset=utf-8>"
                    f"<title>Build failed</title>"
                    f"<body style='background:#191715;color:#EFEAE2;font:14px/1.6 ui-monospace,monospace;padding:32px'>"
                    f"<h1 style='color:#CC6A62;font-size:18px'>Build failed</h1>"
                    f"<pre style='white-space:pre-wrap'>{escape(message)}</pre>"
                    f"<p style='color:#A29A8F'>Fix it and refresh.</p>").encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass        # the 200 line above already says everything useful

    try:
        server = http.server.HTTPServer((host, port), Handler)
    except OSError as e:
        raise SystemExit(f"cannot listen on {host}:{port} — {e}\n"
                         f"  something else is on that port. Either stop it:\n"
                         f"    kill $(lsof -ti :{port})\n"
                         f"  or pick another:\n"
                         f"    python3 src/build.py --serve --port {port + 1}")
    print(f"serving http://{host}:{port}/  — rebuilds on every request, writes nothing",
          flush=True)
    if host != "127.0.0.1":
        print(f"reachable from other machines on {host}; stop with ctrl-c", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped", flush=True)


def arg(name, default):
    """Read `--name value` out of argv, in keeping with the flags above it."""
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
        raise SystemExit(f"{name} needs a value")
    return default


def main():
    if "--check" in sys.argv:
        check()
        return
    if "--serve" in sys.argv:
        # Loopback unless asked otherwise: exposing the port to the network
        # should be something you typed, not something you got.
        serve(arg("--host", "127.0.0.1"), int(arg("--port", "8000")))
        return
    os.makedirs(DOCS, exist_ok=True)
    for name, text in outputs().items():
        with open(os.path.join(DOCS, name), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote docs/{name}", len(text) // 1024, "KB")


if __name__ == "__main__":
    main()

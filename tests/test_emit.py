"""Contract checks over the JSON that --emit writes for the app under web/.

The web app's TypeScript types mirror these shapes by hand; this file is what
keeps the Python side honest about them. Same dependency-free style as
test_content.py — no schema library, just the assertions that matter to a
renderer: the keys it reads, the indexes it follows, the invariants it assumes.

Run from the repo root:  python3 -m unittest discover tests
"""
import contextlib
import io
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from build import EVALS, PORTED, emit_files
from engine.marks import MARKS
from content.openings import ORDER
from content.sections import SECTIONS

SUMMARY_KEYS = {"id", "name", "eco", "section", "orientation", "tagline",
                "level", "feedback", "deviations", "lines"}
LINE_SUMMARY_KEYS = {"slug", "name", "note", "moveCount"}
LINE_SUMMARY_EXTRA = {"tier", "side"}


def built():
    """Emit once for the whole file, with the build's narration held."""
    with contextlib.redirect_stdout(io.StringIO()):
        return {name: json.loads(text) if name.endswith(".json") else text
                for name, text in emit_files().items()}


class TestEmit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = built()
        cls.catalog = cls.files["catalog.json"]

    def test_ported_names_real_openings(self):
        for op_id in PORTED:
            self.assertIn(op_id, ORDER)

    def test_the_catalog_lists_exactly_the_ported_openings_in_order(self):
        self.assertEqual([o["id"] for o in self.catalog["openings"]],
                         [op_id for op_id in ORDER if op_id in PORTED])

    def test_catalog_summaries_have_exactly_the_expected_keys(self):
        for op in self.catalog["openings"]:
            self.assertEqual(set(op), SUMMARY_KEYS, op["id"])
            self.assertIn(op["feedback"], (0, 1, 2), op["id"])
            self.assertGreaterEqual(op["deviations"], 0, op["id"])

    def test_catalog_lines_carry_slug_and_length(self):
        for op in self.catalog["openings"]:
            for line in op["lines"]:
                where = f"{op['id']} / {line.get('name')}"
                self.assertFalse(LINE_SUMMARY_KEYS - set(line), where)
                self.assertFalse(set(line) - LINE_SUMMARY_KEYS - LINE_SUMMARY_EXTRA, where)
                self.assertGreaterEqual(line["moveCount"], 1, where)

    def test_sections_ship_verbatim(self):
        self.assertEqual(self.catalog["sections"], SECTIONS)

    def test_engine_meta_is_present_when_scores_are(self):
        engine = self.catalog["engine"]
        self.assertEqual(set(engine), {"name", "depth", "generated"})
        if any(os.path.exists(os.path.join(EVALS, f"{op_id}.json")) for op_id in PORTED):
            self.assertIsInstance(engine["name"], str)
            self.assertIsInstance(engine["depth"], int)

    def test_every_ported_opening_has_a_file_agreeing_with_its_summary(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            self.assertEqual(op["id"], summary["id"])
            self.assertEqual([line["slug"] for line in op["lines"]],
                             [line["slug"] for line in summary["lines"]])
            for line, brief in zip(op["lines"], summary["lines"]):
                self.assertEqual(len(line["plies"]) - 1, brief["moveCount"], line["slug"])

    def test_plies_have_the_shape_the_renderer_reads(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            for line in op["lines"]:
                plies = line["plies"]
                where = f"{op['id']} / {line['slug']}"
                self.assertTrue(plies, where)
                self.assertEqual(plies[0]["san"], "", where)
                self.assertIsNone(plies[0]["from"], where)
                for p in plies:
                    self.assertFalse({"san", "fen", "num", "turn"} - set(p), where)
                    self.assertEqual(len(p["fen"]), 64, where)
                    self.assertIn(p["turn"], ("w", "b"), where)

    def test_every_position_carries_its_legal_moves(self):
        """The board takes input everywhere, so every ply — the final position
        included — ships the engine's packed move list."""
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            for line in op["lines"]:
                for i, p in enumerate(line["plies"]):
                    # Present on every ply; EMPTY is legitimate — a line may
                    # end in mate, where there is nothing legal to pack.
                    where = f"{op['id']} / {line['slug']} / ply {i}"
                    self.assertIn("legal", p, where)
                    self.assertEqual(len(p["legal"]) % 4, 0, where)

    def test_the_primer_ships_alongside_the_catalog(self):
        self.assertIn('class="primer"', self.files["primer.html"])

    def test_bx_points_into_the_branchsets(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            sets = op.get("branchsets", [])
            for line in op["lines"]:
                for p in line["plies"]:
                    if "bx" in p:
                        self.assertTrue(0 <= p["bx"] < len(sets),
                                        f"{op['id']} / {line['slug']}")
            for branchset in sets:
                for br in branchset:
                    self.assertFalse({"san", "sev", "why", "plies"} - set(br), op["id"])

    def test_scored_plies_carry_integer_centipawns(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            scored = 0
            for line in op["lines"]:
                for p in line["plies"]:
                    if "ev" in p:
                        scored += 1
                        self.assertIsInstance(p["ev"], int, op["id"])
            if os.path.exists(os.path.join(EVALS, f"{op['id']}.json")):
                self.assertTrue(scored, f"{op['id']} has an evals file and no ev landed")

    # ---- the move marks: derived from the scores, never beyond them ----

    def _every_plyline(self):
        """Every (where, plies) the renderer walks — lines, branches, games."""
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            for line in op["lines"]:
                yield f"{op['id']} / {line['slug']}", line["plies"]
            for si, branchset in enumerate(op.get("branchsets", [])):
                for br in branchset:
                    yield f"{op['id']} / branchset {si} / {br['san']}", br["plies"]
        for name in self.files:
            if name.startswith("games/"):
                yield name, self.files[name]["plies"]

    def test_marks_speak_the_vocabulary_and_sit_on_scored_plies(self):
        """A mark is a subtraction between two shipped scores, so it can only
        exist where both exist — and never on a first ply, which is either the
        starting position or a branch move that owns an authored severity."""
        for where, plies in self._every_plyline():
            for i, p in enumerate(plies):
                if "mark" not in p:
                    continue
                self.assertIn(p["mark"], MARKS, where)
                self.assertGreater(i, 0, where)
                self.assertIn("ev", p, where)
                self.assertIn("ev", plies[i - 1], where)

    def test_the_fried_liver_earns_its_exclamations(self):
        """The marks the openings are famous for: 6.Nxf7 is the Fried Liver,
        and 5...Bxf2+ is the Traxler. If either stops reading brilliant, the
        classifier regressed (or the evals moved — look before retuning)."""
        op = self.files["openings/friedliver.json"]
        marks = {p["num"]: p.get("mark")
                 for line in op["lines"] for p in line["plies"]}
        self.assertEqual(marks.get("6.Nxf7"), "brilliant")
        self.assertEqual(marks.get("5...Bxf2+"), "brilliant")

    def test_structures_only_point_back_at_ported_openings(self):
        for s in self.files["structures.json"]:
            self.assertEqual(len(s["board"]), 64, s["id"])
            for opening in s["openings"]:
                self.assertIn(opening["id"], PORTED, s["id"])

    # ---- the lesson: the theory cut around the moves it names ----

    @staticmethod
    def _joined(seg):
        return "".join(s if isinstance(s, str) else s["t"] for s in seg)

    def _lesson_cards(self, op):
        """Every (where, seg lists, boards, hero) the lesson record carries."""
        lesson = op["lesson"]
        yield "idea", [lesson["idea"]["seg"]], lesson["idea"]
        yield "structure", [lesson["structure"]["seg"]], lesson["structure"]
        yield "plans", lesson["plans"]["white"] + lesson["plans"]["black"], lesson["plans"]
        for i, trap in enumerate(lesson["traps"]):
            yield f"trap {i}", [trap["seg"]], trap

    def test_every_ported_opening_carries_a_lesson(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            self.assertEqual(set(op["lesson"]),
                             {"idea", "structure", "plans", "traps"}, op["id"])
            self.assertEqual(len(op["lesson"]["traps"]),
                             len(op["theory"]["traps"]), op["id"])

    def test_the_lesson_reassembles_the_theory_byte_for_byte(self):
        """Cutting the prose around its moves must lose nothing: the segments
        joined back up are the authored text, and a trap's extracted name is
        the authored prefix with only the colon between them."""
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            lesson, theory = op["lesson"], op["theory"]
            self.assertEqual(self._joined(lesson["idea"]["seg"]),
                             theory["big_idea"], op["id"])
            self.assertEqual(self._joined(lesson["structure"]["seg"]),
                             theory["structure"], op["id"])
            for side in ("white", "black"):
                self.assertEqual([self._joined(seg) for seg in lesson["plans"][side]],
                                 theory[f"{side}_plans"], op["id"])
            for trap, text in zip(lesson["traps"], theory["traps"]):
                body = self._joined(trap["seg"])
                self.assertTrue(text.endswith(body), f"{op['id']}: {body[:40]!r}")
                if "name" in trap:
                    self.assertTrue(text.startswith(trap["name"] + ":"), op["id"])
                else:
                    self.assertEqual(text, body, op["id"])

    def test_lesson_chips_point_at_moves_and_boards_link_up(self):
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            for where, segs, card in self._lesson_cards(op):
                w = f"{op['id']} / {where}"
                boards = card.get("boards", [])
                chips = [s for seg in segs for s in seg if isinstance(s, dict)]
                if not boards:
                    self.assertFalse(chips, w)
                    continue
                self.assertIn(card["hero"], range(len(boards)), w)
                for s in chips:
                    self.assertIn(s["b"], range(len(boards)), w)
                    # A chip is a move, never the anchor a run starts from.
                    self.assertTrue(boards[s["b"]]["num"], w)
                for i, b in enumerate(boards):
                    self.assertEqual(len(b["fen"]), 64, w)
                    self.assertIn(b["turn"], ("w", "b"), w)
                    if b["num"]:
                        self.assertIn(b["p"], range(len(boards)), w)
                        self.assertTrue(b["from"] and b["to"], w)
                    else:
                        self.assertIsNone(b["p"], w)
                        self.assertIn(b.get("n"), range(len(boards)), w)
                    if "n" in b:
                        self.assertNotEqual(b["n"], i, w)

    def test_the_lesson_found_boards_where_the_prose_plays_moves(self):
        """The Ruy Lopez big idea plays 3.Bb5 in its first sentence; a lesson
        record without a board for it means the extractor went quiet, which
        must fail here rather than ship a page of plain prose."""
        op = self.files["openings/ruylopez.json"]
        self.assertTrue(op["lesson"]["idea"].get("boards"))
        self.assertTrue(any(t.get("boards") for t in op["lesson"]["traps"]))

    def test_game_files_match_the_catalog_and_belong_here(self):
        listed = {g["id"] for g in self.catalog["games"]}
        on_disk = {name[len("games/"):-len(".json")]
                   for name in self.files if name.startswith("games/")}
        self.assertEqual(listed, on_disk)
        for name in sorted(on_disk):
            game = self.files[f"games/{name}.json"]
            self.assertIn(game["op"], PORTED, name)
            self.assertTrue(game["plies"], name)


if __name__ == "__main__":
    unittest.main()

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
from content.openings import ORDER
from content.sections import SECTIONS

SUMMARY_KEYS = {"id", "name", "eco", "section", "orientation", "tagline",
                "level", "feedback", "deviations", "lines"}
LINE_SUMMARY_KEYS = {"slug", "name", "note", "moveCount"}
LINE_SUMMARY_EXTRA = {"tier", "side"}


def built():
    """Emit once for the whole file, with the build's narration held."""
    with contextlib.redirect_stdout(io.StringIO()):
        return {name: json.loads(text) for name, text in emit_files().items()}


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

    def test_legal_packs_to_whole_moves(self):
        packed = 0
        for summary in self.catalog["openings"]:
            op = self.files[f"openings/{summary['id']}.json"]
            for line in op["lines"]:
                for p in line["plies"]:
                    if "legal" in p:
                        packed += 1
                        self.assertEqual(len(p["legal"]) % 4, 0,
                                         f"{op['id']} / {line['slug']}")
        self.assertTrue(packed, "no line shipped a legal-move list at all")

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

    def test_structures_only_point_back_at_ported_openings(self):
        for s in self.files["structures.json"]:
            self.assertEqual(len(s["board"]), 64, s["id"])
            for opening in s["openings"]:
                self.assertIn(opening["id"], PORTED, s["id"])

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

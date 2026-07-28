"""Shape checks over the opening catalogue.

build.py already proves every move is legal. These cover the things it would
either crash on or silently accept, so that whoever adds opening number 14 gets
a clear message instead of a KeyError or a missing sidebar entry.

Run from the repo root:  python3 -m unittest discover tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from content.openings import ORDER, load
from content.sections import SECTIONS

OPENING_KEYS = {"id", "name", "eco", "section", "orientation", "tagline",
                "level", "theory", "lines", "deep", "progression"}
THEORY_KEYS = {"big_idea", "structure", "white_plans", "black_plans", "traps", "who"}
STAGE_KEYS = {"tier", "when", "goal", "learn", "drill", "mistake", "ready"}


class TestCatalogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.openings = load()

    def test_order_has_no_duplicates(self):
        self.assertEqual(len(ORDER), len(set(ORDER)))

    def test_module_name_matches_opening_id(self):
        for name, op in zip(ORDER, self.openings):
            self.assertEqual(name, op["id"], f"{name}.py declares id {op['id']!r}")

    def test_every_opening_has_exactly_the_expected_keys(self):
        for op in self.openings:
            self.assertEqual(set(op), OPENING_KEYS, op["id"])
            self.assertEqual(set(op["theory"]), THEORY_KEYS, op["id"])

    def test_section_resolves(self):
        known = {s["id"] for s in SECTIONS}
        for op in self.openings:
            self.assertIn(op["section"], known, op["id"])

    def test_orientation_is_a_colour(self):
        for op in self.openings:
            self.assertIn(op["orientation"], ("white", "black"), op["id"])

    def test_lines_are_well_formed(self):
        for op in self.openings:
            self.assertTrue(op["lines"], f"{op['id']} has no lines")
            for line in op["lines"]:
                where = f"{op['id']} / {line.get('name')}"
                self.assertEqual(set(line), {"name", "note", "moves", "notes"}, where)
                self.assertTrue(line["moves"].split(), f"{where} has no moves")

    def test_notes_are_keyed_by_a_real_ply(self):
        for op in self.openings:
            for line in op["lines"]:
                count = len(line["moves"].split())
                for ply in line["notes"]:
                    self.assertIsInstance(ply, int, f"{op['id']} / {line['name']}")
                    self.assertTrue(
                        1 <= ply <= count,
                        f"{op['id']} / {line['name']}: note {ply} but the line is {count} moves",
                    )

    def test_deep_dive_continues_the_main_line(self):
        for op in self.openings:
            main = op["lines"][0]["moves"].split()
            deep = op["deep"]["moves"].split()
            self.assertEqual(deep[:len(main)], main,
                             f"{op['id']}: deep dive does not continue the main line")
            self.assertGreater(len(deep), len(main), f"{op['id']}: deep dive adds no moves")

    def test_progression_stages_are_well_formed(self):
        for op in self.openings:
            prog = op["progression"]
            self.assertEqual(set(prog), {"arc", "stages", "study", "next"}, op["id"])
            self.assertTrue(prog["stages"], f"{op['id']} has no stages")
            for stage in prog["stages"]:
                self.assertEqual(set(stage), STAGE_KEYS, f"{op['id']} / {stage.get('tier')}")


class TestSections(unittest.TestCase):
    def test_ids_are_unique(self):
        ids = [s["id"] for s in SECTIONS]
        self.assertEqual(len(ids), len(set(ids)))

    def test_every_section_is_used(self):
        used = {op["section"] for op in load()}
        for section in SECTIONS:
            self.assertIn(section["id"], used, f"{section['id']} has no openings")


if __name__ == "__main__":
    unittest.main()

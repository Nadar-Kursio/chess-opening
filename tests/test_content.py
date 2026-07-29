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
from content.structures import STRUCTURES

OPENING_KEYS = {"id", "name", "eco", "section", "orientation", "tagline",
                "level", "theory", "lines", "deep", "progression"}
THEORY_KEYS = {"big_idea", "structure", "white_plans", "black_plans", "traps", "who"}
STAGE_KEYS = {"tier", "when", "goal", "learn", "drill", "mistake", "ready"}

OPENING_EXTRA = {"branches", "games"}
LINE_KEYS = {"name", "note", "moves", "notes"}
LINE_EXTRA = {"tier", "drill", "plan"}
BRANCH_KEYS = {"san", "severity", "why"}
BRANCH_EXTRA = {"tier", "name", "line", "see"}
PLAN_KEYS = {"point"}
PLAN_EXTRA = {"structure", "tier", "next", "endgame"}
GAME_KEYS = {"id", "name", "moves", "notes"}
GAME_EXTRA = {"tier", "note"}

TIERS = ("Foundation", "Structure", "Plans", "Mastery")
SEVERITIES = ("blunder", "inaccuracy", "playable")


class TestCatalogue(unittest.TestCase):
    def assertKeys(self, got, required, optional, where):
        """Required keys all present, and nothing outside required|optional.

        Split rather than loosened: an exact-match assertion is what catches a
        typo'd key, and that is the whole value of this file. Optional keys are
        named, not waved through.
        """
        self.assertFalse(required - got, f"{where} is missing {sorted(required - got)}")
        self.assertFalse(got - required - optional,
                         f"{where} has unknown keys {sorted(got - required - optional)}")
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
            self.assertKeys(set(op), OPENING_KEYS, OPENING_EXTRA, op["id"])
            self.assertEqual(set(op["theory"]), THEORY_KEYS, op["id"])

    def test_branches_are_well_formed(self):
        for op in self.openings:
            for prefix, entries in (op.get("branches") or {}).items():
                where = f"{op['id']} / '{prefix}'"
                self.assertTrue(entries, f"{where} has no branches")
                seen = set()
                for br in entries:
                    self.assertKeys(set(br), BRANCH_KEYS, BRANCH_EXTRA,
                                    f"{where} / {br.get('san')}")
                    self.assertIn(br["severity"], SEVERITIES, f"{where} / {br['san']}")
                    if br.get("tier"):
                        self.assertIn(br["tier"], TIERS, f"{where} / {br['san']}")
                    self.assertNotIn(br["san"], seen,
                                     f"{where} lists {br['san']} twice")
                    seen.add(br["san"])

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
            for line in op["lines"] + [op["deep"]]:
                where = f"{op['id']} / {line.get('name')}"
                self.assertKeys(set(line), LINE_KEYS, LINE_EXTRA, where)
                self.assertTrue(line["moves"].split(), f"{where} has no moves")

    def test_plans_are_well_formed(self):
        known = {s["id"] for s in STRUCTURES}
        for op in self.openings:
            for line in op["lines"] + [op["deep"]]:
                plan = line.get("plan")
                if not plan:
                    continue
                where = f"{op['id']} / {line['name']} / plan"
                self.assertKeys(set(plan), PLAN_KEYS, PLAN_EXTRA, where)
                # A line need not reach a nameable structure, but if it names one
                # it has to exist -- build.py cannot draw a card that isn't there.
                if plan.get("structure"):
                    self.assertIn(plan["structure"], known, where)
                if plan.get("tier"):
                    self.assertIn(plan["tier"], TIERS, where)

    def test_games_are_well_formed(self):
        for op in self.openings:
            for game in op.get("games") or []:
                where = f"{op['id']} / game {game.get('id')}"
                self.assertKeys(set(game), GAME_KEYS, GAME_EXTRA, where)
                count = len(game["moves"].split())
                self.assertTrue(count, f"{where} has no moves")
                for ply in game["notes"]:
                    self.assertTrue(1 <= ply <= count,
                                    f"{where}: note {ply} but the game is {count} moves")
                if game.get("tier"):
                    self.assertIn(game["tier"], TIERS, where)

    def test_line_tiers_are_known(self):
        for op in self.openings:
            for line in op["lines"] + [op["deep"]]:
                if "tier" in line:
                    self.assertIn(line["tier"], TIERS, f"{op['id']} / {line['name']}")

    def test_drill_is_a_flag(self):
        for op in self.openings:
            for line in op["lines"] + [op["deep"]]:
                if "drill" in line:
                    self.assertIsInstance(line["drill"], bool, f"{op['id']} / {line['name']}")

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


class TestStructures(unittest.TestCase):
    KEYS = {"id", "name", "fen", "white_plans", "black_plans",
            "key_squares", "pawn_breaks", "pitfalls", "endgame_note"}
    EXTRA = {"tier", "taxonomy", "also_in"}

    def test_ids_are_unique(self):
        ids = [s["id"] for s in STRUCTURES]
        self.assertEqual(len(ids), len(set(ids)))

    def test_keys(self):
        for s in STRUCTURES:
            got, req, opt = set(s), self.KEYS, self.EXTRA
            self.assertFalse(req - got, f"{s.get('id')} is missing {sorted(req - got)}")
            self.assertFalse(got - req - opt,
                             f"{s.get('id')} has unknown keys {sorted(got - req - opt)}")

    def test_tiers_are_known(self):
        for s in STRUCTURES:
            if s.get("tier"):
                self.assertIn(s["tier"], TIERS, s["id"])


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

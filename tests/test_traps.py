"""Which trap courses belong to which repertoire courses, as relate_traps derives it by position.

Small made-up courses pin the rules down one at a time; the last class checks what the real
catalogue gets, so a content edit that quietly moves a trap off its course shows up here.

Run from the repo root:  python3 -m unittest discover tests
"""
import contextlib
import io
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from build import TRAP_REACH, build_line, emit_files, relate_traps


def line(slug, moves, side=None):
    errors = []
    built = build_line("test", 0, {"name": slug, "moves": moves, "notes": {}, "slug": slug,
                                   **({"side": side} if side else {})}, errors)
    assert not errors, errors
    return built


def course(cid, orientation, *lines, section="closed"):
    return {"id": cid, "name": cid, "section": section, "orientation": orientation, "lines": list(lines)}


def trap(cid, orientation, *lines):
    return course(cid, orientation, *lines, section="traps")


def add_branch(record, slug, after, san, cont=""):
    """A deviation off `slug`'s line after the moves in `after`, as the build ships one."""
    full = line("branch", " ".join(filter(None, [after, san, cont])))
    at = len(after.split())
    sets = record.setdefault("branchsets", [])
    sets.append([{"san": san, "plies": full["plies"][at + 1:]}])
    next(l for l in record["lines"] if l["slug"] == slug)["plies"][at]["bx"] = len(sets) - 1


def add_sideline(record, slug, chapter, prefix, reply, cont):
    built = line(slug, " ".join([prefix, reply, cont]))
    built["start"] = len(prefix.split())
    items = record.setdefault("coaching", {}).setdefault("sidelines", {}).setdefault("items", [])
    items.append({"slug": slug, "chapter": chapter, "kind": "dodge", "line": built})


B2 = "d4 d5 Bf4 c5 e3 Qb6 Nc3 Qxb2 Nxd5"
B2_DODGE = "d4 d5 Bf4 c5 e3 Qb6 Nc3 e6 Nb5 Na6"


class TestRelateTraps(unittest.TestCase):
    def test_same_side_is_set_and_the_other_side_is_watch(self):
        london = course("london", "white", line("c5", "d4 d5 Bf4 c5 e3 cxd4 exd4"))
        set_it = trap("b2", "white", line("trap", B2), line("dodge", B2_DODGE, side="black"))
        watch = trap("b2black", "black", line("trap", B2), line("dodge", B2_DODGE, side="white"))
        relate_traps([london, set_it, watch])
        self.assertEqual({t["id"]: t["group"] for t in london["traps"]}, {"b2": "set", "b2black": "watch"})
        self.assertEqual([t["id"] for t in london["traps"]], ["b2", "b2black"], "set first")
        self.assertEqual(set_it["partOf"], ["london"])

    def test_learn_is_the_trap_chapter_taught_from_the_course_side(self):
        london = course("london", "white", line("c5", "d4 d5 Bf4 c5 e3 cxd4 exd4"))
        watch = trap("b2black", "black", line("trap", B2), line("dodge", B2_DODGE, side="white"))
        relate_traps([london, watch])
        self.assertEqual(london["traps"][0]["learn"], "dodge")

    def test_a_trap_the_course_leaves_early_is_not_its_own(self):
        shallow = " ".join(B2.split()[:TRAP_REACH - 1])
        london = course("london", "white", line("main", shallow + " Nf3 Nf6"))
        b2 = trap("b2", "white", line("trap", B2))
        relate_traps([london, b2])
        self.assertNotIn("traps", london)
        self.assertNotIn("partOf", b2)

    def test_reach_counts_from_the_fifth_ply(self):
        london = course("london", "white", line("main", " ".join(B2.split()[:TRAP_REACH])))
        relate_traps([london, trap("b2", "white", line("trap", B2))])
        self.assertEqual(london["traps"][0]["reach"], TRAP_REACH)

    def test_a_transposition_counts(self):
        # 1...c5 first and 2...d5 second: the same position after 3.e3, by another road.
        london = course("london", "white", line("main", "d4 c5 Bf4 d5 e3 Qb6 Nc3"))
        relate_traps([london, trap("b2", "white", line("trap", B2))])
        self.assertEqual(london["traps"][0]["reach"], 7)

    def test_deviations_count_and_a_bare_signpost_does_not(self):
        london = course("london", "white", line("main", "d4 d5 Bf4 Nf6 e3"))
        add_branch(london, "main", "d4 d5", "c4")
        b2 = trap("elephant", "black", line("trap", "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7"))
        relate_traps([london, b2])
        self.assertNotIn("traps", london, "a deviation with no continuation names another opening")

        add_branch(london, "main", "d4 d5 Bf4", "c5", "e3 Qb6 Nc3")
        relate_traps([london, trap("b2", "white", line("trap", B2))])
        self.assertEqual(london["traps"][0]["reach"], 7)

    def test_the_chip_goes_on_the_chapter_that_follows_it_deepest(self):
        london = course("london", "white",
                        line("nf6", "d4 d5 Bf4 Nf6 e3 e6"),
                        line("c5", "d4 d5 Bf4 c5 e3 cxd4"))
        relate_traps([london, trap("b2", "white", line("trap", B2))])
        self.assertEqual(london["traps"][0]["chapter"], "c5")

    def test_a_tie_goes_to_the_chapter_whose_own_moves_go_deeper(self):
        def london(second):
            record = course("london", "white", line("nf6", "d4 d5 Bf4 Nf6 e3 e6"), line("second", second))
            add_branch(record, "nf6", "d4 d5 Bf4", "h5", "c4 e6 Nf3")
            record["lines"][1]["plies"][3]["bx"] = 0
            return record

        def hunt():
            return trap("hunt", "black", line("trap", "d4 d5 Bf4 h5 e3 e5 Bxe5"),
                        line("dodge", "d4 d5 Bf4 h5 c4 e6 Nf3 Bb4+", side="white"))

        level = london("d4 d5 Bf4 c5 e3 cxd4")
        relate_traps([level, hunt()])
        self.assertEqual(level["traps"][0]["chapter"], "nf6", "the same deviation off both, so the first")
        deeper = london("d4 d5 Bf4 h5 c4 c6")
        relate_traps([deeper, hunt()])
        self.assertEqual(deeper["traps"][0]["chapter"], "second", "its own moves reach 3.c4")

    def test_the_sideline_on_the_trap_road_is_its_dodge(self):
        london = course("london", "white", line("main", "d4 d5 Bf4 Nf6 e3"))
        add_sideline(london, "leaves-1-e5", "main", "d4", "e5", "dxe5 Nc6 Nf3 d5 Bf4")
        add_sideline(london, "leaves-1-c5", "main", "d4", "c5", "d5 Nf6 Nc3")
        englund = trap("englund", "black", line("trap", "d4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3"),
                       line("dodge", "d4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Nc3", side="white"))
        relate_traps([london, englund])
        [entry] = london["traps"]
        self.assertEqual((entry["group"], entry["chapter"], entry["sideline"]), ("watch", "main", "leaves-1-e5"))
        items = {s["slug"]: s for s in london["coaching"]["sidelines"]["items"]}
        self.assertEqual(items["leaves-1-e5"]["trap"], "englund")
        self.assertNotIn("trap", items["leaves-1-c5"])

    def test_the_moment_is_where_the_trap_lines_part(self):
        london = course("london", "white", line("c5", "d4 d5 Bf4 c5 e3 cxd4 exd4"))
        relate_traps([london, trap("b2", "white", line("trap", B2), line("dodge", B2_DODGE, side="black"))])
        self.assertEqual(london["traps"][0]["moment"]["num"], "4.Nc3")

    def test_trap_courses_get_no_traps_of_their_own(self):
        b2 = trap("b2", "white", line("trap", B2))
        other = trap("b2black", "black", line("trap", B2))
        relate_traps([b2, other])
        self.assertNotIn("traps", b2)
        self.assertNotIn("partOf", b2)


class TestRealCatalogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with contextlib.redirect_stdout(io.StringIO()):
            cls.files = {name: json.loads(text) for name, text in emit_files().items() if name.endswith(".json")}

    def traps(self, cid):
        return {t["id"]: t for t in self.files[f"openings/{cid}.json"].get("traps", [])}

    def test_the_london(self):
        traps = self.traps("london")
        self.assertEqual({k: t["group"] for k, t in traps.items()},
                         {"londonb2": "set", "londonh5hunt": "watch", "englundtrap": "watch",
                          "jobavafork": "set", "jobavaqa5": "watch"})
        self.assertEqual(traps["londonb2"]["chapter"], "c5-challenge")
        self.assertEqual(traps["londonh5hunt"]["sideline"], "leaves-2-h5")
        self.assertEqual(traps["englundtrap"]["sideline"], "leaves-1-e5")
        self.assertEqual(self.files["openings/londonb2.json"]["partOf"], ["london"])

    def test_the_other_repertoire_courses(self):
        self.assertEqual(set(self.traps("queensgambit")), {"elephanttrap"})
        self.assertEqual(set(self.traps("ruylopez")), {"noahsark", "fishingpole"},
                         "the Italian's traps stay off the Ruy, which only names 3.Bc4")
        self.assertEqual({k: t["group"] for k, t in self.traps("sicilian").items()},
                         {"siberiantrap": "set", "magnussmith": "watch"})

    def test_every_link_lands_on_something_real(self):
        for name, op in self.files.items():
            if not name.startswith("openings/"):
                continue
            slugs = {l["slug"] for l in op["lines"]}
            sidelines = {s["slug"] for s in
                         self.files.get(f"coaching/{op['id']}.json", {}).get("sidelines", {}).get("items", [])}
            for t in op.get("traps", []):
                trap_op = self.files[f"openings/{t['id']}.json"]
                self.assertIn(t["chapter"], slugs, name)
                self.assertIn(t.get("learn"), {l["slug"] for l in trap_op["lines"]}, name)
                self.assertIn(op["id"], trap_op["partOf"], name)
                if "sideline" in t:
                    self.assertIn(t["sideline"], sidelines, name)
                self.assertRegex(t["moment"]["fen"], r"^[.pnbrqkPNBRQK]{64}$", name)


if __name__ == "__main__":
    unittest.main()

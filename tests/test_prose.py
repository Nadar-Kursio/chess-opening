"""Every string the apps show from the course reads like a person wrote it.

The rules live in prose.json, shared with prose-ui.mjs, which checks the UI
strings in web/ and trainer/. This file checks what --emit ships, so a hit is
reported by opening and JSON path; grep src/content/ for the quoted text.
Personal notes (`mine`) are the reader's own writing and are left alone.

Run from the repo root:  python3 -m unittest discover tests
"""
import contextlib
import io
import json
import os
import re
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "src"))

from build import emit_files

with open(os.path.join(HERE, "prose.json"), encoding="utf-8") as f:
    RULES = [(r["id"], re.compile(r["pattern"], re.I), r["advice"]) for r in json.load(f)["rules"]]


def strings(value, path):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(value, dict):
        for k, v in value.items():
            if k != "mine":
                yield from strings(v, f"{path}.{k}")


def violations(text):
    for rule, pattern, advice in RULES:
        for m in pattern.finditer(text):
            yield rule, advice, text[max(0, m.start() - 40):m.end() + 40]


class TestProse(unittest.TestCase):
    def test_course_text_reads_naturally(self):
        with contextlib.redirect_stdout(io.StringIO()):
            files = emit_files()
        hits = []
        for name, text in files.items():
            found = strings(json.loads(text), name) if name.endswith(".json") else [(name, text)]
            for path, s in found:
                for rule, advice, around in violations(s):
                    hits.append(f"{path} [{rule}] …{around}…\n    {advice}")
        self.assertFalse(hits, f"{len(hits)} phrase(s) that read as machine-written:\n" + "\n".join(hits[:50]))


if __name__ == "__main__":
    unittest.main()

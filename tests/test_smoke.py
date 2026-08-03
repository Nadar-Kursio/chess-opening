"""Run the built page in a browser-like DOM and fail if anything throws.

build.py concatenates the scripts without parsing them, so a syntax error, or a
function renamed in one file and not in the file that calls it, ships a dead page
and the build still reports success. Nothing else in this repo catches that; this
does, by loading the real output and driving every view in it.

jsdom, not Playwright: the page has no network calls, no real layout dependency
and no animation to wait on, so a DOM is the whole of what a test needs here and
a browser download is not worth its minute in CI.

Skips, loudly, when node or jsdom is missing -- the rest of the suite is pure
Python and must keep running on a machine that has neither.

Run from the repo root:  python3 -m unittest discover tests
"""
import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))

HARNESS = os.path.join(ROOT, "tests", "smoke.mjs")
PAGE = "chess-opening-course.html"


def node_env():
    """The environment node needs to resolve jsdom, or None if it cannot.

    Checked in the order a machine is likely to have it: alongside the repo
    (`npm install jsdom`, which is what CI does), then globally.
    """
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        return None

    candidates = [None]
    try:
        root = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True, check=True)
        candidates.append(root.stdout.strip())
    except (OSError, subprocess.CalledProcessError):
        pass

    for path in candidates:
        env = dict(os.environ)
        if path:
            env["NODE_PATH"] = path
        probe = subprocess.run(
            ["node", "-e", "require.resolve('jsdom')"],
            capture_output=True, cwd=ROOT, env=env)
        if probe.returncode == 0:
            return env
    return None


class TestBuiltPage(unittest.TestCase):
    def test_every_view_renders_and_nothing_throws(self):
        env = node_env()
        if env is None:
            self.skipTest("needs node and jsdom — `npm install jsdom` to run this one")

        import build
        # outputs() narrates to stdout; the test only wants the page.
        chatter = io.StringIO()
        with contextlib.redirect_stdout(chatter):
            files = build.outputs()
        self.assertIn(PAGE, files)

        with tempfile.TemporaryDirectory() as tmp:
            page = os.path.join(tmp, PAGE)
            with open(page, "w", encoding="utf-8") as f:
                f.write(files[PAGE])
            run = subprocess.run(["node", HARNESS, page],
                                 capture_output=True, text=True, cwd=ROOT, env=env)

        if run.returncode != 0:
            self.fail("the built page did not survive being driven:\n"
                      f"{run.stdout}\n{run.stderr}")

        # The harness reports what it found, so a suite that silently stopped
        # exercising half the app shows up as a number that fell.
        report = json.loads(run.stdout[run.stdout.index("{"):run.stdout.rindex("}") + 1])
        self.assertGreater(report["destinations"], 10, "the nav lost most of its entries")
        self.assertGreater(report["plies"], 4, "the scoresheet lost most of its moves")


if __name__ == "__main__":
    unittest.main()

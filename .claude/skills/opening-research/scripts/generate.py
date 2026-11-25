#!/usr/bin/env python3
"""Generate every committed data file a course needs, in order, as one resumable job.

    .venv/bin/python3 .claude/skills/opening-research/scripts/generate.py jobava --background
    .venv/bin/python3 .claude/skills/opening-research/scripts/generate.py jobava            # in the foreground
    .venv/bin/python3 .claude/skills/opening-research/scripts/generate.py jobava --status   # what would run, and why

A course's generated files depend on each other, and the order is the one the skill used to
list by hand: sidelines (they add positions) before the club counts of those positions, both
before the eval bar, the verdicts and the exits that read them, and the cloud cross-check last.
A trap course (section "traps") has no club data or sidelines: it needs the evals and the
cross-check only.

  step        writes                                  needs        lock
  sidelines   src/content/sidelines/<id>.json         engine, net  yes
  club        src/content/club/<id>.json              net          no
  evals       src/content/evals/<id>.json             engine       yes
  verdicts    src/content/verdicts/<id>.json          engine       yes
  exits       src/content/exits/<id>.json             engine       yes
  crosscheck  .engine/crosscheck/<id>.txt (a report)  engine, net  yes

Each step is skipped when nothing it reads has changed since it last succeeded: the course's
content (the OPENING data itself, so reformatting the module costs nothing), the generated files
before it in the chain, and its own script. .engine/generate/<id>.json keeps those fingerprints;
--force reruns every step anyway, --only runs the ones named. Engine steps take the box-wide
lock (.worktrees/.heavy.lock) one at a time, at nice 10, so a second course generating at the same
time waits instead of halving both.

--background detaches, prints the pid and the log path (.engine/generate/<id>.log), and returns.
Wait for the log's last line to start "done" or "failed"; `kill -- -<pid>` stops the whole job.

Sidelines are held to the course's size (--reach, --share, --moves): a reply grows into a
sideline when it is chosen by --share % of club games at a position --reach % of the course's
games get to, in the opponent's first --moves moves. The defaults keep a course the size a coach
would teach; widen them on purpose, never to chase a coverage number.
"""
import argparse
import fcntl
import hashlib
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _engine import ROOT                                # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
LOCK = os.path.join(os.path.dirname(ROOT) if os.path.basename(os.path.dirname(ROOT)) == ".worktrees"
                    else os.path.join(ROOT, ".worktrees"), ".heavy.lock")
STATE = os.path.join(ROOT, ".engine", "generate")


def steps(op_id, args, trap):
    """(name, script, arguments, files it writes, generated files it reads, takes the lock)."""
    py = os.path.join(ROOT, ".venv", "bin", "python3")
    own = lambda folder: os.path.join("src", "content", folder, f"{op_id}.json")   # noqa: E731
    threads = str(args.threads)
    chain = [
        ("sidelines", "sidelines.py", [op_id, "--threads", threads, "--reach", str(args.reach),
                                       "--share", str(args.share), "--moves", str(args.moves)],
         [own("sidelines")], [], True),
        ("club", "club-moves.py", [op_id], [own("club")], [own("sidelines")], False),
        ("evals", "position-evals.py", [op_id, "--threads", threads] + (["--skip", args.skip] if args.skip else []),
         [own("evals")], [own("sidelines")], True),
        ("verdicts", "move-verdicts.py", [op_id, "--workers", threads], [own("verdicts")], [own("sidelines")], True),
        ("exits", "exits.py", [op_id, "--games", str(args.exit_games), "--threads", threads], [own("exits")],
         [own("sidelines"), own("club")], True),
        ("crosscheck", "crosscheck.py", [op_id, "--threads", threads],
         [os.path.join(".engine", "crosscheck", f"{op_id}.txt")], [own("evals"), own("sidelines")], True),
    ]
    if trap:
        chain = [s for s in chain if s[0] in ("evals", "crosscheck")]
    return [(name, [py, os.path.join(HERE, script)] + argv, writes, reads, os.path.join(HERE, script), lock)
            for name, script, argv, writes, reads, lock in chain]


def digest(*parts):
    h = hashlib.sha256()
    for part in parts:
        h.update(part if isinstance(part, bytes) else str(part).encode())
    return h.hexdigest()[:16]


def file_digest(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return "missing"
    with open(path, "rb") as f:
        return digest(f.read())


def content_digest(op_id):
    """The course's data, not its source: what every step actually reads."""
    out = subprocess.run([os.path.join(ROOT, ".venv", "bin", "python3"), "-c",
                          "import json, sys; sys.path.insert(0, 'src'); from importlib import import_module; "
                          f"print(json.dumps(import_module('content.openings.{op_id}').OPENING, sort_keys=True))"],
                         cwd=ROOT, capture_output=True, text=True)
    if out.returncode:
        raise SystemExit(f"content.openings.{op_id} does not import:\n{out.stderr}")
    return digest(out.stdout), json.loads(out.stdout)


def fingerprint(content, step):
    _, argv, _, reads, script, _ = step
    with open(script, "rb") as f:
        code = f.read()
    return digest(content, " ".join(argv[2:]), digest(code), *[file_digest(r) for r in reads])


def load_state(op_id):
    path = os.path.join(STATE, f"{op_id}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_state(op_id, state):
    os.makedirs(STATE, exist_ok=True)
    with open(os.path.join(STATE, f"{op_id}.json"), "w", encoding="utf-8") as f:
        json.dump(state, f, indent=1)


def log(text):
    print(f"{time.strftime('%H:%M:%S')} {text}", flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("opening")
    ap.add_argument("--threads", type=int, default=2)
    ap.add_argument("--reach", type=float, default=1.0, help="sidelines: grow at positions this share (%%) of games reach")
    ap.add_argument("--share", type=float, default=5, help="sidelines: ...from replies chosen this often (%%)")
    ap.add_argument("--moves", type=int, default=6, help="sidelines: ...in the opponent's first N moves")
    ap.add_argument("--exit-games", type=int, default=10, help="exits: answer club moves with this many games (a whole "
                    "month of the explorer is about four times the old stream sample, so 10 is the old 3)")
    ap.add_argument("--skip", default="", help="position-evals: model games to leave unscored, comma-separated "
                    "(default: the ones the course's evals file already skips)")
    ap.add_argument("--only", help="run only these steps, comma-separated")
    ap.add_argument("--force", action="store_true", help="rerun steps even when nothing they read changed")
    ap.add_argument("--status", action="store_true", help="say what would run, and stop")
    ap.add_argument("--background", action="store_true", help="detach, print the pid and log path, return")
    args = ap.parse_args()

    if args.background:
        os.makedirs(STATE, exist_ok=True)
        logpath = os.path.join(STATE, f"{args.opening}.log")
        argv = [a for a in sys.argv if a != "--background"]
        with open(logpath, "w") as out:
            child = subprocess.Popen([sys.executable] + argv, cwd=ROOT, stdout=out, stderr=subprocess.STDOUT,
                                     stdin=subprocess.DEVNULL, start_new_session=True)
        print(f"generating {args.opening}: pid {child.pid}, log {os.path.relpath(logpath, ROOT)}\n"
              f"wait for a last line starting 'done' or 'failed'; stop it with kill -- -{child.pid}")
        return

    content, op = content_digest(args.opening)
    trap = op.get("section") == "traps"
    if not args.skip:
        evals = os.path.join(ROOT, "src", "content", "evals", f"{args.opening}.json")
        if os.path.exists(evals):
            with open(evals, encoding="utf-8") as f:
                args.skip = ",".join(json.load(f).get("skipped") or [])
    chain = steps(args.opening, args, trap)
    only = set(args.only.split(",")) if args.only else None
    state = load_state(args.opening)
    started = time.time()
    log(f"{args.opening}: {'trap course, evals and cross-check only' if trap else 'repertoire course'}, "
        f"{len(chain)} steps")
    for step in chain:
        name, argv, writes, _, _, locked = step
        mark = fingerprint(content, step)
        fresh = all(os.path.exists(os.path.join(ROOT, w)) for w in writes) and state.get(name) == mark
        if (only and name not in only) or (fresh and not args.force and not only):
            log(f"{name}: {'not asked for' if only and name not in only else 'up to date'}")
            continue
        if args.status:
            log(f"{name}: would run ({'never run' if name not in state else 'its inputs changed'})")
            continue
        waited = 0.0
        with open(LOCK, "a") as lock:
            if locked:
                log(f"{name}: waiting for the engine lock")
                queued = time.time()
                fcntl.flock(lock, fcntl.LOCK_EX)
                waited = time.time() - queued
            log(f"{name}: running" + (f" after {waited / 60:.1f} min in the queue" if locked else ""))
            began = time.time()
            result = subprocess.run(["nice", "-n", "10" if locked else "5"] + argv, cwd=ROOT)
        if result.returncode:
            log(f"failed: {name} exited {result.returncode} after {int(time.time() - began)} s")
            sys.exit(result.returncode)
        # Fingerprinted after the run: a step's own output may be an input of a later one.
        state[name] = fingerprint(content, step)
        save_state(args.opening, state)
        log(f"{name}: done in {(time.time() - began) / 60:.1f} min of work")
    if not args.status:
        log(f"done: {args.opening} in {(time.time() - started) / 60:.1f} min")


if __name__ == "__main__":
    main()

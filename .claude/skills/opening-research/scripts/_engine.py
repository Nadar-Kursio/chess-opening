"""Shared helpers: find the repo, the engine, and the content package.

The verification scripts all need the same three things, and getting the engine
path wrong is the one failure that looks like "the analysis is just slow".
"""
import os
import subprocess
import sys

import chess
import chess.engine

DEPTH = int(os.environ.get("DEPTH", "20"))
# One thread by default. These scripts are usually run several at a time -- one
# per opening being authored -- and an engine that grabs most of the box makes
# every other run crawl. Raise it with THREADS= when you have the machine.
THREADS = int(os.environ.get("THREADS", "1"))


def repo_root():
    here = os.path.dirname(os.path.abspath(__file__))
    return subprocess.run(["git", "-C", here, "rev-parse", "--show-toplevel"],
                          capture_output=True, text=True, check=True).stdout.strip()


ROOT = repo_root()
sys.path.insert(0, os.path.join(ROOT, "src"))


def engine_path():
    """The Stockfish binary, or a message saying how to get one."""
    path = os.environ.get("STOCKFISH") or os.path.join(ROOT, ".engine", "stockfish")
    if not os.access(path, os.X_OK):
        raise SystemExit(
            f"no engine at {path}\n"
            f"  build one:  .claude/skills/opening-research/scripts/setup-engine.sh\n"
            f"  or point at your own:  STOCKFISH=/path/to/stockfish {sys.argv[0]}"
        )
    return path


def open_engine():
    eng = chess.engine.SimpleEngine.popen_uci(engine_path())
    eng.configure({"Threads": THREADS, "Hash": 512})
    return eng


def board_after(moves):
    """Replay a space-separated SAN string. Raises with the ply that broke."""
    board = chess.Board()
    for i, san in enumerate(moves.split(), 1):
        try:
            board.push_san(san)
        except Exception as e:
            raise ValueError(f"ply {i} '{san}': {e}") from None
    return board


def score(eng, board, depth=None):
    """Centipawns from White's point of view, mates as ±10000."""
    info = eng.analyse(board, chess.engine.Limit(depth=depth or DEPTH))
    pv = board.variation_san(info["pv"][:6]) if info.get("pv") else ""
    return info["score"].white().score(mate_score=10000), pv


def opening(name):
    from importlib import import_module
    return import_module(f"content.openings.{name}").OPENING


def source_of(name):
    """The file an opening module was read from, for staleness checks."""
    from importlib import import_module
    return import_module(f"content.openings.{name}").__file__


def numbered(ply, san):
    """'12.Nbd2' / '12...Nc6' -- the same shape the page shows."""
    return f"{(ply + 1) // 2}.{'' if ply % 2 else '..'}{san}"

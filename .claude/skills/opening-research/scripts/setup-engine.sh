#!/usr/bin/env bash
# Build Stockfish into .engine/ at the repo root. There is no engine in the repo
# and no package for it on this box; the verification scripts need one.
#
#   .claude/skills/opening-research/scripts/setup-engine.sh
#
# Takes about four minutes. .engine/ is gitignored -- the binary is ~90 MB and it
# is a tool, not content.
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
ENGINE_DIR="$ROOT/.engine"
BIN="$ENGINE_DIR/stockfish"

if [ -x "$BIN" ]; then
    echo "already built: $BIN"
    "$BIN" bench 2>&1 | tail -1 || true
    exit 0
fi

# Set ARCH yourself to override; `make -C src help` lists the targets this
# Stockfish version accepts, and they change between releases.
if [ -z "${ARCH:-}" ]; then
    case "$(uname -m)" in
        aarch64|arm64) ARCH=armv8 ;;
        x86_64)        ARCH=x86-64-avx2 ;;
        *)             ARCH=$(uname -m) ;;
    esac
fi

mkdir -p "$ENGINE_DIR"
SRC="$ENGINE_DIR/Stockfish"
[ -d "$SRC" ] || git clone --depth 1 https://github.com/official-stockfish/Stockfish.git "$SRC"

echo "building Stockfish (ARCH=$ARCH, this takes a few minutes)…"
if ! make -C "$SRC/src" -j"$(nproc)" build ARCH="$ARCH" > "$ENGINE_DIR/build.log" 2>&1; then
    # The reason is always in the log and never on screen otherwise; a rejected
    # ARCH looks identical to a compiler error until you read it.
    tail -20 "$ENGINE_DIR/build.log"
    echo "build failed — full log: $ENGINE_DIR/build.log" >&2
    echo "if ARCH=$ARCH was rejected, try: make -C $SRC/src help" >&2
    exit 1
fi
cp "$SRC/src/stockfish" "$BIN"
echo "built: $BIN"

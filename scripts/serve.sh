#!/usr/bin/env bash
#
# Build and serve the course locally, setting up the virtualenv if it is missing.
#
#   scripts/serve.sh                  http://127.0.0.1:8000/
#   scripts/serve.sh --port 9000
#   scripts/serve.sh --host 0.0.0.0   reachable from other machines
#
# Works from any directory, and always serves the checkout this script belongs
# to -- run the copy inside a worktree and you get that worktree, not main.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

py="$root/.venv/bin/python3"

if [ ! -x "$py" ]; then
  echo "creating .venv"
  python3 -m venv "$root/.venv"
fi

# Import check rather than a pip call, so a normal start costs nothing.
if ! "$py" -c "import chess" >/dev/null 2>&1; then
  echo "installing dependencies from requirements.txt"
  "$py" -m pip install --quiet --upgrade pip
  "$py" -m pip install --quiet -r "$root/requirements.txt"
fi

echo "serving $root"
exec "$py" src/build.py --serve "$@"

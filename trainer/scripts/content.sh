#!/usr/bin/env bash
# Compiles the course (src/build.py --emit, from the repo root) and copies the JSON into
# trainer/content/, which is what the server reads. A copy rather than a pointer at web/content/,
# so a later re-emit in the checkout can't change what a running server serves.
set -euo pipefail
cd "$(dirname "$0")/../.."
.venv/bin/python3 src/build.py --emit > /dev/null
rm -rf trainer/content
cp -r web/content trainer/content
echo "Copied $(ls trainer/content/openings | wc -l | tr -d ' ') openings into trainer/content/."

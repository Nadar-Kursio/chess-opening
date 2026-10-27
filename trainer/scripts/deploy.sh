#!/usr/bin/env bash
# Deploys new.chesslab.dev without downtime on a bad build:
#   1. compiles the course and builds into .next-staging while the live .next keeps serving,
#   2. stops the server, swaps the build in (keeping the old one as .next-previous), starts it,
#   3. rolls back if the new one doesn't answer.
# Run `npm run db:migrate:prod` first when a migration is pending.
set -euo pipefail
cd "$(dirname "$0")/.."

answers() {
  for _ in $(seq 1 30); do
    sleep 1
    curl -fs -o /dev/null http://localhost:3020/sign-in && return 0
  done
  return 1
}

scripts/content.sh
rm -rf .next-staging
echo "Building into .next-staging…"
NEXT_BUILD_DIR=.next-staging npx next build

systemctl --user stop chesslab-trainer
rm -rf .next-previous
if [ -d .next ]; then mv .next .next-previous; fi
mv .next-staging .next
systemctl --user start chesslab-trainer

if answers; then
  echo "Deployed: new.chesslab.dev answers on :3020."
  exit 0
fi
if [ ! -d .next-previous ]; then
  echo "The server didn't answer and there's no previous build to roll back to." >&2
  exit 1
fi
echo "The server didn't answer; rolling back to the previous build." >&2
systemctl --user stop chesslab-trainer
rm -rf .next-failed
mv .next .next-failed
mv .next-previous .next
systemctl --user reset-failed chesslab-trainer 2>/dev/null || true
systemctl --user start chesslab-trainer
exit 1

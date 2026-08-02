# chess-opening

An interactive opening course. Everything under `src/` is source; the build emits
one self-contained HTML file into `docs/`. See README.md for the layout.

## Commands

`build.py` writes relative to the current directory, so in a worktree you must
`cd` into it first or you will rebuild `main` instead of your branch.

```
.venv/bin/python3 src/build.py                  # write docs/
.venv/bin/python3 src/build.py --check          # fail if docs/ is stale
.venv/bin/python3 src/build.py --serve          # preview on localhost
.venv/bin/python3 -m unittest discover tests
```

System `python3` has no `python-chess`. Use the venv.

## Rules

- `docs/` is generated and gitignored. Never edit it, never commit it.
- The build does not parse the JavaScript it concatenates: a syntax error ships a
  dead page and the build still reports success. Open the page and check the
  console after touching anything under `src/app/scripts/`.
- Every claim about a position comes from the engine, never from memory —
  severities from `.engine/stockfish`, game scores and win bars (`record`) from
  pgnmentor. The `opening-research` skill has the procedure.
- Browser-layer tests use jsdom, not Playwright.
- Changes under `.github/workflows/` can read repository secrets. Review them as
  security changes, not as config.

## Deploying

Push to `main`; CI runs the tests, builds, and ships to https://chesslab.dev.
Every pull request gets the whole site at `https://<branch>.chesslab.pages.dev`,
posted as a comment on the PR.

---
name: work-issue
description: Take one GitHub issue from agent-ready to an open pull request — claim it, work it in its own git worktree, verify it, and open the PR carrying its preview link. Use when picking up an issue labelled agent-ready, when told to work issue #N, or when draining the agent queue.
---

# Working one issue

One issue, one worktree, one branch, one pull request, then stop. Never batch two
issues onto a branch, and never merge your own work — the pull request is the
point, not an obstacle before it.

The order is **claim → branch → work → verify → open**, and both ends matter.
Claiming first is what stops two runs starting the same issue. Verifying before
opening is what keeps the review queue worth reading; a queue of plausible-looking
pull requests that turn out wrong is worse than an empty one.

## The label states

| Label | Means |
|---|---|
| `agent-plan` | an idea, not yet a spec — draft a plan, do not write code |
| `agent-ready` | a human approved the plan; safe to work |
| `agent-working` | claimed, in flight |
| `agent-blocked` | tried and failed; needs a human |

Only `agent-ready` is workable. `agent-plan` means the spec is what's missing, so
the deliverable is a plan posted as a comment — nothing else.

## 1. Claim it first

```bash
gh issue list --label agent-ready --search "no:assignee sort:created-asc" \
  --limit 1 --json number,title
gh issue edit N --add-label agent-working --remove-label agent-ready --add-assignee @me
```

The label swap is the lease, so do it before touching a single file. If the issue
already carries `agent-working`, it is taken; leave it alone.

Read the issue's acceptance criteria now. If it has none, that is a blocked issue
rather than a puzzle to solve — go to §6.

## 2. Give it a worktree

```bash
git worktree add .worktrees/issue-N -b issue-N main
cd .worktrees/issue-N
```

The branch must be named exactly `issue-N`. Cloudflare derives the preview URL
from the branch, so `issue-42` serves at `issue-42.chesslab.pages.dev` — which is
how the pull request can carry a working link before the build has even finished.

Everything from here happens **inside the worktree**. `build.py` writes relative
to the current directory: run it from the repo root by accident and you rebuild
`main` instead of your branch, silently and successfully.

## 3. What a worktree does not have

`.venv/` and `.engine/` are gitignored, so a new worktree contains neither. Do not
build new ones — point at the main checkout:

```bash
PY=~/chess-opening/.venv/bin/python3
export STOCKFISH=~/chess-opening/.engine/stockfish
```

The interpreter living outside the worktree is fine and intended: the *current
directory* decides where the build writes, so `$PY src/build.py` run from inside
the worktree is correct. `STOCKFISH` is the documented override in
`scripts/_engine.py`, which otherwise looks for an engine under the worktree root
and will not find one.

## 4. Do the work

Content — variations, deviations, severities, plans, model games — goes through
the `opening-research` skill. Do not shortcut it. Severities come from the engine
and game scores from pgnmentor; a claim that sounds right is not a verified claim,
and prose about chess is the easiest thing in this repo to get confidently wrong.

Anything else follows the conventions already in `CLAUDE.md` and the surrounding
code.

## 5. Verify before you open anything

```bash
$PY -m unittest discover tests
$PY src/build.py
```

Both must pass. Then, depending on what you touched:

- **Content**: the verification scripts under
  `.claude/skills/opening-research/scripts/`. Their output is the evidence that
  goes in the pull request body.
- **Anything under `src/app/scripts/`**: the build concatenates JavaScript without
  parsing it, so a syntax error ships a dead page and the build still reports
  success. A green build is not evidence the page works — load it.

## 6. Open the pull request

Follow the `writing-prs` format. Three things are mandatory in the body:

- `Closes #N`, so the merge closes the issue
- the preview link, `https://issue-N.chesslab.pages.dev`
- what you ran, and its output — engine evidence for any claim about a position

Be honest about gaps in the Testing section. An unreviewed guess labelled as a
guess is useful; one labelled as verified is a trap.

Then stop. Do not merge.

## 7. When you cannot finish

Two attempts, then hand it back:

```bash
gh issue edit N --add-label agent-blocked --remove-label agent-working \
  --remove-assignee @me
gh issue comment N --body "…what was tried, and what specifically blocked it"
```

Say what you tried and where it stopped — a bare "blocked" costs the next reader
everything you already learned.

**Never exit while `agent-working` is still set.** That leaks the lease, and the
issue sits untouchable until somebody notices by hand.

## 8. Clean up

Once the pull request has merged:

```bash
cd ~/chess-opening
git worktree remove .worktrees/issue-N
```

Leave the worktree in place while the pull request is open — review comments
usually mean going back to it.

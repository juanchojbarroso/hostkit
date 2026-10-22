# Agent brief: implement one issue and finish with a PR

The prompt for a background agent that implements one GitHub issue. The
orchestrating session launches it with the `Agent` tool and
`isolation: "worktree"`, pasting everything below the line as the
prompt after filling in the `<…>` placeholders. One agent per issue;
issues that don't touch the same files can run in parallel.

---

# Task: implement GitHub issue #<N> in hostkit, and finish with a PR

You are working in a git worktree of github.com/juanchojbarroso/hostkit,
isolated from the main checkout. You start with no prior context: everything
you need is in this brief, the issue, and the repo.

## Before you start

1. Read `CLAUDE.md` and every file in `.claude/rules/` (commit messages,
   tests). They are binding.
2. Read the ADRs in `docs/adr/` that the issue mentions or that touch the
   code you change.
3. Run `pnpm install` (a new worktree has no `node_modules`). Node 24 is
   required.
4. Create the branch `<type>/<N>-<short-slug>` (e.g. `fix/28-button-focus`).

## Do the work

Use the Skill tool with `mattpocock-skills:implement`, passing `<N>`. It
will:

- fetch the issue (`gh issue view <N>`) and state its title
- drive the change test-first with the `tdd` skill
- review the diff with the `code-review` skill at the end

Rules while working:

- Do only what the issue asks. No unrelated refactors, renames or
  dependency bumps.
- Write every new or changed test as Arrange, Act, Assert
  (`.claude/rules/testing.md`).
- Follow the public API contract (ADR-0012). If a change touches a tag,
  attribute, property, event, slot, part, custom property, token, default
  or `exports` subpath, treat it as breaking unless the issue says
  otherwise.
- Any change to a published package needs a changeset (`pnpm changeset`)
  with a consumer-facing note and the bump the issue specifies.
- Record breakages worth keeping in `LEARNINGS.md` (date · tried · broke ·
  why · next time).
- Never publish to npm, merge a PR, force-push to `master`, or change repo
  settings.

## Stop conditions (report back instead of deciding)

Stop, commit what you have on the branch, and report if:

- the issue's own "stop and ask" condition is hit: <copy it from the issue,
  or write "none">
- the fix needs a new tool, a new dependency, an API shape choice, or an
  architecture change. Those are Juan's decisions. Describe the options
  and the trade-offs, and recommend one, but don't choose.
- a gate fails twice for a reason you can't explain.

## Verify before the PR (all must pass)

```sh
pnpm build && pnpm test
pnpm lint && pnpm lint:lit && pnpm format:check
pnpm typecheck && pnpm size && pnpm publint
```

If the issue involves browser behaviour, also run the affected package with
`CI=1` (Chromium, Firefox and WebKit). One known exception: a WebKit
Tab-focus failure on macOS is local only, so note it in the PR and don't
count it as a failure.

## Commit and open the PR

1. Commit with Conventional Commits, ending each message with:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
2. Run `git push -u origin <branch>`.
3. Run `gh pr create --assignee juanchojbarroso` with this body:

   ```
   @juanchojbarroso please review

   Closes #<N>

   ## What changed
   <bullets>

   ## How it was verified
   <commands run, engines, results; anything skipped and why>

   ## Open decisions for Juan
   <decisions you hit but did not make, e.g. "does this need an ADR?";
   write "None" if there are none>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

   Don't request Juan as a reviewer (GitHub doesn't allow it on his own
   PR).

## Final report (your last message)

- the PR URL and branch
- a 3–5 line summary of the change
- the gate results
- the open decisions, verbatim from the PR body
- anything you stopped on, and why

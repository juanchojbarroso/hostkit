---
status: proposed
date: 2026-10-21
deciders: Juan Barroso
---

# 0018. Smoke-test every release from npm and jsDelivr, in a workflow that can't publish

## Context and problem statement

The tarball smoke tests (#8) prove the packages before they are
published. They can't prove what consumers actually get: the files on
npm and on jsDelivr. A publish can still go wrong in ways a tarball
can't show: a missing file, a registry that lags, a CDN that serves an
old version. Phase 0's exit criterion (#1, #12) is that the button
passes the same smoke tests in all three hosts **from the registry
copies**, so every release needs a check after it is published. Where
that check runs matters, because `release.yml` is the file npm trusts
to publish (ADR-0016).

## Decision drivers

- Least privilege: nothing new may be able to mint an npm OIDC token
  or reach the publish step.
- The same specs as the tarball run, so a pass means the same thing.
- A broken release must be visible, not just a red run nobody watches.
- It must be possible to check a version already out (0.1.0) by hand.

## Considered options

1. A job inside `release.yml` (plus `workflow_dispatch` on `release.yml`
   for manual runs).
2. A separate workflow, `post-publish-smoke.yml`, with
   `workflow_dispatch` and `workflow_call`; `release.yml` calls it after
   a publish.
3. A scheduled workflow that checks npm `latest` every few hours.

## Decision outcome

Chosen: **option 2**, because a manual run of it can never reach the
publish step, and its jobs never get `id-token: write`, while
`release.yml` still triggers it automatically with the versions it just
published. Option 1 puts a manual trigger on the file npm trusts.
Option 3 finds a broken release hours late and can't name the version
that broke.

The test itself is a second mode of the existing smoke script
(`pnpm test:registry <versions>`): the same app copies and specs, with
`^<version>` installs from npm (exact `<version>` only if npm already
has a newer match) and exact-version jsDelivr URLs. It waits for npm and
jsDelivr within one bounded budget. If it fails, a separate `report`
job (the only one with `issues: write`) opens an issue labelled `bug`.

### Consequences

- Good: every release is checked as consumers get it, on three
  engines, and a failure opens an issue with the run URL and the stage
  that failed.
- Good: `gh workflow run post-publish-smoke.yml -f version=X` checks any
  released version by hand, with no route to the publish step.
- Bad: the job runs inside the release run, so it holds `release.yml`'s
  concurrency group longer (up to the wait budget plus about ten
  minutes of tests). A push to `master` during that window waits; a
  pending run that is not the newest is cancelled. Publishing is
  idempotent, so the newest run does the same work.
- Bad: the job's setup steps are a copy of `ci.yml`'s tarball job.
- Revisit when: release runs queue up behind the smoke often enough to
  matter (then trigger it with `workflow_run` instead), or a third
  workflow copies the same setup (then extract a composite action).

## Lesson

Test what users get, not what you built: the registry copy is a
different artefact from the tarball you packed. And put checks that
anyone may run by hand in a file that has no power to publish.

---
status: accepted
date: 2026-10-20
deciders: Juan Barroso
---

# 0016. Publish from CI with npm trusted publishing, independent versions

## Context and problem statement

hostkit publishes `@hostkit-ui/tokens` and `@hostkit-ui/components` from
GitHub Actions with Changesets (brief §6.4). Two questions: how CI
authenticates to npm, and whether the two packages share a version number.
Components read token names but don't import the tokens package (the host
loads both), so no dependency links the two versions today.

## Decision drivers

- Public repo: no long-lived secret that can publish as us
- Every version traceable to the commit and workflow that built it
  (provenance)
- A wrong first publish must not burn the first real version number
- Each package should bump only when it changes
- Never ship `1.0.0` by accident: it's reserved for the M2 MVP
  (ADR-0012 Q6)

## Considered options

**Authentication**

1. An npm token stored as a GitHub secret
2. Bootstrap by hand, then npm trusted publishing (OIDC)
3. Bootstrap with a token and keep it as a fallback

**Versioning**

1. Fixed: all `@hostkit-ui/*` packages share one version
2. Independent, with components declaring tokens as a peer dependency
3. Linked: shared version line only when both change

## Decision outcome

Chosen:

- **Trusted publishing (OIDC), with no npm token in GitHub.** Trusted
  publishing can't create a package, so each package's first version is
  a placeholder `0.0.0` published by hand with 2FA. The trusted
  publisher is configured right after, and the first CI publish follows
  within npm's 48-hour validation window. `0.0.0` is then deprecated. A
  throwaway `@hostkit-ui/release-probe` package goes through the whole
  flow first, so the riskiest step fails on something disposable.
- **Independent versions.** Components declare tokens as an **optional**
  peer dependency (`^0.1.0`), so pnpm warns only when an incompatible
  tokens version is installed. Changesets'
  `onlyUpdatePeerDependentsWhenOutOfRange` option is enabled. Without
  it, any tokens bump forces a *major* bump of components, which under
  `0.x` means an accidental `1.0.0`.
- The first real release of each package is **`0.1.0`**. `^0.0.1` accepts
  only `0.0.1`, which would stop patches reaching consumers and make
  ADR-0012's "breaking = minor during 0.x" rule meaningless.

### Consequences

- Good: no publishing secret to leak; every version has provenance
- Good: each package's version says what changed in that package
- Bad: one manual step per new package (the bootstrap), with a 48-hour
  clock
- Bad: the peer-dependent option is flagged experimental upstream; it can
  change in a Changesets patch
- Bad: a peer dependency means nothing to CDN users; the README carries a
  compatibility table of tested version pairs instead
- Validation: each CI-published version shows the Provenance badge on
  npm; two Changesets dry runs must pass (a tokens-only patch leaves
  components unchanged; a breaking tokens change gives components a
  patch with an updated peer range, never `1.0.0`)
- Revisit when: the Changesets option changes or is removed; a third
  package arrives; or consumers repeatedly load mismatched pairs from
  the CDN

## Lesson

Remove the secret instead of guarding it. When a tool's default fights
your policy, pin the setting, write down why, and prove it with a test.

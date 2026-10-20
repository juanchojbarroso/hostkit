---
status: accepted
date: 2026-10-20
deciders: Juan Barroso
---

# 0015. Supported frameworks, browsers and the Lit dependency

## Context and problem statement

ADR-0012 Q5 makes "the minimum framework version we test against" part of
the contract, so the floor must be set before `0.1.0` ships. React is
where the version changes behaviour: React 19 sets properties on custom
elements and attaches listeners for custom events; React 18 turns every
prop into a string attribute, so `checked={false}` renders a present
boolean attribute and the box shows as checked. Separately, ADR-0006 keeps
Lit external in `dist/` but doesn't say how `package.json` declares it.

## Decision drivers

- Components must work unchanged in each host (brief §6.1); wrappers are
  out of scope
- Raising a floor later is breaking, so start where support is honest
- Never ship two copies of Lit to a bundler user (ADR-0006)
- A consumer shouldn't need to know hostkit is built with Lit
- Phase 0 time budget: one app per framework

## Considered options

**Framework floor**

1. React 19+ and Vue 3.5+; React 18 documented as unsupported
2. React 18 and 19, with a second React app in CI
3. React 19 now, re-check React 18 in M2

**Lit declaration**

1. `dependencies: { "lit": "^3.3.0" }`
2. `peerDependencies: { "lit": "^3.3.0" }`

## Decision outcome

Chosen:

- **React 19+, Vue 3.5+, evergreen browsers** (Chromium, Firefox and
  WebKit, as tested in ADR-0007). React 18 is documented as unsupported,
  with the property/attribute reason. Vue consumers must configure
  `compilerOptions.isCustomElement` for the `hk-` prefix; this goes in
  the usage docs.
- **`lit` is a regular dependency at `^3.3.0`**, the floor proven by the
  ADR-0011 spike. Package managers dedupe it with an app's own Lit 3.x.
  This matches Shoelace/Web Awesome and Red Hat.

### Consequences

- Good: one honest support statement; one consumer app per framework
- Good: installing hostkit just works; no "missing peer lit" warning
  for teams that never chose Lit
- Bad: React 18 teams can't adopt hostkit without upgrading
- Bad: an app that pins an incompatible Lit gets a second copy silently
  instead of a warning
- Validation: Playwright smoke tests in each consumer app check property,
  attribute and event behaviour; the React and Vue smoke tests assert the
  production bundle contains exactly one Lit copy
- Revisit when: a consumer needs React 18; React custom-event interop in
  Phase 1 (`hk-change`) contradicts this ADR; or Lit 4 ships

## Lesson

A support floor is a promise, not a hope. Set it where you test, and
write down why the next version down isn't supported.

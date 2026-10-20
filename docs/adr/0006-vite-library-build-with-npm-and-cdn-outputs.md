---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0006. Vite library build with npm and CDN outputs

## Context and problem statement

`@hostkit/components` has two kinds of consumer with opposite needs.
Bundler users (the React shell, the Vue micro-frontend) need unbundled ESM
with Lit external, so their bundler keeps one copy of Lit and drops unused
components. CDN users (the HTML share widget) need a self-contained file,
because a browser can't resolve `import 'lit'` without an import map.

## Decision drivers

- Never ship two copies of Lit to a bundler user
- The CDN must work from an exact version URL (brief §6.3) with no
  dependency on an outside rewriting service
- Vite is a learning goal

## Considered options

1. Vite library mode, two outputs
2. `tsc` only, with jsDelivr `/+esm` for the CDN
3. `tsc` for npm + Vite for the CDN
4. Rollup directly

## Decision outcome

Chosen: **Vite library mode with two outputs**:

- `dist/`: ESM, `preserveModules`, `lit` external. This is what `exports`
  points to.
- `cdn/`: Lit bundled in, minified, one file per entry point plus `all.js`
- Types: `tsc --emitDeclarationOnly` into `dist/`

### Consequences

- Good: each audience gets the right artifact; one tool to learn deeply;
  the Vite dev server doubles as the M1 playground
- Bad: two build configs to keep in sync; Vite's library mode hides what
  Rollup is doing, so `preserveModules` output must be checked by hand
- Bad: every CDN bundle carries its own Lit. That costs bytes, and it
  matters for M3 (version coexistence).
- Validation: CI runs publint on the packed tarball, and the consumer
  smoke tests (ADR-0015) fail if Lit leaks into `dist/`, a bare
  specifier survives in `cdn/`, or `sideEffects` lets a bundler drop an
  element definition
- Revisit when: the CDN bundle exceeds its size budget, or import maps
  become the recommended CDN pattern for consumers

## Lesson

Name your consumers before you choose a tool. One artifact rarely serves
two audiences well.

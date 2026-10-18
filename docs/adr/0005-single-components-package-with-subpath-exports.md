---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0005. Single components package with subpath exports

## Context and problem statement

Import paths are a public contract: once consumers write
`import '@hostkit/…'`, changing the shape breaks them. How do we split
hostkit into npm packages?

## Decision drivers

- Reversibility (this is close to a one-way door)
- Tree-shaking: one entry point per component (brief §6.2)
- M3: two major versions on one page must stay tractable
- Release overhead for a one-person team

## Considered options

1. `@hostkit/tokens` + `@hostkit/components` with one subpath per component
2. One package per component (Spectrum model)
3. Per-component packages + an umbrella re-export package
4. One package containing both tokens and components

## Decision outcome

Chosen: **option 1**.

- `@hostkit/tokens`: CSS custom properties, usable without any components
- `@hostkit/components`: `exports` maps `./button.js`, `./checkbox.js`, …,
  plus `./all.js` for the full bundle
- `sideEffects` lists the files that define elements, so a bundler doesn't
  drop a `customElements.define()` call as dead code

### Consequences

- Good: one version, one changeset per release; simple CDN URLs; the
  "one major per micro-frontend" rule stays easy to state
- Good: still reversible. A subpath can later re-export a new
  per-component package without breaking consumers.
- Bad: fixing a bug in one component means releasing all of them
- Revisit when: components need independent release cadences, or
  different teams own different components

## Lesson

When two options look equal, choose the one that keeps future options
open. Splitting later is cheap; merging later breaks every import.

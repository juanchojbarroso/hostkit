---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0002. pnpm workspaces, Turborepo deferred

## Context and problem statement

M1 needs a monorepo with roughly four workspaces: `packages/tokens` →
`packages/components` → `apps/react-shell` and `apps/vue-detail`. Which
tooling orchestrates them?

## Decision drivers

- M1 deadline: Thu 2026-10-22
- Reversibility: how expensive is it to change later?
- Learning value relative to time spent

## Considered options

1. pnpm workspaces only
2. pnpm workspaces + Turborepo
3. Nx

## Decision outcome

Chosen: **pnpm workspaces only**. `pnpm -r` already
runs scripts in topological order, which is all four packages need.
Turborepo's main value is task caching, and there is nothing slow enough
to cache yet. Nx is too heavy for this size.

Layout: `packages/*` for publishable libraries, `apps/*` for consumers.

### Consequences

- Good: fewer moving parts before M1; the dependency graph lives in the
  `package.json` files, where it is visible
- Bad: no remote cache, so CI rebuilds everything every run
- Revisit when: CI takes more than ~3 minutes, or local rebuilds of
  unchanged packages become noticeable. Adding Turborepo is a
  `turbo.json` plus script changes (a two-way door).

## Lesson

Adopt tools at the last responsible moment, when you feel the pain they
remove. A tool added before its problem exists is pure cost.

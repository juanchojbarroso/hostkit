---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0003. Hand-written CSS tokens first

## Context and problem statement

Tokens come in three layers: primitive (`--hk-blue-500`) → semantic
(`--hk-color-action-primary`) → component (`--hk-button-bg`), with light
and dark themes. Should the source of truth be hand-written CSS custom
properties, or DTCG JSON compiled by Style Dictionary?

## Decision drivers

- The main M1 risk is Lit components working in React *and* Vue, not tokens
- CSS is the only output format M1 needs
- Migration cost later

## Considered options

1. Hand-written CSS custom properties
2. Style Dictionary with W3C DTCG JSON from day one

## Decision outcome

Chosen: **hand-written CSS custom properties**, with the three layers kept
in separate files so that a later migration is mechanical. Semantic tokens
reference primitives with `var()`, which does what alias resolution would
do.

### Consequences

- Good: no build step for tokens; time goes to the risky part of M1
- Bad: no JS/JSON token output; nothing validates names
- Revisit when: a second output format is needed (JSON for the M5 agent
  manifest, JS constants, Figma sync). Then migrate to Style Dictionary +
  DTCG and write ADR-NNNN superseding this one.

## Lesson

Spend effort where the risk is. Keeping the *structure* right (three
layers) is what keeps a cheap choice reversible later.

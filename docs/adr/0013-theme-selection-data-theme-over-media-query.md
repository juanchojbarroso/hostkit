---
status: accepted
date: 2026-10-19
deciders: Juan Barroso
---

# 0013. Theme selection: `data-theme` overrides the OS preference

## Context and problem statement

`@hostkit-ui/tokens` ships light and dark values for the semantic tokens.
What decides which theme a page gets: the user's OS setting, an explicit
choice made by the app (the M2 `hk-theme-switch`), or both?

## Decision drivers

- Pages with no setup should match the user's OS preference
- An app must be able to force a theme (a user's explicit choice)
- One rule, easy to state to consumers

## Considered options

1. `prefers-color-scheme` only
2. `[data-theme]` only
3. Both, with `[data-theme]` taking precedence

## Decision outcome

Chosen: **option 3**. With no attribute set, the OS preference applies
(`@media (prefers-color-scheme: dark)` scoped to
`:root:not([data-theme="light"])`). `data-theme="light"` or `"dark"` on
the root element always wins.

### Consequences

- Good: zero-config default; explicit choice still works; this is what
  `hk-theme-switch` will toggle
- Bad: dark values are declared twice (media query and attribute); keep
  them in one block per selector so they can't drift
- Revisit when: tokens move to Style Dictionary (ADR-0003), which can
  generate both blocks from one source

## Lesson

Respect the user's default, and let an explicit choice override it.
Write the precedence rule down, because "which one wins?" is the first
bug report.

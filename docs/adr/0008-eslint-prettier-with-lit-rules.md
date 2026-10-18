---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0008. ESLint + Prettier with Lit and Web Component rules

## Context and problem statement

What lints and formats the code? In a design system, the rules that catch
real bugs are domain rules: Lit binding mistakes, Web Component lifecycle
errors, and types inside `` html`…` `` templates that TypeScript can't see.

## Decision drivers

- Lit and Web Component rules exist (or not) for each tool
- Formatting must be automated and non-negotiable
- Familiar to reviewers and AI agents (M5)

## Considered options

1. ESLint (flat config) + Prettier + Lit/WC plugins + lit-analyzer
2. Biome only
3. Biome for formatting, ESLint for rules
4. Prettier only, no linter

## Decision outcome

Chosen: **option 1**:

- `typescript-eslint` (strict), `eslint-plugin-lit`, `eslint-plugin-wc`
- Prettier for all formatting; ESLint carries no style rules
- `lit-analyzer` type-checks templates (bindings, attribute types, unknown
  elements)

### Consequences

- Good: catches mistakes that Biome and TypeScript alone miss; a standard
  setup that any reviewer or agent can read
- Bad: slower than Biome; more dependencies; lit-analyzer is maintained
  less actively than the rest
- Revisit when: Biome gains Lit/WC rules, or lint time becomes noticeable

## Lesson

Pick linters for the bugs they catch in *your* domain, not for speed or
fashion. Automate style so it never reaches code review.

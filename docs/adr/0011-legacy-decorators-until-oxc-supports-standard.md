---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0011. Legacy decorators until Oxc supports standard decorators

## Context and problem statement

Lit components declare reactive properties with decorators
(`@property() variant = 'primary'`). No browser runs decorator syntax yet,
so the build tool must translate it. There are two dialects: legacy
(TypeScript `experimentalDecorators`, used by most Lit examples) and the
TC39 standard (`@property() accessor variant`). Which one do we write?

The plan was the standard dialect, conditional on a spike
(branch `spike/standard-decorators`).

## Decision drivers

- Must work through Vite 8 build *and* Vitest browser tests (ADR-0006, 0007)
- Size budget per component
- Ease of a later migration to the standard dialect

## Spike evidence (Vite 8.3, Vitest 5.0, TypeScript 7.0, Lit 3.3)

| Check | Standard | Legacy |
|---|---|---|
| TypeScript 7 types and emit | ✅ | ✅ |
| Vite 8 / Oxc build and tests | ❌ raw `@` syntax emitted, browser fails | ✅ `oxc.decorator.legacy` |
| Vite 8 + Babel (`@rolldown/plugin-babel`) | ✅ | n/a |
| Custom Elements Manifest analyzer | ✅ | ✅ |
| lit-analyzer (with TypeScript 5.9) | ✅ | ✅ |
| Gzipped size, one component | 2.38 kB (Babel decorator helper) | 0.63 kB |

## Considered options

1. Legacy decorators
2. Standard decorators + Babel in the Vite pipeline
3. No decorators (`static properties`)

## Decision outcome

Chosen: **legacy decorators**, because they are the only option that
works natively with the toolchain we already chose, at the smallest size.

- `tsconfig`: `experimentalDecorators: true`, `useDefineForClassFields: false`
- `vite.config`: `oxc: { decorator: { legacy: true } }`

### Consequences

- Good: no extra transform tool; smallest output; matches most Lit examples
- Bad: non-standard syntax that TypeScript is moving away from
- Bad: removing `useDefineForClassFields: false` silently breaks every
  reactive property. A component test must catch this (assert a property
  change re-renders).
- Revisit when: Oxc lowers standard decorators. The migration is mechanical
  (add `accessor`, flip the two flags), so it's a candidate for the M5 codemod.

## Lesson

A standard that's right in principle isn't right for you until your
toolchain supports it. Settle risky bets with a time-boxed spike before
you build on them, and change your mind when the evidence disagrees.

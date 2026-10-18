---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0010. Publish under the `@hostkit-ui` npm scope

## Context and problem statement

ADR-0005 assumed the `@hostkit` npm scope, but that org is already taken
(as is `@hkit`). The scope appears in every consumer import and every CDN
URL, so renaming it later is a breaking change for all consumers. What
namespace do we publish under?

## Decision drivers

- Namespace protection: nobody else can publish packages that look official
- An org that a platform team would own (members, publish rights, 2FA)
- Keep ADR-0005's shape; keep the product name `hostkit` and the `hk-` prefix
- The name must be free *today* (checked against
  `registry.npmjs.org/-/org/<name>/package`)

## Considered options

1. `@hostkit-ui` org
2. `@hostkitjs` org
3. `@juanchojbarroso` personal scope
4. Unscoped `hostkit` / `hostkit-tokens`

## Decision outcome

Chosen: **`@hostkit-ui`**: `@hostkit-ui/tokens` and `@hostkit-ui/components`.
The product is still called hostkit; only the distribution namespace
differs.

### Consequences

- Good: protected namespace; ADR-0005's shape is unchanged
- Bad: the npm name differs slightly from the product and repo name;
  docs must say so once, clearly
- Action: create the npm org now, before anyone else does
- Revisit when: never, cheaply. Any change after the first publish is a
  breaking rename.

## Lesson

Keep the product name separate from the distribution namespace, so a
naming collision changes one thing, not your design. Check availability
in every namespace (npm org, package, GitHub) *before* committing to a
name, and reserve it right away.

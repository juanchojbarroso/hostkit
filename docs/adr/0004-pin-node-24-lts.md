---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0004. Pin Node 24 LTS

## Context and problem statement

The local machine runs Node 20.11.1, which reached end-of-life in April
2026. Which runtime should the repo assume, and how is it enforced?

## Decision drivers

- Security support for the life of the project
- The same runtime locally and in CI
- Tool compatibility (Vite, Vitest, Storybook)

## Considered options

1. Node 24 (Active LTS)
2. Node 22 (Maintenance LTS, until 2027-04)
3. Stay on Node 20 (EOL)

## Decision outcome

Chosen: **Node 24 LTS**, pinned in three places: `.nvmrc` (local version
managers and `actions/setup-node`), `engines` (fails installs on the wrong
major), and `packageManager` (Corepack pins the exact pnpm version).

### Consequences

- Good: supported runtime; reproducible installs
- Bad: requires installing Node 24 locally
- Revisit when: a key tool breaks on 24 (fall back to 22), or Node 26
  becomes LTS (2027-10)

## Lesson

Make the environment part of the code. "Works on my machine" is a missing
config file.

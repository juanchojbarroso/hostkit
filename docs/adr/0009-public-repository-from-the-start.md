---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0009. Public repository from the start

## Context and problem statement

Should the hostkit GitHub repo be public from the first commit, or private
until a milestone? This is a decision about how the work is seen, not a
technical one.

## Decision drivers

- Show the work as it happens, linkable from the first commit
- Storybook hosting: GitHub Pages needs a public repo on the free plan
- Partly a one-way door: clones made while public can't be recalled
- No secrets or customer data in the repo

## Considered options

1. Public now
2. Public after M1
3. Private until M2

## Decision outcome

Chosen: **public now**. Learn in public: the ADRs and `LEARNINGS.md` show
judgment before every component exists, and visible mistakes are the
point of a Breakable Toy.

### Consequences

- Good: linkable work from the first commit; free Pages for Storybook (M2);
  the commit history tells the story as it happens
- Bad: unfinished work is visible; never commit secrets (`.env*` is
  gitignored; add secret scanning in CI)
- Revisit when: something sensitive needs to live in the repo (it
  shouldn't)

## Lesson

How work is seen is part of the work. Write down your reasoning so that
your mistakes, made in public, read as learning rather than carelessness.

---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0001. Record decisions with MADR

## Context and problem statement

hostkit is a Breakable Toy meant to build principal-level judgement. A
decision whose reasoning is lost cannot be learned from, defended later,
or revisited when its assumptions change.

## Decision drivers

- Decisions must be citable later, with their reasoning
- Rejected options carry as much learning as the chosen one
- Low ceremony: writing one must take minutes, not an hour

## Considered options

1. MADR files in `docs/adr`
2. Nygard-style short ADRs (Context / Decision / Consequences)
3. A single running `LEARNINGS.md`

## Decision outcome

Chosen: **MADR in `docs/adr`**, because its "considered options" section
records what we rejected and why, which is the part that teaches.
`LEARNINGS.md` stays, but for things that *broke*, not things we *chose*.

### Consequences

- Good: each decision is reviewable, linkable and versioned with the code
- Bad: a small writing cost per decision
- Revisit when: ADRs stop being written because the cost feels too high

## Lesson

Decide how you decide before deciding anything else. A team's decision
log is the main artefact a principal engineer leaves behind.

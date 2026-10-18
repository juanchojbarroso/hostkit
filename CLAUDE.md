# hostkit

A framework-agnostic design system: Lit Web Components, tag prefix `hk-`.
It is a Breakable Toy for growing into a principal engineer. The learning
is the deliverable.

Project brief (scope, milestones, definition of done): Juan's Obsidian
note "hostkit - project brief".

## Working agreement

- **Decide together.** Never choose a tool, API shape, or architecture
  alone. Present the options, the trade-offs, a recommendation, and the
  principle behind it; Juan decides.
- **Record every decision** as an ADR in `docs/adr` (MADR, see ADR-0001).
  Record every failure worth keeping in `LEARNINGS.md`.
- Mechanical work inside an agreed decision can proceed without asking.

## Current decisions

Full list in `docs/adr/README.md`. In short:

- pnpm workspaces, no Turborepo yet; `packages/*` libraries, `apps/*` consumers
- npm scope `@hostkit-ui` (`@hostkit` is taken; product name stays hostkit)
- `@hostkit-ui/tokens` (hand-written CSS) + `@hostkit-ui/components` (one
  package, one subpath export per component, plus `all.js`)
- Vite library build: `dist/` for npm (Lit external), `cdn/` (Lit bundled)
- Vitest browser mode + Playwright; axe-core in component tests
- ESLint (typescript-eslint, lit, wc) + Prettier + lit-analyzer
- Legacy decorators (`experimentalDecorators`), see ADR-0011
- Node 24 LTS; public repo

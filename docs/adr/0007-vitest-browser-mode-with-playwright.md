---
status: accepted
date: 2026-10-18
deciders: Juan Barroso
---

# 0007. Vitest browser mode with Playwright

## Context and problem statement

hostkit components depend on browser features that simulated DOMs
(jsdom, happy-dom) only partly implement or get wrong: Shadow DOM and
`composed` events, `ElementInternals` and form association, `:focus-visible`,
native `<dialog>`. Where and how do we run unit tests?

## Decision drivers

- Fidelity: a test must fail when a real browser would fail
- The definition of done requires 0 axe violations
- One toolchain, shared with the Vite build
- WebKit matters: the end user is on a phone, most likely Safari

## Considered options

1. Vitest browser mode, Playwright provider, three engines in CI
2. Web Test Runner (Modern Web)
3. Vitest with happy-dom
4. Vitest browser mode, Chromium only

## Decision outcome

Chosen: **Vitest browser mode with Playwright**.

- Local: Chromium (fast feedback)
- CI: Chromium, Firefox and WebKit
- Accessibility: axe-core runs inside the same component tests

### Consequences

- Good: tests run where users run the code; the same Vite config for
  build and test; cross-engine bugs show up in CI, not in production
- Bad: slower than a simulated DOM; CI must install Playwright browsers
  (cache them)
- Bad: a WebKit-only failure may appear in CI before you can reproduce
  it locally (run `--browser=webkit` when that happens)
- Revisit when: CI test time exceeds its budget, or Vitest browser mode
  blocks a needed scenario that Web Test Runner supports

## Lesson

Test where the code runs. A test that passes in a simulated DOM and fails
in a real browser is worse than having no test, because it gives you
false confidence.

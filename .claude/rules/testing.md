---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# Tests: Arrange, Act, Assert

Write every test in three blocks, in this order, separated by one blank
line:

1. **Arrange**: render the element, load tokens, attach listeners, set
   the starting state.
2. **Act**: the one thing the test is about (a click, a key press, a
   property change, an attribute change).
3. **Assert**: `expect` calls only. No more actions.

```ts
test('an enabled button fires click when the user clicks it', async () => {
  const el = await render('<hk-button>Save</hk-button>');
  let clicks = 0;
  el.addEventListener('click', () => clicks++);

  await userEvent.click(el);

  expect(clicks).toBe(1);
});
```

- Use the blank lines, not `// Arrange` / `// Act` / `// Assert`
  comments. Comment only to say *why* (as the existing tests do).
- One Act per test. When a test checks a transition (a default, then a
  change), a second Act + Assert pair is fine; a third means split the
  test.
- An `expect` inside Arrange is a guard, not the assertion under test:
  use it only to fail early when the setup is wrong (e.g.
  `expect(el.disabled).toBe(true)` before clicking).
- Shared setup that every test needs goes in `beforeEach` / `afterEach`
  or a helper (`render`, `query`, `loadTokens`); setup for one test stays
  in that test's Arrange.
- The test name states the behaviour and the condition (`a disabled
  button fires no click, wherever it is clicked`), not the method.
- Existing tests are not rewritten just to follow this rule; bring a test
  in line when you change it.

The project's test stack is fixed by ADR-0007: Vitest browser mode with
Playwright, real browsers, never happy-dom or jsdom; axe-core runs in
the component tests; app smoke tests are Playwright specs.

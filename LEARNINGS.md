# Learnings

Things that **broke**, and what they taught. (Things we *chose* live in
[`docs/adr`](docs/adr/README.md).)

Format: date · what I tried · what broke · why · what I'd do next time.

## 2026-10-18 · Name collisions, twice

- **Tried:** `basket-ui` (npm package), then the `@hostkit` npm org.
- **Broke:** both were already taken. I found out after choosing the name
  and writing it into ADR-0005.
- **Why:** I checked availability after deciding, not before, and checked
  only one namespace (the package, not the org).
- **Next time:** check every namespace first (npm org via
  `registry.npmjs.org/-/org/<name>/package`, npm package, GitHub), then
  reserve it immediately. Keep the product name separate from the
  distribution namespace, so a collision changes one line, not the design.
  See ADR-0010.

## 2026-10-18 · Vite 8 doesn't translate standard decorators

- **Tried:** a Lit component with standard decorators (`@property() accessor x`)
  through Vite 8 and Vitest browser mode.
- **Broke:** the browser test failed with "Unexpected token 'export'",
  a misleading message. Vite 8's new transformer (Oxc) only lowers
  *legacy* decorators; it passed the `@` syntax to the browser untouched.
- **Also broke:** lit-analyzer crashed with `Cannot read properties of
  undefined (reading 'Latest')`. It uses whatever `typescript` it finds,
  and the TypeScript 7 npm package has no compiler API.
- **Why I found it cheaply:** a one-hour spike before writing real
  components. Reading the *built output* (not the error message) showed
  the cause in seconds.
- **Next time:** when a tool reports a strange error, inspect what it
  actually produced. Upgrading a toolchain major (Vite 7→8, TS 5→7) means
  re-checking every assumption. See ADR-0011 and branch
  `spike/standard-decorators`.

## 2026-10-20 · The release probe caught three problems before the real packages

- **Tried:** a throwaway `@hostkit-ui/release-probe` through the whole
  external release flow (ADR-0016): manual `0.0.0`, `npm trust`, then
  `changesets/action@v2` publishing `0.0.1` from CI with OIDC.
- **Broke, 1:** the first workflow run failed: `changesets/action` v2
  renamed the `publish` input to `publish-script`. Most examples online
  still use the old name.
- **Broke, 2:** the manual publish returned `E403 Two-factor
  authentication ... is required`. 2FA was off on the npm account.
  With trusted publishing, CI no longer needs a token, so the
  account is the remaining way to publish, and it was the unprotected one.
- **Broke, 3 (a warning):** `pnpm/action-setup@v4` targets Node 20, which
  GitHub is retiring; the runner forced it onto Node 24. Fixed with `@v6`.
- **Why I found them cheaply:** each failure hit a disposable package, so
  no real version number was burned and the 48-hour trust clock wasn't
  wasted on the real packages.
- **Next time:** read an action's release notes for every major you
  adopt, not only examples. Check `npm profile get` (`tfa`) before any
  first publish. Rehearse any external, hard-to-undo flow on a probe
  first.

## 2026-10-20 · A filter in my own test hid the bug it was meant to catch

- **Tried:** `hk-button` with `pointer-events: none` when disabled, and a
  test that counted clicks on `document`.
- **Broke:** the forced clicks fell through to the page behind the
  button, so I filtered the test to count only clicks whose path included
  the button. That made it pass. Code review then found the real bug:
  a disabled button inside a clickable row passed the click to the row,
  which a native disabled `<button>` never does.
- **Why:** I changed the test to fit the behaviour instead of asking
  whether the behaviour was right. The filter defined the bug away.
- **Next time:** when a test fails in a surprising way, write down the
  user-visible scenario before touching the assertion. Test with a
  realistic parent (a clickable row), not an abstract `document`
  listener. Also: an ancestor's capture-phase listener still sees the
  click. A custom element can't stop that; it's documented on `disabled`.

## 2026-10-21 · `sideEffects: false` silently deletes a custom element

- **Tried:** on purpose, setting `"sideEffects": false` on
  `@hostkit-ui/components` and building the React shell for production.
- **Broke:** the bundler dropped `import '@hostkit-ui/components/button.js'`
  as dead code, because nothing used its exports. `customElements.define()`
  never ran, and `<hk-button>` stayed an unknown, unstyled tag. Only the
  production build fails; the dev server doesn't tree-shake.
- **Why:** a side-effect import exists *only* for its side effect.
  `sideEffects: false` tells the bundler that no such file exists.
- **Next time:** list every file that calls `define()` (ADR-0005), and
  test the **production** build of a real consumer, never only the dev
  server. The shopping-shell smoke tests now catch this.
- **Also learned (the open item from ADR-0012):** React 19 sets
  `variant` and `disabled` on `hk-button` as **properties**, not string
  attributes, and re-renders update them. `onClick` works because
  `click` is native. Custom events (`hk-change`) are still unchecked:
  Phase 1, with `hk-checkbox`.

## 2026-10-21 · The first three-engine run failed three tests that Chromium passed

- **Tried:** the existing `hk-button` tests on Firefox and WebKit, for
  the CI gate (#7).
- **Broke, 1 (Firefox):** "a disabled button fires no click" counted a
  click. The forced click at `(1, 1)`, meant as "the padding", landed
  outside the `border-radius` curve, so Firefox gave it to the row
  behind the button. That is correct behaviour; the test point was wrong.
  Chromium hit-tested the corner as the button.
- **Broke, 2 (WebKit, Mac only):** the light-theme test got the dark
  value. With no emulated colour scheme, WebKit follows the machine's
  appearance, and the Mac was in dark mode. Chromium headless is always
  light, which hid the assumption.
- **Broke, 3 (WebKit, Mac only):** Tab skipped `hk-button`. macOS WebKit,
  like Safari, only tabs to buttons when keyboard navigation is on in
  System Settings. Linux CI passes.
- **Why:** a test written against one engine encodes that engine's
  defaults (hit-testing, colour scheme, focus rules) as if they were
  the spec.
- **Next time:** pin every environment input a test depends on (colour
  scheme now starts as `light` in `beforeEach`), click well inside the
  element's shape, and run a new test on all three engines once before
  trusting it (`CI=1 ... test`).
- **Also:** `--browser=webkit` alone fails with "browser.instances ...
  is empty", because local runs only define Chromium. Set `CI=1` too.
- **Also:** Prettier on Markdown would rewrite accepted ADRs (joining
  lines, de-indenting wrapped code spans, escaping a line that starts
  with `2026.`), so Markdown stays out of Prettier for now.

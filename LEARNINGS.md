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

## 2026-10-21 · Vue's custom-element warning doesn't exist in production

- **Tried:** a Playwright test that fails if Vue logs "Failed to resolve
  component: hk-button", run first *without*
  `compilerOptions.isCustomElement`, against the production build like
  every other smoke test.
- **Broke:** the test passed. It should have failed. Vue strips its
  warnings from production builds, so the console was silent either way.
  The built bundle still called `resolveComponent("hk-button")`; it just
  fell back to the tag name without a word.
- **Why:** "test the production build" was the right rule for
  tree-shaking and Lit deduplication, but a warning is a development
  feature. I applied the rule without asking what the test listens for.
- **Next time:** watch a new test fail before trusting it. When the
  signal is a dev-only one (Vue warnings, Lit dev mode), test it where it
  exists: the shopping-list warning test runs on the Vite dev server,
  everything else on `vite preview`.
- **Also learned:** a second Lit only appears with an incompatible major.
  Adding `lit@3.2.1` to the app still ran one copy (it reuses
  `lit-element` 4.2.2); `lit@2.8.0` made the one-copy test fail with
  two of each. And Vue sets `disabled` as a **property**: with
  `:disabled.attr`, `false` becomes `disabled="false"` and the button
  stays disabled, which the reactive-disabled test catches.

## 2026-10-21 · The Changesets dry runs passed for the wrong reason

- **Tried:** ADR-0016's two dry runs (a tokens-only patch, then a
  breaking tokens minor) with both packages at the `0.0.0` bootstrap
  version and components peering on tokens at `^0.1.0`.
- **Broke, 1:** both passed, but meaninglessly. `0.0.0` doesn't satisfy
  `^0.1.0`, so Changesets printed "must depend on the current version"
  and dropped the edge from its dependency graph. Components could never
  be bumped, whatever tokens did. Rerun from a simulated `0.1.0`, the
  real behaviour showed: a tokens patch leaves components alone; a tokens
  minor gives components `0.1.1` with the peer moved to `^0.2.0`.
- **Broke, 2:** ADR-0016's reason for `onlyUpdatePeerDependentsWhenOutOfRange`
  is out of date. In `@changesets/cli` 3 (assemble-release-plan 7) an
  out-of-range peer gives the dependent a *patch*, never a major, with
  or without the option. The option now only stops Changesets rewriting
  the peer range when it's still satisfied. Without it, a tokens patch
  silently changed components' peer to `^0.1.1` without bumping
  components: an unreleased edit to its `package.json`. So the option is
  still worth keeping, for a different reason.
- **Why:** I tested the starting state, not the state the rule is about.
  And the ADR described the tool's behaviour from older docs, not from
  the installed source.
- **Next time:** run a dry run from the state where the rule actually
  applies, and add a control with the setting off: a check that passes
  either way proves nothing. When an ADR depends on a tool's behaviour,
  read that behaviour in the installed version's source.

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

## 2026-10-21 · The tarball gate: what each deliberate break showed

- **Tried:** the tarball smoke tests (#8), then three deliberate breaks:
  removing `cdn` from components' `files`, binding a string to
  `?disabled` in `hk-button`, and pointing an app's copy back at the repo.
- **Broke, 1:** without `cdn` in `files`, every other gate stayed green:
  `publint` passed (no `exports` entry points at `cdn/`), `size` passed
  (it reads `cdn/` from disk, not from the tarball), and the workspace
  share widget passed (it serves `packages/components`). Only the
  tarball job went red: the widget loaded no `button.js`, so `hk-button`
  never upgraded and stayed unstyled.
- **Broke, 2:** the `?disabled=${this.variant}` error passed `tsc`.
  TypeScript sees a tagged template string, not a binding; only
  lit-analyzer (`no-incompatible-type-binding`) reported it. The
  behaviour tests also failed, but only because `'primary'` is truthy.
- **Broke, 3 (a warning, not a failure):** every standalone install
  prints `unmet peer @hostkit-ui/tokens@^0.1.0: found 0.0.0`. The
  bootstrap version doesn't satisfy the peer range (as in the Changesets
  dry runs). pnpm only warns, so the gate doesn't see it; it goes away
  when both packages are at `0.1.0`.
- **Also learned:** pnpm links a `file:` *directory* dependency into
  `.pnpm`, so "is it a symlink into the repo?" alone misses it. The
  check that caught it compares the installed `package.json` with the
  tarball's (the repo's still says `workspace:*`).
- **Why:** a check that reads the working tree can't see what `files`
  leaves out, and a type checker that sees strings can't see templates.
- **Next time:** test packaging from the artifact (the `.tgz`), not the
  directory it came from, and keep lit-analyzer in the gates even when
  `tsc` passes.

## 2026-10-21 · My fix for duplicate CDN definitions made every page slower

- **Tried:** fixing "loading `cdn/button.js` and `cdn/all.js` throws
  `NotSupportedError`" by building the CDN entries together, so the
  bundler moved `hk-button` and Lit into a shared `cdn/chunks/button.js`.
- **Broke:** the test went green, but code review found the cost:
  every entry became a 46-byte stub. A page that loads one component now
  waited for two requests in a row, `cdn/button.js` no longer worked
  when copied on its own, and the unhashed chunk with minified export
  names could be mixed across releases through a version-range URL.
- **Why:** I solved the case in the bug report (two entries on a page)
  and didn't check the common case (one entry on a page) against the
  same fix. The bundler's default chunking decided the design for me.
- **Next time:** when fixing an edge case, list the common case's
  properties first (request count, self-hosting, cache safety) and
  check the fix keeps them. Here `preserveEntrySignatures:
  'allow-extension'` keeps `hk-button` in `cdn/button.js` itself, and
  `all.js` imports it by its public name (ADR-0017).

## 2026-10-21 · Defining `hk-button` after Vue mounts kept the suite green

- **Tried:** checking the README's Vue import-order advice (#13) by
  breaking it on purpose: `createApp(App).mount('#app')` first, then
  `import('@hostkit-ui/components/button.js')`.
- **Broke, 1:** all six shopping-list smoke tests still passed. The app
  starts the archive button *disabled*. Vue set it as an attribute on the
  un-upgraded element, any value of which means disabled, so Lit read
  `true` on upgrade and reflected it back as `disabled=""`. Every later
  toggle went through the property, because by then the element had one.
- **Broke, 2:** with the button starting *enabled* (`:disabled="false"`),
  the real bug showed: Vue set `disabled="false"` on the un-upgraded
  element, Lit upgraded it to `disabled = true`, and the button stayed
  disabled; a click did nothing. Vue patches only on change, so nothing
  corrected it. The same app with the import before `mount()` gave
  `disabled = false` and the click worked.
- **Why:** the bug lives only in the initial render of an un-upgraded
  element, and only for a `false` boolean. A fixture that starts `true`
  can't see it, because Lit's reflection repairs the value.
- **Next time:** for every "must happen before X" rule, break the order
  with the starting state the rule protects (here, a `false` boolean),
  not the app's current one. The smoke suite has no test for this yet;
  it's an open item in the #13 PR.

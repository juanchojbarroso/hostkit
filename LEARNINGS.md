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

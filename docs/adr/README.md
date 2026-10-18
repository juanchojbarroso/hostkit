# Architecture Decision Records

Every non-trivial decision in hostkit is recorded here using
[MADR](https://adr.github.io/madr/). Copy [`template.md`](template.md),
number it sequentially, and never edit an accepted ADR's decision:
supersede it with a new one.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-record-decisions-with-madr.md) | Record decisions with MADR | accepted |
| [0002](0002-pnpm-workspaces-without-turborepo.md) | pnpm workspaces, Turborepo deferred | accepted |
| [0003](0003-hand-written-css-tokens-first.md) | Hand-written CSS tokens first | accepted |
| [0004](0004-pin-node-24-lts.md) | Pin Node 24 LTS | accepted |
| [0005](0005-single-components-package-with-subpath-exports.md) | Single components package, subpath exports | accepted, amended by 0010 |
| [0006](0006-vite-library-build-with-npm-and-cdn-outputs.md) | Vite library build, npm + CDN outputs | accepted |
| [0007](0007-vitest-browser-mode-with-playwright.md) | Vitest browser mode + Playwright | accepted |
| [0008](0008-eslint-prettier-with-lit-rules.md) | ESLint + Prettier + Lit/WC rules | accepted |
| [0009](0009-public-repository-from-the-start.md) | Public repository from the start | accepted |
| [0010](0010-publish-under-the-hostkit-ui-npm-scope.md) | Publish under the `@hostkit-ui` npm scope | accepted |

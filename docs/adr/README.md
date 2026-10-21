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
| [0006](0006-vite-library-build-with-npm-and-cdn-outputs.md) | Vite library build, npm + CDN outputs | accepted, amended by 0017 |
| [0007](0007-vitest-browser-mode-with-playwright.md) | Vitest browser mode + Playwright | accepted |
| [0008](0008-eslint-prettier-with-lit-rules.md) | ESLint + Prettier + Lit/WC rules | accepted |
| [0009](0009-public-repository-from-the-start.md) | Public repository from the start | accepted |
| [0010](0010-publish-under-the-hostkit-ui-npm-scope.md) | Publish under the `@hostkit-ui` npm scope | accepted |
| [0011](0011-legacy-decorators-until-oxc-supports-standard.md) | Legacy decorators until Oxc supports standard | accepted |
| [0012](0012-public-api-contract-and-breaking-change-policy.md) | Public API contract and breaking-change policy | accepted |
| [0013](0013-theme-selection-data-theme-over-media-query.md) | Theme selection: `data-theme` overrides the OS preference | accepted |
| [0014](0014-token-contract-private-primitives-and-one-entry-point.md) | Token contract: private primitives, system-colour fallback, one entry point | accepted |
| [0015](0015-supported-frameworks-browsers-and-lit-dependency.md) | Supported frameworks, browsers and the Lit dependency | accepted |
| [0016](0016-publish-from-ci-with-npm-trusted-publishing.md) | Publish from CI with npm trusted publishing, independent versions | accepted |
| [0017](0017-cdn-entries-share-modules-by-url.md) | CDN entries share modules by URL | accepted |

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

hostkit is a framework-agnostic design system: Lit Web Components, tag
prefix `hk-`, npm scope `@hostkit-ui`. It is a **Breakable Toy** for
growing into a principal engineer, so the learning is the deliverable.
Breaking things on purpose, and writing down why, is part of the job.

The name has two meanings: `:host` is how a component styles itself in
Shadow DOM, and the *host* is whatever app consumes the kit. The kit has
to work in any host.

Scope, milestones and the definition of done live in Juan's Obsidian
note "hostkit - project brief", which is outside the repo. The parts
that shape day-to-day work are summarised below.

## Working agreement

- **Decide together.** Never choose a tool, an API shape or an
  architecture alone. Explain the problem in plain language with an
  example, then present the options, the trade-offs, a recommendation
  and the principle behind it. Juan decides.
- **Record every decision** as an ADR in `docs/adr` (MADR). Copy
  `docs/adr/template.md`, number it sequentially, and add a row to
  `docs/adr/README.md`. Never edit an accepted ADR's decision; write a
  new ADR that supersedes it. Every ADR ends with a `## Lesson` section.
- **Record every failure worth keeping** in `LEARNINGS.md`. Format:
  date · tried · broke · why · next time. Choices go in ADRs; breakages
  go in LEARNINGS.
- Settle a risky toolchain bet with a timeboxed spike on a `spike/*`
  branch before building on it (see ADR-0011).
- Mechanical work inside an agreed decision can go ahead without asking.
- Commits follow Conventional Commits (`.claude/rules/conventional-commits.md`).

## Current state

Phase 0 (the walking skeleton, issue #1) is in progress. Packages:
`@hostkit-ui/tokens`, `@hostkit-ui/components` (only `hk-button`), and
`@hostkit-ui/release-probe` (throwaway, deprecated). Apps:
`apps/share-widget` (plain HTML via the CDN build),
`apps/shopping-shell` (React 19 via the npm build) and
`apps/shopping-list` (Vue 3.5 via the npm build).

Releasing (ADR-0016): tokens and components are public, with
independent versions; components lists tokens as an optional peer
(`^0.1.0`). On every push to `master`, `release.yml` runs
`changesets/action`: while `.changeset/*.md` files exist it opens or
updates a "Version Packages" PR; once that PR is merged (no changesets
left), it runs `changeset publish`, which publishes **every public
package version not yet on npm**, using OIDC trusted publishing. So
never merge a "Version Packages" PR for a package that npm doesn't
trust yet (bootstrap and `npm trust` first, as in #10). Both packages
sit at the `0.0.0` bootstrap version until the first CI release
(`0.1.0`, #11), after which `0.0.0` is deprecated with `npm deprecate`.

Commands (run from the repo root):

- `pnpm build`: every workspace, in dependency order (`pnpm -r build`)
- `pnpm test`: builds everything, then runs every workspace's tests.
  App tests need fresh builds: for one app, run
  `pnpm --filter <app>... build && pnpm --filter <app> test` (the `...`
  includes the packages it depends on)
- `pnpm --filter @hostkit-ui/components test`: component tests (Vitest
  browser mode); one file: `... test src/button.test.ts`; one test:
  `... test -t "disabled"`
- `pnpm --filter @hostkit-ui/components typecheck`
- `pnpm --filter @hostkit-ui/components build`: `dist/` (with types and
  `custom-elements.json`) and `cdn/`; `build:dist` or `build:cdn` for one
- `share-widget` tests: Playwright smoke tests of the CDN build. `HOSTKIT_TOKENS_DIR` / `HOSTKIT_COMPONENTS_DIR`
  serve other copies of the packages (e.g. an unpacked tarball);
  `HOSTKIT_TOKENS_BASE` / `HOSTKIT_COMPONENTS_BASE` point the page at
  other URLs (e.g. jsDelivr). See `apps/share-widget/server.mjs`.
- `shopping-shell` tests: Playwright smoke tests of the React production build
- `shopping-list` tests: Playwright smoke tests of the Vue production build,
  plus one test on the dev server (port 4331), because Vue only logs its
  "Failed to resolve component" warning in development
- `pnpm --filter shopping-list typecheck`: `vue-tsc`, on TypeScript 5.9
  (vue-tsc needs the compiler API, which the TypeScript 7 package lacks)
- `pnpm changeset`: add a changeset (see `.changeset/README.md`)
- `pnpm lint`: ESLint; `pnpm lint:lit`: lit-analyzer on the component
  templates (strict, warnings fail)
- `pnpm format` / `pnpm format:check`: Prettier (Markdown is excluded,
  see `.prettierignore`)
- `pnpm typecheck`: every workspace. Run it after `pnpm build`: the apps
  type-check against `dist/*.d.ts`
- `pnpm size`: gzip budgets per entry (`packages/components/scripts/check-size.mjs`);
  `pnpm publint`: packs each package and lints the tarball. Both need a
  build first
- `pnpm test:tarball` (`scripts/tarball-smoke.mjs`): builds and packs
  tokens and components, copies the three apps to a temp directory
  outside the workspace, installs the tarballs there (`file:*.tgz`; lit,
  react and vue from the registry), fails if any app resolves
  `@hostkit-ui/*` into the repo or to a `package.json` other than the
  tarball's, then runs each app's build, typecheck and Playwright tests.
  The share widget serves the unpacked tarballs. Needs network; prints
  the work directory, which it keeps for debugging. `CI=true` runs all
  three engines
- `pnpm test:registry <versions>` (same script, registry mode, #12): the
  same apps and specs against a **released** version. `<versions>` is
  `0.1.0` (both packages) or `tokens@0.1.0,components@0.2.0` (a package
  left out uses npm `latest`). Waits until npm and jsDelivr serve the
  version (`HOSTKIT_WAIT_MINUTES`, default 15, per file), installs
  `^<version>` from npm into the React and Vue copies, fails unless each
  installed copy is exactly that version with npm's integrity in the
  lockfile, and points the share widget at exact-version jsDelivr URLs
  (local mounts point nowhere, so a fallback 404s). A newer matching
  patch on npm makes it fail, by design

**CI** (`.github/workflows/ci.yml`) runs on every PR and push to
`master`. Job `checks`: lint, format check, lit-analyzer, build (which
generates `custom-elements.json`), typecheck, size, publint. Job `test`:
`pnpm test` with `CI` set, so Vitest and Playwright run Chromium,
Firefox and WebKit (browsers cached). Job `tarball`: `pnpm test:tarball`
on three engines, working in `$RUNNER_TEMP/hostkit-tarball`.
`release.yml` calls `ci.yml` as a reusable workflow (`gates`, which
includes all three jobs) and publishes only after it passes on the same commit.
Keep publishing in `release.yml`: npm trusts that file name (ADR-0016).
After a publish (`changesets/action` output `published == 'true'`), its
`post-publish` job calls `post-publish-smoke.yml` with the tokens and
components versions from `publishedPackages`: `pnpm test:registry` on
three engines, in `$RUNNER_TEMP/hostkit-registry`. If it fails, a
`report` job (the only one with `issues: write`) opens an issue labelled
`bug` with the run URL and the failing stage. That workflow never gets
`id-token: write` and has no publish step, so it is safe to run by hand
for any released version:
`gh workflow run post-publish-smoke.yml -f version=0.1.0`.

Toolchain: Node 24 LTS (`.nvmrc`, with `engine-strict=true` in `.npmrc`,
so other Node versions fail to install) and pnpm 10 (`packageManager`).

## Architecture (as decided, see `docs/adr/README.md`)

**Layout.** pnpm workspaces, no Turborepo yet (ADR-0002).
`packages/*` holds the published libraries and `apps/*` holds the
consumers that prove them:

- `@hostkit-ui/tokens`: hand-written CSS custom properties, usable
  without any components (ADR-0003). Three layers in separate files:
  primitive (`blue-500`) → semantic (`--hk-color-action-primary`, which
  references primitives with `var()`) → component. **Components consume
  semantic tokens only.** Component tokens (`--hk-button-bg`) live inside
  each component, not in this package.
- `@hostkit-ui/components`: one package. `exports` has one subpath per
  component (`./button.js`, …) plus `./all.js` (ADR-0005). `sideEffects`
  must list the files that call `customElements.define()`, or bundlers
  drop them.

**Theming** (ADR-0013). With no attribute set, `prefers-color-scheme`
applies, scoped to `:root:not([data-theme="light"])`.
`data-theme="light|dark"` on the root always wins. The dark values are
declared twice (in the media query and under the attribute selector);
keep each set in one block so they can't drift. Themes are different
token values, never different components.

**Build** (ADR-0006). Vite library mode, two outputs:
- `dist/`: ESM, `preserveModules`, Lit **external**. `exports` points
  here. Types come from `tsc --emitDeclarationOnly`.
- `cdn/`: Lit bundled, minified, one file per entry plus `all.js`. Each
  component's entry contains the component; `all.js` imports the entries,
  and code shared by several components goes to hashed `cdn/chunks/`
  (ADR-0017). A page that loads two entries gets one definition and one
  Lit. It must load from an exact-version jsDelivr/unpkg URL.
Check the `preserveModules` output by hand. Never ship two copies of Lit
to a bundler user.

**Decorators** (ADR-0011). Vite 8's Oxc transformer lowers only legacy
decorators, so the project uses:
- `tsconfig`: `experimentalDecorators: true`, `useDefineForClassFields: false`
- `vite.config`: `oxc: { decorator: { legacy: true } }`

Removing `useDefineForClassFields: false` silently breaks every reactive
property, so a test must assert that a property change re-renders.
lit-analyzer needs TypeScript 5.9; the TypeScript 7 npm package has no
compiler API. Don't write `@property() accessor x` (standard syntax).

**Tests** (ADR-0007). Vitest browser mode with the Playwright provider.
Chromium locally; Chromium, Firefox and WebKit in CI. axe-core runs
inside the component tests. Don't use happy-dom or jsdom. To reproduce
a CI-only failure, set `CI` (it adds the instances) and pick one:
`CI=1 pnpm --filter @hostkit-ui/components test --browser=webkit`. On a
Mac, WebKit follows the OS appearance and skips buttons on Tab unless
keyboard navigation is on in System Settings, so a local WebKit run can
fail where Linux CI passes.

**Lint** (ADR-0008). ESLint (typescript-eslint `strict`, `eslint-plugin-lit`,
`eslint-plugin-wc` best-practice, `eslint-plugin-vue` `flat/essential` for
`.vue` files) + Prettier + lit-analyzer. ESLint rules catch bugs only;
Prettier owns formatting. Both
typescript-eslint and lit-analyzer need TypeScript 5.9 (TypeScript 7 has
no compiler API): the root `typescript ~5.9` serves typescript-eslint's
peer, and root `pnpm.packageExtensions` gives it to lit-analyzer. The
workspaces still compile with TypeScript 7.

## Public API contract (ADR-0012)

Every consumer-facing surface is a contract, and it maps onto the
Custom Elements Manifest (`custom-elements.json`, generated on every
build):

- Events: `CustomEvent`, `hk-` kebab-case names (`hk-change`), with
  `bubbles: true, composed: true`. Set `cancelable` only when there is a
  default action to skip. The element's properties are the source of
  truth; `detail` is only a convenience copy.
- Every primitive property has a kebab-case attribute
  (`helpText` ↔ `help-text`). Booleans and state that CSS uses (`variant`,
  `disabled`, `checked`) reflect. Objects and arrays are property-only.
- Styling hooks: `--hk-<component>-*` custom properties plus a short,
  documented list of `::part()`s. The internal shadow DOM is not API.
- **Breaking** (needs a major) means removing, renaming, or changing the
  type or meaning of any of these: a tag, attribute, property, method,
  event, `detail` field, slot, part, custom property, token, default
  value, reflection, `exports` subpath, supported browser, or minimum
  tested framework version. When in doubt, treat a change as breaking.
- Changesets: every PR that changes a published package includes a
  changeset with a consumer-facing note. During `0.x` (until the M2 MVP)
  a breaking change is a `minor` bump whose note starts with
  `BREAKING:`. Deprecation means a `@deprecated` JSDoc tag, one
  `console.warn` per element type, and a documented replacement. Removal
  comes no earlier than the next major.

## Platform requirements (from the brief)

- No framework dependency in `packages/components`. The same element
  must work **unchanged** in React, Vue and plain HTML. React/Vue wrapper
  packages are out of scope unless interop friction proves they're
  needed, and that finding goes in LEARNINGS.
- Two micro-frontends on one page must be able to run different major
  versions (the custom-element registry clash, milestone M3).
- Out of scope: backend, auth, SSR, i18n, native mobile.

**Definition of done for every component:** API documented (properties,
attributes and which ones reflect, events, slots, parts, custom
properties); a Storybook story plus a usage example in each consumer;
keyboard-operable with visible focus and correct roles; 0 axe
violations; WCAG 2.2 AA contrast in both themes; themed only through
tokens, with no hard-coded colours; behaviour and event tests; under the
gzip size budget (checked in CI); a changeset with the right bump.

## First consumer and milestones

Shopping Notes is the app that proves the kit. Its React shell (Vite)
hosts a Vue micro-frontend loaded at runtime, and a plain-HTML share
widget loads hostkit from the CDN. Data is in `localStorage`. **v0.1
contains only the components the MVP stories need**; everything else
waits until a story asks for it.

| Milestone | Scope |
|---|---|
| M1 Foundation | Monorepo, tokens (light/dark), `hk-button`, `hk-text-field`, `hk-checkbox`; Vite build; used from React **and** Vue; Changesets release from CI. Target Thu 2026-10-22 |
| M2 MVP | The rest of v0.1; Shopping Notes stories 1–8; Storybook deployed; `1.0.0` |
| M3 Platform | Vue runtime micro-frontend; CDN share widget; two majors on one page |
| M4 Breaking change | Expand-and-contract rename (e.g. `variant="danger"` → `tone="critical"`) |
| M5 AI software factory | `AGENTS.md`, manifest fed to an agent, a codemod for the M4 migration |

Open item from ADR-0012: check how React handles custom-element events
and properties in the walking skeleton, and record the result in
`LEARNINGS.md`.

## Reference projects

Read how these solved a problem before solving it yourself. Copy
patterns, not code:
- Red Hat Design System (`@rhds/elements`): token layers, theming,
  framework usage docs, repo structure
- Web Awesome / Shoelace 2.x: component API shape, form-associated
  controls, CDN loading
- Spectrum Web Components: Changesets release flow and coexisting
  versions

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on `juanchojbarroso/hostkit` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles, each label named after its role (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` (created lazily) and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

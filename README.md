# hostkit

A framework-agnostic design system: Web Components built with
[Lit](https://lit.dev), tag prefix `hk-`, published under the
`@hostkit-ui` npm scope. The same element works unchanged in plain HTML,
React and Vue.

The name has two meanings. `:host` is how a component styles itself in
Shadow DOM, and the *host* is whatever app uses the kit. The kit has to
work in any host.

## Why this exists

hostkit is a **Breakable Toy**, a pattern from *Apprenticeship Patterns*
(Dave Hoover & Adewale Oshineye, chapter 5). Production systems punish
failure, but learning depends on failing. This repo is where I break
things on purpose: Web Components across frameworks, two versions of
the library on one page, breaking changes and migrations.

Everything that breaks gets written down in [`LEARNINGS.md`](LEARNINGS.md).

## Packages

| Package | What it is | Docs |
|---|---|---|
| [`@hostkit-ui/components`](https://www.npmjs.com/package/@hostkit-ui/components) | The Web Components (today: `<hk-button>`), for npm and for a CDN | [README](packages/components/README.md) |
| [`@hostkit-ui/tokens`](https://www.npmjs.com/package/@hostkit-ui/tokens) | Design tokens as CSS custom properties, light and dark | [README](packages/tokens/README.md) |

To start using hostkit, read the
[components README](packages/components/README.md). It covers plain HTML,
React 19 and Vue 3.5, theming, the `<hk-button>` API, versioning and the
tested version pairs.

`packages/release-probe` is a throwaway package that rehearsed the release
flow. It is deprecated; don't use it.

## Status: Phase 0

Phase 0 is a walking skeleton: one component, `<hk-button>`, through every
layer (tokens, build, npm, CDN, three hosts, CI and release). **Each app
renders only `<hk-button>` for now.** The first release is `0.1.0` of both
packages. More components arrive only when a Shopping Notes story needs
them.

## Repository layout

```
packages/
  tokens/          @hostkit-ui/tokens: tokens.css and its private layer files
  components/      @hostkit-ui/components: src/, the dist/ (npm) and cdn/ builds
  release-probe/   throwaway package for the release rehearsal (deprecated)
apps/              consumers that prove the packages, each with Playwright smoke tests
  shopping-shell/  React 19 app, hostkit from npm
  shopping-list/   Vue 3.5 app, hostkit from npm
  share-widget/    plain HTML page, hostkit from the CDN build
docs/adr/          Architecture Decision Records
scripts/           repo scripts (tarball smoke tests)
LEARNINGS.md       what broke, and what it taught
```

The apps are parts of Shopping Notes, the app that proves the kit.

## Contributing

You need Node 24 (see `.nvmrc`; other versions fail to install) and
pnpm 10. Run everything from the repo root:

| Command | What it does |
|---|---|
| `pnpm install` | Install every workspace |
| `pnpm build` | Build every package and app |
| `pnpm test` | Component tests (Vitest browser mode) and the app smoke tests (Playwright) |
| `pnpm test:tarball` | Pack the packages and run the app smoke tests against the tarballs |
| `pnpm lint` | ESLint |
| `pnpm lint:lit` | lit-analyzer (template type checks) |
| `pnpm format:check` | Prettier (Markdown is excluded) |
| `pnpm typecheck` | TypeScript in every workspace |
| `pnpm size` | Gzip size budgets (after `pnpm build`) |
| `pnpm publint` | Check the packages' `exports` and files |
| `pnpm changeset` | Add a changeset |

Locally, tests run on Chromium. CI runs them on Chromium, Firefox and
WebKit.

How changes are made:

- **Changesets.** A PR that changes a published package adds a changeset
  (`pnpm changeset`) with the bump type and a note for consumers. During
  `0.x`, a breaking change is a `minor` whose note starts with
  `BREAKING:`. See [`.changeset/README.md`](.changeset/README.md).
- **Decisions** go in [`docs/adr`](docs/adr/README.md), one MADR file per
  decision. An accepted ADR is never edited; a new one supersedes it.
- **Breakages** go in [`LEARNINGS.md`](LEARNINGS.md): date, what was
  tried, what broke, why, and what to do next time.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org).

## License

[MIT](LICENSE)

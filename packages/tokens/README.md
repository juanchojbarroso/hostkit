# @hostkit-ui/tokens

hostkit's design tokens: plain CSS custom properties for colours, with
light and dark themes. Use them with
[`@hostkit-ui/components`](https://www.npmjs.com/package/@hostkit-ui/components),
or on their own in your own CSS. No JavaScript, no build step.

**Status: `0.1.0`, Phase 0.** Five colour tokens, enough for
`<hk-button>`. More arrive as components need them.

## Install

```sh
npm install @hostkit-ui/tokens
```

Then load the stylesheet once per page. From a bundler that handles CSS
imports (Vite, for example):

```ts
import '@hostkit-ui/tokens/tokens.css';
```

Or from a CDN, pinned to an exact version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hostkit-ui/tokens@0.1.0/tokens.css" />
```

## One public file

`@hostkit-ui/tokens/tokens.css` is the only public entry point. It
`@import`s two layer files from `src/`. Those files are internal: their
names and contents can change in any release, and the package's `exports`
doesn't expose them to bundlers. On a CDN, the `@import`s cost a couple of
extra requests, one after the other.

## Tokens

All tokens are set on `:root`.

| Token | Use it for |
|---|---|
| `--hk-color-action-primary` | Background of the main action |
| `--hk-color-action-primary-text` | Text on `--hk-color-action-primary` |
| `--hk-color-action-secondary` | Background of a secondary action |
| `--hk-color-action-secondary-text` | Text on `--hk-color-action-secondary` |
| `--hk-color-focus-ring` | Focus outline |

Use them in your own CSS like any custom property:

```css
.toolbar a:focus-visible {
  outline: 2px solid var(--hk-color-focus-ring);
}
```

A token's **name and meaning** are the contract. Its exact colour can be
refined in any release; a rename or a change of meaning is a breaking
change
([ADR-0012](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0012-public-api-contract-and-breaking-change-policy.md)).

### Primitives are private

The raw palette is also in the file, named `--_hk-*` (for example
`--_hk-blue-700`). The leading underscore means "not API": these can be
renamed or removed in any release, without notice. Use the semantic tokens
above. If you need a colour that none of them covers, open an issue
([ADR-0014](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0014-token-contract-private-primitives-and-one-entry-point.md)).

## Themes

Every token has a light and a dark value. Which one applies:

| On the root element (`<html>`) | Theme |
|---|---|
| no `data-theme` | the user's OS setting (`prefers-color-scheme`) |
| `data-theme="light"` | light, whatever the OS says |
| `data-theme="dark"` | dark, whatever the OS says |

So with no setup a page follows the user's OS, and an app can still force
a theme, for example from a user setting:

```js
document.documentElement.dataset.theme = 'dark';
```

The attribute only works on the root element
([ADR-0013](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0013-theme-selection-data-theme-over-media-query.md)).

## Without this package

hostkit components don't need these tokens to work. Without
`tokens.css`, they fall back to the browser's system colours (`ButtonFace`,
`ButtonText`, `Highlight`): plain, but usable and accessible.

## Compatibility with `@hostkit-ui/components`

The two packages have independent versions. Use a tested pair:

| `@hostkit-ui/tokens` | `@hostkit-ui/components` |
|---|---|
| `0.1.0` | `0.1.0` |

On npm, components declares this package as an optional peer dependency
(`^0.1.0`), so your package manager warns about a mismatch. On a CDN
nothing warns you, so pin both URLs to a pair from this table.

## Versioning

During `0.x`, a breaking change is a minor bump (`0.1.0` → `0.2.0`) whose
changelog note starts with `BREAKING:`, so `^0.1.0` never installs one.
The first release is `0.1.0` because npm's `^0.0.1` matches only `0.0.1`,
which would block every patch. Details:
[@hostkit-ui/components, Versioning](https://github.com/juanchojbarroso/hostkit/tree/master/packages/components#versioning).

## License

[MIT](https://github.com/juanchojbarroso/hostkit/blob/master/packages/tokens/LICENSE)

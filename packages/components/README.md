# @hostkit-ui/components

Web Components for any host: plain HTML, React or Vue. They are built with
[Lit](https://lit.dev), but you don't need to know Lit to use them. Every
element is a native custom element with the `hk-` prefix.

**Status: `0.1.0`, Phase 0.** The package has one component,
[`<hk-button>`](#hk-button). The API can still change during `0.x` (see
[Versioning](#versioning)).

- [Install](#install)
- [Plain HTML, from a CDN](#plain-html-from-a-cdn)
- [React 19](#react-19)
- [Vue 3.5](#vue-35)
- [Theming](#theming)
- [`<hk-button>`](#hk-button)
- [Supported frameworks and browsers](#supported-frameworks-and-browsers)
- [Versioning](#versioning)
- [Compatibility with `@hostkit-ui/tokens`](#compatibility-with-hostkit-uitokens)
- [Size budgets](#size-budgets)
- [Decisions](#decisions)

## Install

```sh
npm install @hostkit-ui/components @hostkit-ui/tokens
```

`@hostkit-ui/tokens` holds the colours and themes. It is an optional peer
dependency: without it the components still work, in the browser's system
colours (see [Theming](#theming)).

`lit` is a regular dependency (`^3.3.0`). If your app already uses Lit
3.3 or later, your package manager installs one copy for both. If your app
pins an older Lit (for example `3.1.x`), you get a second copy of Lit, and
no warning.

Import each component once, at your app's entry point, before you render:

```ts
import '@hostkit-ui/tokens/tokens.css';
import '@hostkit-ui/components/button.js';
```

The second import has a side effect: it registers `<hk-button>` with the
browser. Keep it as a bare import. The package's `sideEffects` field tells
your bundler not to remove it.

What the package exports:

| Import path | What it is |
|---|---|
| `@hostkit-ui/components/button.js` | Registers `<hk-button>`. Exports the `HkButton` class and the `ButtonVariant` type. |
| `@hostkit-ui/components/all.js` | Registers every component (today: only `<hk-button>`). |
| `@hostkit-ui/components/custom-elements.json` | The [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest): every tag, property, attribute, slot and custom property, in JSON. |

The files are ES modules with TypeScript types. Any other path inside the
package is internal.

## Plain HTML, from a CDN

No build tool needed. Load one stylesheet and one module script, each
pinned to an exact version:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Share this list</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hostkit-ui/tokens@0.1.0/tokens.css" />
    <script type="module" src="https://cdn.jsdelivr.net/npm/@hostkit-ui/components@0.1.0/cdn/button.js"></script>
  </head>
  <body>
    <main>
      <h1>Weekend groceries</h1>
      <hk-button id="share">Share list</hk-button>
      <hk-button id="copy" variant="secondary" disabled>Copy link</hk-button>
      <p>Shared <output id="shares">0</output> times</p>
    </main>
    <script type="module">
      const shares = document.querySelector('#shares');
      document.querySelector('#share').addEventListener('click', () => {
        shares.value = String(Number(shares.value) + 1);
      });
    </script>
  </body>
</html>
```

- Use a tested pair of versions (see the
  [compatibility table](#compatibility-with-hostkit-uitokens)).
- `cdn/` files have Lit bundled in, so they need no import map.
  `cdn/button.js` loads `<hk-button>` only; `cdn/all.js` loads every
  component.
- Loading both `cdn/button.js` and `cdn/all.js` of the **same** version on
  one page is safe when both come from the same base URL: the browser loads
  `button.js` once, so you get one `<hk-button>` and one copy of Lit
  ([ADR-0017](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0017-cdn-entries-share-modules-by-url.md)).
  The browser keys modules by URL, so mixing CDNs (jsDelivr and unpkg), or
  `@0.1.0` and `@0.1`, loads `button.js` twice, and the second one throws
  `NotSupportedError`. Every widget on a page should use the same base
  URL.
- Two **different** versions on one page are not supported yet. Both try
  to register `<hk-button>`, and the second one throws
  `NotSupportedError`.
- The same paths work on unpkg:
  `https://unpkg.com/@hostkit-ui/components@0.1.0/cdn/button.js`.
- Don't use the `dist/` files from a CDN: they import `lit` by its bare
  name and are meant for bundlers.

## React 19

React 19 passes props to custom elements as **properties** and listens for
their events, so `<hk-button>` works with no wrapper.

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@hostkit-ui/tokens/tokens.css';
import '@hostkit-ui/components/button.js';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```tsx
// App.tsx
import { useState } from 'react';
import type { ButtonVariant } from '@hostkit-ui/components/button.js';

export function App() {
  const [lists, setLists] = useState(0);
  const [variant, setVariant] = useState<ButtonVariant>('primary');

  return (
    <main>
      <hk-button id="new-list" variant={variant} onClick={() => setLists((n) => n + 1)}>
        New list
      </hk-button>
      <hk-button id="archive" disabled onClick={() => setLists(-1)}>
        Archive
      </hk-button>
      <p>
        Lists created: <output id="lists">{lists}</output>
      </p>
      <button
        type="button"
        id="toggle-variant"
        onClick={() => setVariant((v) => (v === 'primary' ? 'secondary' : 'primary'))}
      >
        Toggle variant
      </button>
    </main>
  );
}
```

`onClick` works because `<hk-button>` fires the native `click` event.

### TypeScript and JSX

hostkit doesn't ship JSX types yet. Without them, TypeScript rejects
`<hk-button>` in TSX. Add this file to your app (for example
`src/hostkit-jsx.d.ts`, inside your `tsconfig` `include`):

```ts
// Lets TSX accept <hk-button>. React 19 passes these props to the element
// as properties; hostkit doesn't ship JSX types yet.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { HkButton } from '@hostkit-ui/components/button.js';

type ElementProps<E extends HTMLElement, P extends keyof E> = DetailedHTMLProps<
  HTMLAttributes<E>,
  E
> &
  Partial<Pick<E, P>>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hk-button': ElementProps<HkButton, 'variant' | 'disabled'>;
    }
  }
}
```

React 18 is not supported. See
[Supported frameworks and browsers](#supported-frameworks-and-browsers).

## Vue 3.5

Two steps: tell Vue that `hk-` tags are custom elements, and register the
components before Vue mounts.

**1. `isCustomElement`.** Without it, Vue tries to resolve `<hk-button>`
as a Vue component first. With `@vitejs/plugin-vue`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // hostkit elements are native custom elements, not Vue
          // components. Without this, Vue tries to resolve them as
          // components first.
          isCustomElement: (tag) => tag.startsWith('hk-'),
        },
      },
    }),
  ],
});
```

**2. Import the component before `createApp().mount()`.** A static
import at the top of `main.ts` does this:

```ts
// main.ts
import { createApp } from 'vue';
import '@hostkit-ui/tokens/tokens.css';
// Define hk-button before Vue mounts. Vue binds `:disabled` as a property
// only if the element already has it (`'disabled' in el`); on an
// un-upgraded element it sets the attribute, and `false` becomes
// disabled="false", which is still disabled.
import '@hostkit-ui/components/button.js';
import App from './App.vue';

createApp(App).mount('#app');
```

Don't load `button.js` lazily after mounting. If you do, a button rendered
with `:disabled="false"` gets the attribute `disabled="false"`, and stays
disabled after it upgrades. (This was checked by hand; the smoke tests
don't cover it yet.)

Then use it like any element:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { ButtonVariant } from '@hostkit-ui/components/button.js';

const items = ref(0);
const variant = ref<ButtonVariant>('primary');
const archiveLocked = ref(true);
</script>

<template>
  <main>
    <hk-button id="add-item" :variant="variant" @click="items++">Add item</hk-button>
    <hk-button id="archive" :disabled="archiveLocked" @click="items = -1">Archive</hk-button>
    <p>
      Items added: <output id="items">{{ items }}</output>
    </p>
  </main>
</template>
```

Bind `:disabled` and `:variant` as shown. Don't add the `.attr` modifier:
as an attribute, `false` becomes `disabled="false"`, which is still
disabled.

### TypeScript (vue-tsc)

hostkit doesn't ship Vue types yet. To type-check bindings on
`<hk-button>`, add this file (for example `src/hostkit-vue.d.ts`):

```ts
// Lets vue-tsc check bindings on <hk-button>. Types only: at runtime,
// isCustomElement (vite.config.ts) keeps Vue from treating it as a
// component, and Vue sets the bindings as element properties.
// hostkit doesn't ship Vue types yet.
import type { DefineComponent } from 'vue';
import type { HkButton } from '@hostkit-ui/components/button.js';

type ElementProps<E extends HTMLElement, P extends keyof E> = Partial<Pick<E, P>>;

declare module 'vue' {
  interface GlobalComponents {
    'hk-button': DefineComponent<ElementProps<HkButton, 'variant' | 'disabled'>>;
  }
}
```

## Theming

Colours come from [`@hostkit-ui/tokens`](https://www.npmjs.com/package/@hostkit-ui/tokens),
a CSS file of custom properties. Load it once per page
(`@hostkit-ui/tokens/tokens.css`). Components read its semantic tokens,
such as `--hk-color-action-primary`.

**Light and dark.** Which theme applies:

| On the root element (`<html>`) | Theme |
|---|---|
| no `data-theme` | the user's OS setting (`prefers-color-scheme`) |
| `data-theme="light"` | light, whatever the OS says |
| `data-theme="dark"` | dark, whatever the OS says |

```html
<html lang="en" data-theme="dark">
```

The attribute must be on the root element. Themes change token values
only; the components are the same.

**Without the tokens.** If you don't load `tokens.css`, components fall back
to the browser's system colours (`ButtonFace`, `ButtonText`, `Highlight`).
They look like native controls: plain, but usable and accessible. If your
buttons look grey and unbranded, check that `tokens.css` loads.

**One component.** Each component has its own custom properties (for
`<hk-button>`, see [its custom properties](#custom-properties)). They win
over the tokens:

```css
hk-button {
  --hk-button-bg: rebeccapurple;
  --hk-button-text: white;
}

hk-button[variant='secondary'] {
  --hk-button-bg: lavender;
  --hk-button-text: black;
}
```

A fixed value like this applies in both themes. Choose colours that keep
enough contrast in light and dark, or set them per theme yourself.

## `<hk-button>`

A button for actions. Put the label in the default slot and listen for
the native `click` event.

```html
<hk-button>Save</hk-button>
<hk-button variant="secondary">Cancel</hk-button>
<hk-button disabled>Archive</hk-button>
```

### Properties and attributes

| Property | Attribute | Type | Default | Reflects |
|---|---|---|---|---|
| `variant` | `variant` | `'primary' \| 'secondary'` | `'primary'` | yes |
| `disabled` | `disabled` | `boolean` | `false` | yes |

"Reflects" means a property change updates the attribute too. So
`el.variant = 'secondary'` adds `variant="secondary"`, and CSS such as
`hk-button[disabled]` keeps working. A new `<hk-button>` gets
`variant="primary"` on its own.

`disabled` is a boolean attribute: it is present or absent. Any value,
even `disabled="false"`, means disabled. To enable the button, remove the
attribute or set the property: `el.disabled = false`.

### Slot

| Slot | Content |
|---|---|
| (default) | The label. |

### Events

| Event | When |
|---|---|
| `click` (native) | The user activates the button: a pointer click, or Enter or Space when it has focus. |

`<hk-button>` has no custom (`hk-*`) events.

**When disabled**, the button:

- fires no `click` on itself, or on bubble-phase listeners of its
  ancestors. This includes clicks on its padding and `el.click()` from a
  script.
- leaves the tab order, and comes back when it is enabled again.
- is drawn at 50% opacity.

**Known limitation:** an ancestor's **capture-phase** listener still sees
the click, because it runs before the button can stop the event:

```js
document.addEventListener('click', (event) => { /* still runs */ }, true);
```

If a capture-phase listener must ignore disabled buttons, check the target:
`event.target.closest('hk-button[disabled]')`.

### Focus

Tab reaches `<hk-button>` like a native button, and keyboard focus shows
an outline in `--hk-button-focus-ring`.

Calling `el.focus()` moves focus to the button unless it is disabled.
It accepts the native `FocusOptions`, such as `el.focus({ preventScroll: true })`.

### Custom properties

| Custom property | Sets | Default |
|---|---|---|
| `--hk-button-bg` | Background colour | `--hk-color-action-primary` (`secondary`: `--hk-color-action-secondary`), else `ButtonFace` |
| `--hk-button-text` | Label colour | `--hk-color-action-primary-text` (`secondary`: `--hk-color-action-secondary-text`), else `ButtonText` |
| `--hk-button-focus-ring` | Focus outline colour | `--hk-color-focus-ring`, else `Highlight` |

Each one applies to whichever variant is shown. To style one variant, use
a selector such as `hk-button[variant='secondary']` (see
[Theming](#theming)).

### Parts and internal markup

`<hk-button>` has no CSS parts (`::part()`). Its shadow DOM is internal and
can change in any release; style it only through the custom properties
above.

### Not a form control yet

`<hk-button>` doesn't submit or reset a `<form>`, and it has no `type`,
`name` or `value`. Handle `click` instead.

### TypeScript

`button.js` adds `'hk-button'` to `HTMLElementTagNameMap`, so
`document.querySelector('hk-button')` returns an `HkButton`.

## Supported frameworks and browsers

| Host | Support |
|---|---|
| Plain HTML | yes (CDN or a bundler) |
| React | **19 and later** |
| Vue | **3.5 and later** |
| Browsers | current Chromium, Firefox and WebKit (Safari) |

Each is tested in CI with a real app and a real browser.

**React 18 is not supported.** React 18 turns every prop on a custom
element into a **string attribute**. For a boolean that breaks:
`<hk-button disabled={false}>` renders `disabled="false"`, and the
attribute's presence means disabled, so the button stays disabled. In the
same way, a future `<hk-checkbox checked={false}>` would stay checked.
React 19 sets properties instead, so `false` means `false`. To use hostkit
with React, upgrade to React 19
([ADR-0015](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0015-supported-frameworks-browsers-and-lit-dependency.md)).

Raising a minimum version is a breaking change (see below).

## Versioning

hostkit follows [semantic versioning](https://semver.org), with one rule
for `0.x`
([ADR-0012](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0012-public-api-contract-and-breaking-change-policy.md)):

- **During `0.x`**, a breaking change is a **minor** bump (`0.1.0` →
  `0.2.0`), and its changelog note starts with `BREAKING:`.
- **From `1.0.0`**, a breaking change is a major bump, as usual.

npm's caret range on a `0.x` version stops before the next minor, so
`^0.1.0` accepts `0.1.1`, `0.1.2` and so on, but not `0.2.0`. With this
rule, `^0.1.0` never installs a breaking change. Read the changelog for
`BREAKING:` before you move to a new minor.

**Breaking** means removing, renaming, or changing the type or meaning of
any of these: a tag, attribute, property, method, event, `detail` field,
slot, CSS part, custom property, token, default value, whether an
attribute reflects, an import path, a supported browser, or a minimum
framework version. The internal shadow DOM is not part of the API.

**Why the first release is `0.1.0`.** For a `0.0.x` version, npm's caret
range matches only that exact version: `^0.0.1` accepts `0.0.1` and
nothing else. Consumers would never get a patch, and "breaking = minor"
would mean nothing. `^0.1.0` accepts every `0.1.x`
([ADR-0016](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0016-publish-from-ci-with-npm-trusted-publishing.md)).
`0.0.0` was a placeholder used to set up publishing; don't install it.

`1.0.0` is planned for hostkit's first full set of components (the MVP,
milestone M2).

**Deprecation.** Before something is removed, it is marked `@deprecated`
(in the types and the manifest), logs one `console.warn` per element type,
and the docs name its replacement. Removal comes no earlier than the next
major.

## Compatibility with `@hostkit-ui/tokens`

The two packages have independent versions. On npm, components declares
tokens as an optional peer dependency, so your package manager warns about
a mismatch. A CDN can't warn you, so use a pair from this table:

| `@hostkit-ui/components` | `@hostkit-ui/tokens` | Peer range |
|---|---|---|
| `0.1.0` | `0.1.0` | `^0.1.0` |

This pair is tested before publishing: the packed packages go through the
React, Vue and plain-HTML smoke tests on Chromium, Firefox and WebKit.

## Size budgets

CI fails if a built entry is over its gzip budget. The budgets are
provisional.

| Entry | Budget (gzip) | Counts |
|---|---|---|
| `button.js` (npm) | 3 kB | the entry and the local modules it imports; not Lit, which your bundler adds once |
| `all.js` (npm) | 3 kB | same |
| `cdn/button.js` | 12 kB | everything, Lit included |
| `cdn/all.js` | 12 kB | everything it loads, Lit included |

1 kB = 1000 bytes.

## Decisions

Every choice above is recorded as an Architecture Decision Record:

- [ADR-0003](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0003-hand-written-css-tokens-first.md): hand-written CSS tokens, three layers
- [ADR-0005](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0005-single-components-package-with-subpath-exports.md): one package, one import path per component
- [ADR-0006](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0006-vite-library-build-with-npm-and-cdn-outputs.md): the npm (`dist/`) and CDN (`cdn/`) builds
- [ADR-0012](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0012-public-api-contract-and-breaking-change-policy.md): the public API and what counts as breaking
- [ADR-0013](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0013-theme-selection-data-theme-over-media-query.md): `data-theme` overrides the OS preference
- [ADR-0014](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0014-token-contract-private-primitives-and-one-entry-point.md): private primitives, system-colour fallback, one tokens entry
- [ADR-0015](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0015-supported-frameworks-browsers-and-lit-dependency.md): React 19+, Vue 3.5+, Lit as a dependency
- [ADR-0016](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0016-publish-from-ci-with-npm-trusted-publishing.md): independent versions, tokens as an optional peer
- [ADR-0017](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/0017-cdn-entries-share-modules-by-url.md): CDN entries share modules by URL

All decisions: [docs/adr](https://github.com/juanchojbarroso/hostkit/blob/master/docs/adr/README.md).

## License

[MIT](https://github.com/juanchojbarroso/hostkit/blob/master/packages/components/LICENSE)

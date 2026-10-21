---
"@hostkit-ui/components": minor
---

First release: framework-agnostic Web Components built with Lit, starting
with `<hk-button>`.

- `<hk-button>`: a button for actions. Put the label in the default slot
  and listen for the native `click` event.
  - `variant` (attribute `variant`, reflects): `"primary"` (default) or
    `"secondary"`.
  - `disabled` (boolean attribute `disabled`, reflects): fires no `click`
    on itself or on bubble-phase listeners of its ancestors. Known
    limitation: capture-phase listeners on ancestors (for example
    `document.addEventListener('click', fn, true)`) still see the click.
  - Custom properties: `--hk-button-bg`, `--hk-button-text` and
    `--hk-button-focus-ring`.
- Theming comes from `@hostkit-ui/tokens`, an optional peer dependency
  (`^0.1.0`). Without it, the button falls back to the browser's system
  colours.
- npm build: ES modules with Lit as a dependency, one subpath per
  component (`@hostkit-ui/components/button.js`) plus `all.js`, with
  TypeScript types and a Custom Elements Manifest
  (`@hostkit-ui/components/custom-elements.json`).
- CDN build: self-contained files with Lit bundled in, under `cdn/`, for
  a plain `<script type="module">` from an exact-version jsDelivr or
  unpkg URL.
- Works unchanged in plain HTML, React 19+ and Vue 3.5+ (in Vue, mark
  `hk-` tags as custom elements with `compilerOptions.isCustomElement`),
  in evergreen Chromium, Firefox and WebKit.

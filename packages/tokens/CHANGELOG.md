# @hostkit-ui/tokens

## 0.1.0

### Minor Changes

- f82c581: First release: hostkit's design tokens as plain CSS custom properties,
  usable without any components.
  
  - Load one file, `@hostkit-ui/tokens/tokens.css` (from npm, or from an
    exact-version jsDelivr/unpkg URL). It is the only public entry point;
    the layer files it imports are private.
  - Public semantic tokens: `--hk-color-action-primary`,
    `--hk-color-action-primary-text`, `--hk-color-action-secondary`,
    `--hk-color-action-secondary-text` and `--hk-color-focus-ring`.
    Primitives are named `--_hk-*` and are not API.
  - Light and dark themes. With no attribute set, the user's
    `prefers-color-scheme` applies; `data-theme="light"` or
    `data-theme="dark"` on the root element always wins.

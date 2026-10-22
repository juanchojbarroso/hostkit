---
'@hostkit-ui/components': patch
---

`hk-button`: `focus()` now focuses the button, as on a native `<button>`, so you can, for example, return focus to it after closing a dialog. On a disabled button it still does nothing. Nothing else changes: the Tab order, pointer clicks, and which of your `hk-button:focus` / `hk-button:focus-visible` rules match (`:focus` yes, `:focus-visible` no) are the same as in `0.1.0`.

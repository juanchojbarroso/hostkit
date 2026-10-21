---
status: accepted
date: 2026-10-21
deciders: Juan Barroso
---

# 0017. CDN entries share modules by URL

Amends ADR-0006: replaces "`cdn/`: one self-contained file per entry".
The rest of ADR-0006 stands.

## Context and problem statement

ADR-0006 built every CDN entry as one self-contained file: `cdn/button.js`
and `cdn/all.js` each held `hk-button` and a full copy of Lit. Two widgets
from different teams end up on the same page: one loads `cdn/button.js`,
the other loads `cdn/all.js`. The second file calls
`customElements.define('hk-button')` again, the browser throws
`NotSupportedError` ("the name "hk-button" has already been used with this
registry"), and that script stops. Every new component file would also add
another full copy of Lit. ADR-0006 already listed that as a cost. What
should a page that loads several hostkit CDN files get?

## Decision drivers

- Loading two hostkit CDN files of the **same version** must never break a
  page
- One copy of Lit per page and version, not one per file
- The integrator's snippet stays one `<script type="module">` per need
- No bare specifiers in `cdn/` (ADR-0006)
- Conflicts between **different** versions must stay visible: that is M3's
  job, not something to hide

## Considered options

1. **Shared modules, entries own their component.** Build all entries
   together. Each component's entry file contains that component; entries
   that need it (`all.js`) import it by relative URL. Code shared by
   several components (later: Lit) goes to hashed files in `cdn/chunks/`.
2. **Shared modules in separate chunks.** Same build, but every entry is
   a stub that re-exports from `cdn/chunks/`.
3. **Guarded define.** Keep self-contained files and skip
   `customElements.define` when the tag already exists.
4. **Document it.** Keep self-contained files and tell integrators to load
   `all.js` or single files, never both.

## Decision outcome

Chosen: **option 1**. Browsers load an ES module once per URL, so a page
that loads `button.js` and `all.js` evaluates `button.js` once: one
definition and one Lit, enforced by the browser, not by documentation.
Unlike option 2, a page that loads one component makes one request, and
`cdn/button.js` still works when copied on its own. Option 3 would make
the second copy lose silently and hide version conflicts. Option 4 leaves
an easy, loud failure in place.

Build settings: `preserveEntrySignatures: 'allow-extension'` lets an
entry hold code other entries import; `chunkFileNames:
'chunks/[name]-[hash].js'`. Entries import each other by their **public**
export names (`export{HkButton}from"./button.js"`), so mixing two
releases through a version-range URL could only break if a public name
changed, which is already a breaking change. Shared chunks get a hash
because their export names are minified.

Today's output (one component, so nothing is shared between components
and `cdn/chunks/` is empty):

| File | Size | Gzip (`gzip -9`) | Contains |
|---|---|---|---|
| `cdn/button.js` | 17.7 kB | 6.63 kB | `hk-button` and Lit; no imports |
| `cdn/all.js` | 34 B | 57 B | `export{HkButton}from"./button.js"` |

### Consequences

- Good: two widgets on one page share one `hk-button` and one Lit
- Good: one request for a single-component page; `cdn/button.js` can
  still be copied and self-hosted alone (until a second component exists)
- Good: the snippet doesn't change
- Bad: once several components share Lit, it moves to a hashed chunk, so
  each entry needs `cdn/chunks/` next to it, and self-hosting means copying
  the whole `cdn/` folder. Document that when it happens
- Bad: chunk names come from the bundler; they are internal, not public
  API (only entry files are), but they ship in the package
- Bad: two **different** versions on one page still clash on the tag name.
  That's intended here and is M3's problem
- Validation: the share widget's `two-widgets.html` smoke test loads both
  entries and asserts no page error, both buttons styled, and one Lit; it
  runs on three engines in CI and in the tarball gate. The size budget
  follows each entry's local imports
- Revisit when: the second component lands (check where Lit goes and how
  many requests a page makes), or M3's version coexistence changes how
  entries are named

## Lesson

Let the platform enforce an invariant instead of documentation: a module is
loaded once per URL, so put the shared thing at one URL.

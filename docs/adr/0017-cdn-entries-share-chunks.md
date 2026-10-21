---
status: accepted
date: 2026-10-21
deciders: Juan Barroso
---

# 0017. CDN entries share chunks instead of being self-contained

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

1. **Shared chunks.** Build all entries together; code they share lives in
   modules they import by relative URL.
2. **Guarded define.** Keep self-contained files and skip
   `customElements.define` when the tag already exists.
3. **Document it.** Keep self-contained files and tell integrators to load
   `all.js` or single files, never both.

## Decision outcome

Chosen: **option 1, shared chunks**. Browsers load an ES module once per
URL, so the second entry reuses the module the first one already loaded:
one definition, one Lit, enforced by the browser, not by documentation.
Option 2 would make the second copy lose silently and hide version
conflicts. Option 3 leaves an easy, loud failure in place.

Today's output (`0.0.0`, one component):

| File | Gzip | Contains |
|---|---|---|
| `cdn/button.js` | 73 B | Re-exports from `./chunks/button.js` |
| `cdn/all.js` | 70 B | Re-exports from `./chunks/button.js` |
| `cdn/chunks/button.js` | 6.64 kB | `hk-button` and Lit |

Chunk file names have no content hash: every CDN URL already contains the
exact package version, so a hash would only make names unstable.

### Consequences

- Good: two widgets on one page share one `hk-button` and one Lit; each new
  component adds its own code only, not another Lit
- Good: the snippet doesn't change
- Bad: one or two extra requests per page (an entry, then its chunk)
- Bad: chunk names come from the bundler; they are internal, not public API
  (only the entry files are), but they are part of the published package
- Bad: two **different** versions on one page still clash on the tag name.
  That's intended here and is M3's problem
- Validation: the share widget's `two-widgets.html` smoke test loads both
  entries and asserts no page error and one Lit; it runs in CI on three
  engines and in the tarball gate. The size budget follows each entry's
  local imports, so it measures the entry plus its chunks
- Revisit when: a page needs to load one entry without its chunk round-trip,
  or M3's version coexistence changes how entries are named

## Lesson

Let the platform enforce an invariant instead of documentation: a module is
loaded once per URL, so put the shared thing at one URL.

---
status: accepted
date: 2026-10-19
deciders: Juan Barroso
---

# 0012. Public API contract and breaking-change policy

## Context and problem statement

hostkit's consumers are other developers on stacks we don't control
(a React shell, a Vue micro-frontend, plain HTML via CDN). Everything they
can observe becomes something they depend on (Hyrum's law), so we must
decide **what the public API is** before the first component ships, and
**what counts as breaking it**. After the first publish, changing either
one is itself a breaking change.

This ADR answers six questions: event naming, event shape,
attributes vs properties, the styling surface, what is breaking, and how
we version and deprecate.

## Decision drivers

- Reversibility: these are one-way doors once published
- Works the same in React, Vue and plain HTML (brief §6.1)
- Consumers must be able to tell from the version number alone whether
  an upgrade is safe
- Machine-readable for agents: the contract must show up in the Custom
  Elements Manifest (M5)

## Considered options and recommendation

### Q1. Event names

1. **Prefixed kebab-case: `hk-change`, `hk-close`** ← recommended
2. Native names: `change`, `close`
3. camelCase: `hkChange`

Prefixing avoids collisions with native events (a re-dispatched `change`
is indistinguishable from the inner `<input>`'s own), and makes our events
obvious in DevTools and in consumer code. Kebab-case works as-is in Vue
(`@hk-change`) and with `addEventListener`. Cost: generic form libraries
that listen for native `change` need an adapter. React's handling of
custom element events must be checked in Phase 1 with `hk-checkbox`
(`hk-change`), since the walking skeleton's `hk-button` uses native
`click` only; record the result in `LEARNINGS.md`.

### Q2. Event shape

1. **`CustomEvent` with `bubbles: true, composed: true`; `cancelable: true`
   only when the event has a default action we will skip; `detail`
   carries a convenience copy of the new state, but the element's
   properties are the source of truth** ← recommended
2. `detail` as the only way to read state
3. Non-composed events (stay inside the shadow root)

Without `composed: true`, an event from inside the shadow root never
reaches the consumer. Keeping state on the element means a consumer can
always read `el.checked` and never has to trust a stale payload.

### Q3. Attributes vs properties

1. **Every public property of a primitive type (string, number, boolean)
   also has an attribute, named in kebab-case (`helpText` ↔
   `help-text`). Booleans and state used in CSS (`variant`, `disabled`,
   `checked`) reflect. Objects and arrays are property-only.**
   ← recommended
2. Properties only
3. Attributes only (everything serialised to strings)

HTML and CDN users can only set attributes. Frameworks can set
properties. Rich data can't go through attributes without serialising it.

### Q4. Styling surface

1. **Two public styling hooks: component custom properties
   (`--hk-<component>-<property>`, e.g. `--hk-button-bg`) and a short,
   documented list of CSS parts (`::part(label)`). The internal shadow DOM
   structure is NOT public API.** ← recommended
2. Custom properties only
3. Parts on every internal element

Custom properties cross the shadow boundary and fit the token layers
(ADR-0003). A few parts cover the cases tokens can't. Exposing every
element as a part would freeze the internal markup forever.

### Q5. What counts as breaking (requires a major)

Recommended definition. **Breaking** means removing or renaming, or
changing the type or meaning of, any of these:

- a tag name, attribute, property, method, event, `detail` field, slot,
  CSS part, CSS custom property, or token (`--hk-*`)
- a default value
- whether an attribute reflects
- an import path (`exports` subpath)
- supported browsers or the minimum framework version we test against

**Not breaking:** additions (new components, optional properties, events,
parts, tokens); internal shadow DOM structure; bug fixes that bring
behaviour in line with the documented contract; visual refinements
within the existing token values.

Grey zone, decided case by case and written into the changeset: a visual
change large enough to break consumers' layouts (size, spacing). When in
doubt, treat it as breaking.

### Q6. Versioning and deprecation

1. **Semver via Changesets. Every PR that changes a published package
   includes a changeset with the bump type and a consumer-facing note.
   During `0.x` (until the M2 MVP), a breaking change is a `minor` bump
   whose note starts with `BREAKING:`; `1.0.0` ships with the MVP.
   Deprecation: mark it with `@deprecated` in JSDoc (it then shows in the
   manifest) and a one-time `console.warn` per element type, document the
   replacement, and remove it no earlier than the next major.**
   ← recommended
2. Start at `1.0.0` now
3. semantic-release driven by commit messages

Changesets puts the bump decision in the PR, made by the author on
purpose, and it's what Spectrum Web Components uses. semantic-release
derives the version from commit messages, which
suits a single app better than a library where the consumer note matters.
`0.x` signals honestly that the API is still moving.

## Decision outcome

Chosen: **the recommended option for all six questions** (accepted 2026-10-19):

1. Events are `hk-*`, kebab-case.
2. Events are `CustomEvent`s with `bubbles` and `composed`; state lives on the element.
3. Primitive properties have kebab-case attributes; booleans and CSS-relevant state reflect; objects and arrays are property-only.
4. Styling goes through `--hk-<component>-*` custom properties and a short list of documented parts; internal shadow DOM is not API.
5. "Breaking" means the list in Q5.
6. Semver via Changesets, `0.x` until the M2 MVP, deprecate before removing.

### Consequences

- Good: every consumer-facing surface is named before anything ships;
  "is this breaking?" has a written answer
- Good: the contract maps one-to-one onto the Custom Elements Manifest,
  so agents (M5) and docs read the same thing
- Bad: more API surface to maintain per component (attributes plus
  properties, reflection)
- Bad: prefixed events need adapters for generic form libraries
- Revisit when: React or Vue interop in the walking skeleton contradicts
  Q1–Q3, or `1.0.0` ships (re-check the 0.x rule)

## Lesson

Decide what your public API is before your users decide it for you. With
enough consumers, every observable behaviour is a contract. The only
choice is whether you write it down first.

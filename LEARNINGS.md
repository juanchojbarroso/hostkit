# Learnings

Things that **broke**, and what they taught. (Things we *chose* live in
[`docs/adr`](docs/adr/README.md).)

Format: date · what I tried · what broke · why · what I'd do next time.

## 2026-10-18 · Name collisions, twice

- **Tried:** `basket-ui` (npm package), then the `@hostkit` npm org.
- **Broke:** both were already taken. I found out after choosing the name
  and writing it into ADR-0005.
- **Why:** I checked availability after deciding, not before, and checked
  only one namespace (the package, not the org).
- **Next time:** check every namespace first (npm org via
  `registry.npmjs.org/-/org/<name>/package`, npm package, GitHub), then
  reserve it immediately. Keep the product name separate from the
  distribution namespace, so a collision changes one line, not the design.
  See ADR-0010.

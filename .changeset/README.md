# Changesets

Every PR that changes a published package adds a changeset
(`pnpm changeset`) with the bump type and a consumer-facing note.
During `0.x`, a breaking change is a `minor` bump whose note starts
with `BREAKING:` (ADR-0012). Versions are independent (ADR-0016).

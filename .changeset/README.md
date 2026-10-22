# Changesets

Every PR that changes a published package adds a changeset
(`pnpm changeset`) with the bump type and a consumer-facing note.
During `0.x`, a breaking change is a `minor` bump whose note starts
with `BREAKING:` (ADR-0012). Versions are independent (ADR-0016).

Don't edit a published package's `version` in `package.json` by hand.
`changeset publish` releases any version npm doesn't have yet, so a
hand-edited version would ship on merge with no changelog entry or
consumer note. CI's `versions` job fails such a PR (#29). Revert the
version and run `pnpm changeset`; the "Version Packages" PR
(`changeset-release/master`) then bumps the versions from the
changesets, and it is the only PR allowed to change them.

// Version-bump guard (issue #29). `changeset publish` publishes every
// package.json version that npm doesn't have yet, so a PR that edits
// "version" by hand would release on merge with no changeset, changelog or
// consumer note (ADR-0012, ADR-0016). This fails such a PR.
//
// Compares each published package's `version` between the PR's base commit
// and the working tree (the PR's head, or GitHub's merge commit). Only
// `version` counts: scripts, dependencies and other fields may change. The
// Version Packages PR (head branch changeset-release/master in this repo,
// not a fork) is allowed to change versions.
//
// Run from the repo root, with these environment variables:
//   BASE_SHA   the PR's base commit (must be fetched)
//   HEAD_REF   the PR's head branch name
//   FROM_FORK  "true" when the head branch lives in another repository
// Exit code 0 passes, 1 fails the check, 2 means it couldn't run.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// The packages `changeset publish` releases (issue #29).
const PUBLISHED = ['packages/tokens/package.json', 'packages/components/package.json'];

const VERSION_PACKAGES_BRANCH = 'changeset-release/master';

const README = 'https://github.com/juanchojbarroso/hostkit/blob/master/.changeset/README.md';

/**
 * @param {object} input
 * @param {{ path: string, base: { name: string, version: string }, head: { name: string, version: string } }[]} input.packages
 * @param {{ headRef: string, fromFork: boolean }} input.pullRequest
 * @returns {{ ok: boolean, message: string }}
 */
export function checkVersionBumps({ packages, pullRequest }) {
  if (pullRequest.headRef === VERSION_PACKAGES_BRANCH && !pullRequest.fromFork) {
    return { ok: true, message: 'The Version Packages PR may change versions.' };
  }
  const changes = packages
    .filter(({ base, head }) => base.version !== head.version)
    .map(({ path, base, head }) => `  ${head.name}: ${base.version} → ${head.version} (${path})`);
  if (changes.length === 0) {
    return { ok: true, message: 'No published package version changed.' };
  }
  return {
    ok: false,
    message: [
      'This PR changes the version of a published package:',
      ...changes,
      '',
      'Merging it would publish that version with no changeset, changelog or consumer note.',
      'Revert the version and run `pnpm changeset` instead: the Version Packages PR bumps',
      `versions from the changesets. See ${README}`,
    ].join('\n'),
  };
}

function main() {
  const { BASE_SHA, HEAD_REF, FROM_FORK } = process.env;
  if (!BASE_SHA || HEAD_REF === undefined || !['true', 'false'].includes(FROM_FORK ?? '')) {
    console.error('Set BASE_SHA, HEAD_REF and FROM_FORK ("true" or "false").');
    return 2;
  }
  const packages = PUBLISHED.map((path) => ({
    path,
    base: JSON.parse(execFileSync('git', ['show', `${BASE_SHA}:${path}`], { encoding: 'utf8' })),
    head: JSON.parse(readFileSync(path, 'utf8')),
  }));
  const result = checkVersionBumps({
    packages,
    pullRequest: { headRef: HEAD_REF, fromFork: FROM_FORK === 'true' },
  });
  if (result.ok) {
    console.log(result.message);
    return 0;
  }
  console.error(result.message);
  // On GitHub, also an error annotation on the PR's checks page.
  if (process.env.GITHUB_ACTIONS) {
    console.error(
      `::error title=Version changed without a changeset::${result.message.replaceAll('\n', '%0A')}`,
    );
  }
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}

// Tests for check-version-bumps.mjs (issue #29). Run: pnpm test:scripts
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkVersionBumps } from './check-version-bumps.mjs';

const script = fileURLToPath(new URL('./check-version-bumps.mjs', import.meta.url));

// Fixture package.json pairs, as they'd be on the PR's base and head.
const tokens = (version, extra = {}) => ({
  name: '@hostkit-ui/tokens',
  version,
  ...extra,
});

const pr = (base, head, pullRequest = { headRef: 'feat/x', fromFork: false }) =>
  checkVersionBumps({
    packages: [{ path: 'packages/tokens/package.json', base, head }],
    pullRequest,
  });

test('passes when no published version changes', () => {
  const result = pr(tokens('0.1.0'), tokens('0.1.0'));
  assert.equal(result.ok, true);
});

test('fails when a PR edits a published version by hand', () => {
  const result = pr(tokens('0.1.0'), tokens('0.1.2'));
  assert.equal(result.ok, false);
  assert.match(result.message, /@hostkit-ui\/tokens: 0\.1\.0 → 0\.1\.2/);
  assert.match(result.message, /pnpm changeset/);
  assert.match(result.message, /\.changeset\/README\.md/);
});

test('passes when a PR changes other package.json fields', () => {
  const result = pr(
    tokens('0.1.0', { scripts: { build: 'a' }, dependencies: { lit: '^3.0.0' } }),
    tokens('0.1.0', { scripts: { build: 'b' }, dependencies: { lit: '^3.3.0' } }),
  );
  assert.equal(result.ok, true);
});

test('allows the Version Packages PR to change versions', () => {
  const result = pr(tokens('0.1.0'), tokens('0.2.0'), {
    headRef: 'changeset-release/master',
    fromFork: false,
  });
  assert.equal(result.ok, true);
});

test("doesn't exempt a fork's branch named changeset-release/master", () => {
  const result = pr(tokens('0.1.0'), tokens('0.2.0'), {
    headRef: 'changeset-release/master',
    fromFork: true,
  });
  assert.equal(result.ok, false);
});

// The command CI runs: a throwaway git repo stands in for the PR. Its
// first commit is the base; the working tree is the head.
function runInRepo(editHead, env = {}) {
  const repo = mkdtempSync(join(tmpdir(), 'hostkit-version-bumps-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  const write = (path, data) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), typeof data === 'string' ? data : JSON.stringify(data));
  };
  try {
    git('init', '--quiet');
    write('packages/tokens/package.json', tokens('0.1.0'));
    write('packages/components/package.json', {
      name: '@hostkit-ui/components',
      version: '0.1.0',
    });
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--quiet', '-m', 'base');
    const base = git('rev-parse', 'HEAD').toString().trim();
    editHead(write);
    return spawnSync(process.execPath, [script], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, BASE_SHA: base, HEAD_REF: 'feat/x', FROM_FORK: 'false', ...env },
    });
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

test('the command passes a PR that only adds a changeset', () => {
  const run = runInRepo((write) =>
    write('.changeset/brave-cats.md', '---\n"@hostkit-ui/tokens": patch\n---\n\nFix.\n'),
  );
  assert.equal(run.status, 0, run.stderr);
});

test('the command fails a PR that edits a version by hand', () => {
  const run = runInRepo((write) =>
    write('packages/components/package.json', { name: '@hostkit-ui/components', version: '0.1.2' }),
  );
  assert.equal(run.status, 1);
  assert.match(run.stderr, /@hostkit-ui\/components: 0\.1\.0 → 0\.1\.2/);
});

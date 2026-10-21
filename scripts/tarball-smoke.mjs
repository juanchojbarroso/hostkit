// Tarball smoke tests (issue #8). Proves the packages work as npm will
// ship them, before anything is published:
//
//   1. builds and packs @hostkit-ui/tokens and @hostkit-ui/components
//   2. copies the three consumer apps outside the workspace
//   3. points their @hostkit-ui/* dependencies at the tarballs and installs
//      them standalone, so lit, react and vue come from the registry
//   4. checks that no app resolves hostkit through a workspace link
//   5. builds and type-checks each app and runs its own Playwright tests;
//      the share widget serves the CDN files from the unpacked tarballs
//
// Run from anywhere: `pnpm test:tarball`. With CI set, Playwright runs
// Chromium, Firefox and WebKit (ADR-0007), as in the inner loop.
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const packages = { tokens: 'packages/tokens', components: 'packages/components' };
const apps = ['share-widget', 'shopping-shell', 'shopping-list'];
const browsers = process.env.CI ? ['chromium', 'firefox', 'webkit'] : ['chromium'];

// CI gets a fixed directory, so the workflow can upload test results from
// it. Locally, a fresh temporary directory per run.
const work = process.env.RUNNER_TEMP
  ? join(await realpath(process.env.RUNNER_TEMP), 'hostkit-tarball')
  : await realpath(await mkdtemp(join(tmpdir(), 'hostkit-tarball-')));

const inside = (path, dir) => path === dir || path.startsWith(dir + sep);

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}${options.cwd ? `  (in ${options.cwd})` : ''}`);
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status ?? result.signal}`);
  }
}

function fail(message) {
  throw new Error(`Workspace-link check failed: ${message}`);
}

if (inside(work, repo)) fail(`the work directory ${work} is inside the repo`);
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
console.log(`Work directory: ${work}`);

// 1. Build and pack. pnpm pack rewrites workspace:* the way publish does.
run('pnpm', ['--filter', '@hostkit-ui/components...', 'build'], { cwd: repo });
const tarballs = {};
const unpacked = {};
for (const [name, dir] of Object.entries(packages)) {
  const out = join(work, 'tarballs', name);
  await mkdir(out, { recursive: true });
  run('pnpm', ['pack', '--pack-destination', out], { cwd: join(repo, dir) });
  const [file, ...extra] = (await readdir(out)).filter((f) => f.endsWith('.tgz'));
  if (!file || extra.length) throw new Error(`expected one tarball in ${out}`);
  tarballs[name] = join(out, file);
  unpacked[name] = join(work, 'unpacked', name);
  await mkdir(unpacked[name], { recursive: true });
  run('tar', ['-xzf', tarballs[name], '-C', unpacked[name]]);
  // npm tarballs keep everything under package/.
  unpacked[name] = join(unpacked[name], 'package');
}

// 2 and 3. Copy each app and install it on its own.
const skip = new Set(['node_modules', 'dist', 'test-results', 'playwright-report']);
for (const app of apps) {
  const dest = join(work, 'apps', app);
  await cp(join(repo, 'apps', app), dest, {
    recursive: true,
    filter: (source) => !skip.has(source.split(sep).at(-1)),
  });
  const manifestPath = join(dest, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const field of ['dependencies', 'devDependencies']) {
    for (const dep of Object.keys(manifest[field] ?? {})) {
      const name = dep.replace('@hostkit-ui/', '');
      if (dep.startsWith('@hostkit-ui/')) {
        if (!tarballs[name]) throw new Error(`${app} depends on ${dep}, which is not packed`);
        manifest[field][dep] = `file:${tarballs[name]}`;
      }
    }
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  // No lockfile exists out here: resolve fresh, as a new consumer would.
  run('pnpm', ['install', '--no-frozen-lockfile'], { cwd: dest });
}

// 4. Verify, don't assume: each @hostkit-ui package must be the tarball's
// copy inside the app, and Lit must come from the app's own node_modules.
for (const app of apps) {
  const dest = join(work, 'apps', app);
  console.log(`\n${app}:`);
  for (const name of Object.keys(packages)) {
    const real = await realpath(join(dest, 'node_modules', '@hostkit-ui', name)).catch(() =>
      fail(`${app} has no node_modules/@hostkit-ui/${name}`),
    );
    if (inside(real, repo)) fail(`${app} resolves @hostkit-ui/${name} into the repo: ${real}`);
    if (!inside(real, dest)) fail(`${app} resolves @hostkit-ui/${name} outside its copy: ${real}`);
    const installed = await readFile(join(real, 'package.json'), 'utf8');
    const packed = await readFile(join(unpacked[name], 'package.json'), 'utf8');
    if (installed !== packed) fail(`${app}'s @hostkit-ui/${name} is not the packed package.json`);
    if (installed.includes('workspace:'))
      fail(`${app}'s @hostkit-ui/${name} has workspace: ranges`);
    console.log(`  @hostkit-ui/${name} -> ${relative(dest, real)} (package.json matches tarball)`);
  }
  const components = await realpath(join(dest, 'node_modules', '@hostkit-ui', 'components'));
  const lit = createRequire(join(components, 'package.json')).resolve('lit');
  if (!inside(lit, join(dest, 'node_modules')))
    fail(`${app} resolves lit outside its copy: ${lit}`);
  const lits = (await readdir(join(dest, 'node_modules', '.pnpm'))).filter((d) =>
    /^lit@\d/.test(d),
  );
  console.log(`  lit -> ${relative(dest, lit)}; installed: ${lits.join(', ')}`);
}

// 5. The apps' own checks and Playwright tests; only the package source
// changed. Playwright downloads browsers only if this version lacks them.
// The share widget has no build: its server serves the unpacked tarballs.
const env = {
  ...process.env,
  HOSTKIT_TOKENS_DIR: unpacked.tokens,
  HOSTKIT_COMPONENTS_DIR: unpacked.components,
};
for (const app of apps) {
  const dest = join(work, 'apps', app);
  const manifest = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
  run('pnpm', ['exec', 'playwright', 'install', ...browsers], { cwd: dest });
  if (manifest.scripts.build) run('pnpm', ['run', 'build'], { cwd: dest });
  run('pnpm', ['run', 'typecheck'], { cwd: dest });
  run('pnpm', ['exec', 'playwright', 'test'], { cwd: dest, env });
}

console.log(`\nTarball smoke tests passed. Work directory: ${work}`);

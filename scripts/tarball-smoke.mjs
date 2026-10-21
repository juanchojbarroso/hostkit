// Package smoke tests: the three consumer apps against hostkit as a
// consumer gets it, outside the workspace. Two package sources:
//
// Tarball mode (issue #8, `pnpm test:tarball`), before anything is published:
//   1. builds and packs @hostkit-ui/tokens and @hostkit-ui/components
//   2. copies the three consumer apps outside the workspace
//   3. points their @hostkit-ui/* dependencies at the tarballs and installs
//      them standalone, so lit, react and vue come from the registry
//   4. checks that no app resolves hostkit through a workspace link
//   5. builds and type-checks each app and runs its own Playwright tests;
//      the share widget serves the CDN files from the unpacked tarballs
//
// Registry mode (issue #12, `pnpm test:registry <versions>`), after a publish:
//   1. waits until npm and jsDelivr serve the requested versions
//   2. and 3. as above, but the apps depend on `^<version>` from npm
//   4. also checks each installed copy is the requested version, with the
//      integrity npm reports for it
//   5. as above; the share widget loads exact-version jsDelivr URLs
//
// <versions> is one version for both packages (`0.1.0`) or a list
// (`tokens@0.1.0,components@0.2.0`); a package left out uses npm's
// `latest`. HOSTKIT_WAIT_MINUTES bounds each wait (default 15).
//
// Run from anywhere. With CI set, Playwright runs Chromium, Firefox and
// WebKit (ADR-0007), as in the inner loop. On GitHub Actions the script
// writes the failing stage to the step output `failed-stage`.
import { spawnSync } from 'node:child_process';
import {
  appendFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repo = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const packages = { tokens: 'packages/tokens', components: 'packages/components' };
const apps = ['share-widget', 'shopping-shell', 'shopping-list'];
const browsers = process.env.CI ? ['chromium', 'firefox', 'webkit'] : ['chromium'];
// The files the share widget pages load (index.html, two-widgets.html).
const cdnFiles = { tokens: ['tokens.css'], components: ['cdn/button.js', 'cdn/all.js'] };
const waitMinutes = Number(process.env.HOSTKIT_WAIT_MINUTES ?? 15);
const semver = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const { values: options } = parseArgs({ options: { registry: { type: 'string' } } });
const registry = options.registry !== undefined;
const mode = registry ? 'registry' : 'tarball';

// What the script is doing, so a failure names its app and step.
let stage = 'setup';

const inside = (path, dir) => path === dir || path.startsWith(dir + sep);

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}${options.cwd ? `  (in ${options.cwd})` : ''}`);
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw new Error(`${command} could not start: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status ?? result.signal}`);
  }
}

function fail(message) {
  throw new Error(`Workspace-link check failed: ${message}`);
}

// Calls attempt() until it returns a value other than undefined, with a
// growing pause, for at most HOSTKIT_WAIT_MINUTES. A brand-new version can
// take minutes to reach the npm metadata and jsDelivr caches.
async function retry(what, attempt) {
  const deadline = Date.now() + waitMinutes * 60_000;
  for (let pause = 5_000; ; pause = Math.min(pause * 2, 60_000)) {
    const result = await attempt();
    if (result !== undefined) return result;
    if (Date.now() + pause > deadline) {
      throw new Error(`${what}: gave up after ${waitMinutes} minutes`);
    }
    console.log(`  ${what}: not yet, retrying in ${pause / 1000}s`);
    await sleep(pause);
  }
}

// npm's metadata for one version, or undefined while npm doesn't have it.
function npmView(spec) {
  const result = spawnSync('npm', ['view', spec, 'version', 'dist.integrity', '--json'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return undefined;
  const view = JSON.parse(result.stdout);
  return view.version ? { version: view.version, integrity: view['dist.integrity'] } : undefined;
}

// Reads `0.1.0` or `tokens@0.1.0,components@0.2.0` into { tokens, components };
// a package left out gets npm's latest.
async function requestedVersions(spec) {
  const versions = {};
  if (semver.test(spec)) {
    for (const name of Object.keys(packages)) versions[name] = spec;
  } else {
    for (const part of spec.split(',').filter(Boolean)) {
      const [name, version, ...rest] = part.trim().split('@');
      if (!(name in packages) || !semver.test(version ?? '') || rest.length) {
        throw new Error(`--registry: expected X.Y.Z or tokens@X.Y.Z,components@X.Y.Z, got ${spec}`);
      }
      versions[name] = version;
    }
  }
  for (const name of Object.keys(packages)) {
    if (versions[name]) continue;
    const latest = npmView(`@hostkit-ui/${name}@latest`);
    if (!latest) throw new Error(`npm has no latest version of @hostkit-ui/${name}`);
    versions[name] = latest.version;
  }
  return versions;
}

const cdnBase = (name, version) => `https://cdn.jsdelivr.net/npm/@hostkit-ui/${name}@${version}`;

async function cdnAnswers(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return response.ok ? true : undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  // GitHub Actions gets a fixed directory, so the workflow can upload test
  // results from it; the script owns it and empties it first. Anywhere
  // else, a fresh temporary directory per run, never deleted for you.
  const actions = process.env.GITHUB_ACTIONS === 'true' && process.env.RUNNER_TEMP;
  const work = actions
    ? join(await realpath(process.env.RUNNER_TEMP), `hostkit-${mode}`)
    : await realpath(await mkdtemp(join(tmpdir(), `hostkit-${mode}-`)));

  if (inside(work, repo) || inside(repo, work))
    fail(`the work directory ${work} overlaps the repo`);
  if (actions) await rm(work, { recursive: true, force: true });
  await mkdir(work, { recursive: true });
  console.log(`Mode: ${mode}. Work directory: ${work}`);

  // What each app's @hostkit-ui/* dependency becomes, and what the
  // installed copy must match.
  const specs = {};
  const expected = {};
  let env;

  if (registry) {
    // 1. Wait for npm, then for jsDelivr.
    stage = 'resolve versions';
    const versions = await requestedVersions(options.registry);
    for (const [name, version] of Object.entries(versions)) {
      stage = `wait for npm: @hostkit-ui/${name}@${version}`;
      const view = await retry(stage, () => npmView(`@hostkit-ui/${name}@${version}`));
      if (view.version !== version) {
        throw new Error(`npm answered @hostkit-ui/${name}@${view.version}, not ${version}`);
      }
      specs[name] = `^${version}`;
      expected[name] = view;
      console.log(`npm: @hostkit-ui/${name}@${version} (${view.integrity})`);
    }
    for (const [name, files] of Object.entries(cdnFiles)) {
      for (const file of files) {
        const url = `${cdnBase(name, versions[name])}/${file}`;
        stage = `wait for jsDelivr: ${url}`;
        await retry(stage, () => cdnAnswers(url));
        console.log(`jsDelivr: ${url}`);
      }
    }
    // The page points at jsDelivr; the local mounts point nowhere, so a
    // fallback to /vendor would 404 instead of passing on local files.
    const nowhere = join(work, 'no-local-copy');
    env = {
      ...process.env,
      HOSTKIT_TOKENS_BASE: cdnBase('tokens', versions.tokens),
      HOSTKIT_COMPONENTS_BASE: cdnBase('components', versions.components),
      HOSTKIT_TOKENS_DIR: nowhere,
      HOSTKIT_COMPONENTS_DIR: nowhere,
    };
  } else {
    // 1. Build and pack. pnpm pack rewrites workspace:* the way publish does.
    stage = 'build and pack';
    run('pnpm', ['--filter', '@hostkit-ui/components...', 'build'], { cwd: repo });
    const unpacked = {};
    for (const [name, dir] of Object.entries(packages)) {
      const out = join(work, 'tarballs', name);
      await mkdir(out, { recursive: true });
      run('pnpm', ['pack', '--pack-destination', out], { cwd: join(repo, dir) });
      const [file, ...extra] = (await readdir(out)).filter((f) => f.endsWith('.tgz'));
      if (!file || extra.length) throw new Error(`expected one tarball in ${out}`);
      specs[name] = `file:${join(out, file)}`;
      unpacked[name] = join(work, 'unpacked', name);
      await mkdir(unpacked[name], { recursive: true });
      run('tar', ['-xzf', join(out, file), '-C', unpacked[name]]);
      // npm tarballs keep everything under package/.
      unpacked[name] = join(unpacked[name], 'package');
      expected[name] = { manifest: await readFile(join(unpacked[name], 'package.json'), 'utf8') };
      if (expected[name].manifest.includes('workspace:')) {
        throw new Error(`the @hostkit-ui/${name} tarball still has workspace: ranges`);
      }
    }
    env = {
      ...process.env,
      HOSTKIT_TOKENS_DIR: unpacked.tokens,
      HOSTKIT_COMPONENTS_DIR: unpacked.components,
    };
  }

  // 2 and 3. Copy each app and install it on its own.
  const skip = new Set(['node_modules', 'dist', 'test-results', 'playwright-report']);
  for (const app of apps) {
    stage = `install ${app}`;
    const dest = join(work, 'apps', app);
    await cp(join(repo, 'apps', app), dest, {
      recursive: true,
      filter: (source) => !skip.has(source.split(sep).at(-1)),
    });
    const manifestPath = join(dest, 'package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    for (const field of ['dependencies', 'devDependencies']) {
      for (const dep of Object.keys(manifest[field] ?? {})) {
        if (!dep.startsWith('@hostkit-ui/')) continue;
        const spec = specs[dep.slice('@hostkit-ui/'.length)];
        if (!spec) throw new Error(`${app} depends on ${dep}, which this run doesn't provide`);
        manifest[field][dep] = spec;
      }
    }
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    // No lockfile exists out here: resolve fresh, as a new consumer would.
    // npm's metadata can still lag behind `npm view` right after a publish.
    const install = () => run('pnpm', ['install', '--no-frozen-lockfile'], { cwd: dest });
    if (!registry) install();
    else {
      await retry(stage, () => {
        try {
          install();
          return true;
        } catch (error) {
          console.log(`  ${error.message}`);
          return undefined;
        }
      });
    }
  }

  // 4. Verify, don't assume: each @hostkit-ui package must be the expected
  // copy inside the app, and Lit must come from the app's own node_modules.
  for (const app of apps) {
    stage = `workspace-link check ${app}`;
    const dest = join(work, 'apps', app);
    const lockfile = registry ? await readFile(join(dest, 'pnpm-lock.yaml'), 'utf8') : '';
    console.log(`\n${app}:`);
    for (const name of Object.keys(packages)) {
      const real = await realpath(join(dest, 'node_modules', '@hostkit-ui', name)).catch(() =>
        fail(`${app} has no node_modules/@hostkit-ui/${name}`),
      );
      if (inside(real, repo)) fail(`${app} resolves @hostkit-ui/${name} into the repo: ${real}`);
      if (!inside(real, dest))
        fail(`${app} resolves @hostkit-ui/${name} outside its copy: ${real}`);
      const installed = await readFile(join(real, 'package.json'), 'utf8');
      if (registry) {
        // `^x.y.z` takes a newer x.y patch if one exists; this run tests
        // the exact version it was asked for.
        const { version, integrity } = expected[name];
        const got = JSON.parse(installed).version;
        if (got !== version) {
          fail(`${app} installed @hostkit-ui/${name}@${got}, not ${version} (a newer match?)`);
        }
        // pnpm records where each package came from. A registry package
        // has only an integrity; a tarball or link would have a path.
        const entry = lockfile.match(
          new RegExp(`\\n  '@hostkit-ui/${name}@${version.replace(/\./g, '\\.')}':\\n(.+)`),
        )?.[1];
        if (entry?.trim() !== `resolution: {integrity: ${integrity}}`) {
          fail(`${app}'s lockfile entry for @hostkit-ui/${name}@${version} is ${entry?.trim()}`);
        }
        console.log(`  @hostkit-ui/${name} -> ${relative(dest, real)} (${version} from npm)`);
      } else {
        if (installed !== expected[name].manifest) {
          fail(`${app}'s @hostkit-ui/${name} is not the packed package.json`);
        }
        console.log(
          `  @hostkit-ui/${name} -> ${relative(dest, real)} (package.json matches tarball)`,
        );
      }
    }
    const components = await realpath(join(dest, 'node_modules', '@hostkit-ui', 'components'));
    const lit = createRequire(join(components, 'package.json')).resolve('lit');
    if (!inside(lit, join(dest, 'node_modules'))) {
      fail(`${app} resolves lit outside its copy: ${lit}`);
    }
    const lits = (await readdir(join(dest, 'node_modules', '.pnpm'))).filter((d) =>
      /^lit@\d/.test(d),
    );
    console.log(`  lit -> ${relative(dest, lit)}; installed: ${lits.join(', ')}`);
  }

  // 5. The apps' own checks and Playwright tests; only the package source
  // changed. Playwright downloads browsers only if this version lacks them.
  // The share widget has no build: its server serves the package files
  // (tarball mode) or points the page at jsDelivr (registry mode).
  for (const app of apps) {
    const dest = join(work, 'apps', app);
    const manifest = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    stage = `playwright install ${app}`;
    run('pnpm', ['exec', 'playwright', 'install', ...browsers], { cwd: dest });
    stage = `build ${app}`;
    if (manifest.scripts.build) run('pnpm', ['run', 'build'], { cwd: dest });
    stage = `typecheck ${app}`;
    run('pnpm', ['run', 'typecheck'], { cwd: dest });
    stage = `playwright test ${app}`;
    run('pnpm', ['exec', 'playwright', 'test'], { cwd: dest, env });
  }

  console.log(
    `\n${mode[0].toUpperCase() + mode.slice(1)} smoke tests passed. Work directory: ${work}`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`\nSmoke tests failed at "${stage}": ${error.message}`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `failed-stage=${stage.replace(/\n/g, ' ')}\n`);
  }
  process.exitCode = 1;
}

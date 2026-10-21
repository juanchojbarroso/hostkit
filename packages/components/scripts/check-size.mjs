// Gzip size budgets per entry (issue #7). Fails when a built entry is over
// its budget. Run after `pnpm build`. The budgets are provisional.
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

// 1 kB = 1000 bytes, as Vite reports sizes.
const budgets = {
  // npm entries: Lit is external, the consumer's bundler adds it once.
  'dist/button.js': 3_000,
  'dist/all.js': 3_000,
  // CDN entries are self-contained, Lit included.
  'cdn/button.js': 12_000,
  'cdn/all.js': 12_000,
};

// With preserveModules, an npm entry imports sibling modules (today the
// decorator helper). Measure the entry plus every local file it reaches,
// concatenated: roughly what it adds to a consumer's bundle. Bare imports
// (`lit`) are the consumer's, so they don't count.
async function localGraph(entry, seen = new Map()) {
  if (seen.has(entry)) return seen;
  const source = await readFile(entry, 'utf8');
  seen.set(entry, source);
  for (const [, spec] of source.matchAll(/(?:import|export)[^'"]*?['"](\.{1,2}\/[^'"]+)['"]/g)) {
    await localGraph(normalize(join(dirname(entry), spec)), seen);
  }
  return seen;
}

const kB = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;
let failed = false;

for (const [entry, budget] of Object.entries(budgets)) {
  let files;
  try {
    files = await localGraph(entry);
  } catch (error) {
    console.error(
      `✖ ${entry}: ${error.code === 'ENOENT' ? 'not found. Run `pnpm build` first.' : error.message}`,
    );
    failed = true;
    continue;
  }
  const size = gzipSync([...files.values()].join('\n')).length;
  const ok = size <= budget;
  if (!ok) failed = true;
  const extra = files.size > 1 ? ` (${files.size} files)` : '';
  console.log(`${ok ? '✓' : '✖'} ${entry}${extra}: ${kB(size)} gzip (budget ${kB(budget)})`);
}

if (failed) {
  console.error('Size budget check failed.');
  process.exit(1);
}

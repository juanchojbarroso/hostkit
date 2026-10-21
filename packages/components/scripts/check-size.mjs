// Gzip size budgets per entry (issue #7). Fails when a built file is over
// its budget. Run after `pnpm build`. The budgets are provisional.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

// 1 kB = 1000 bytes, as Vite reports sizes.
const budgets = {
  // The npm entry alone: Lit is external, the consumer's bundler adds it.
  'dist/button.js': 3_000,
  // The CDN entry is self-contained, Lit included.
  'cdn/button.js': 12_000,
};

const kB = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;
let failed = false;

for (const [file, budget] of Object.entries(budgets)) {
  let source;
  try {
    source = await readFile(file);
  } catch {
    console.error(`✖ ${file}: not found. Run \`pnpm build\` first.`);
    failed = true;
    continue;
  }
  const size = gzipSync(source).length;
  const ok = size <= budget;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✖'} ${file}: ${kB(size)} gzip (budget ${kB(budget)})`);
}

if (failed) {
  console.error('Size budget check failed.');
  process.exit(1);
}

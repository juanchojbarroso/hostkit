// CDN build (ADR-0006, ADR-0017): Lit bundled in, minified, one file per
// entry. All entries are built together, so code they share (Lit, each
// component) lives in one module that they import by relative URL. A
// browser loads a module once per URL, so a page that loads both
// button.js and all.js gets one hk-button definition and one copy of Lit.
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Paths, and Vite's lookup of vite.config.ts (ADR-0011 decorators), are
// relative to the package, whatever directory this is run from.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

await rm('cdn', { recursive: true, force: true });

await build({
  logLevel: 'warn',
  build: {
    outDir: 'cdn',
    emptyOutDir: false,
    minify: true,
    lib: { entry: { button: 'src/button.ts', all: 'src/all.ts' }, formats: ['es'] },
    rolldownOptions: {
      output: {
        // Library mode keeps whitespace in ES output; force full minification.
        minify: true,
        entryFileNames: '[name].js',
        // Shared modules. Every URL already contains the exact version, so
        // a hash here would only make the file names unstable.
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
});

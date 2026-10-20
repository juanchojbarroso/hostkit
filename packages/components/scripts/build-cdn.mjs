// CDN build (ADR-0006): Lit bundled in, minified, one self-contained file
// per entry. Each entry is built on its own, so no file imports a shared
// chunk and an integrator needs exactly one <script> per component.
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Paths, and Vite's lookup of vite.config.ts (ADR-0011 decorators), are
// relative to the package, whatever directory this is run from.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const entries = ['button', 'all'];

await rm('cdn', { recursive: true, force: true });

for (const name of entries) {
  await build({
    logLevel: 'warn',
    build: {
      outDir: 'cdn',
      emptyOutDir: false,
      minify: true,
      lib: { entry: `src/${name}.ts`, formats: ['es'], fileName: () => `${name}.js` },
      // Library mode keeps whitespace in ES output; force full minification.
      rolldownOptions: { output: { minify: true } },
    },
  });
}

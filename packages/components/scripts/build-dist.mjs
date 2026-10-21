// npm build (ADR-0006): ESM with preserveModules and Lit external, so a
// consumer's bundler supplies one copy of Lit and can tree-shake per
// module. Type declarations come from tsc.
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Paths, and Vite's lookup of vite.config.ts (ADR-0011 decorators), are
// relative to the package, whatever directory this is run from.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

await rm('dist', { recursive: true, force: true });

await build({
  logLevel: 'warn',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    lib: { entry: { button: 'src/button.ts', all: 'src/all.ts' }, formats: ['es'] },
    rolldownOptions: {
      external: [/^lit($|\/)/],
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
  },
});

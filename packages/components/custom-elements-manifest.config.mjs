// Custom Elements Manifest (brief §6.6): the machine-readable public API,
// generated on every build. Tests are not part of the API.

// The analyzer reads src/*.ts, but only dist/ is published: point every
// module path at the file a consumer can actually import.
const toDist = (path) => path?.replace(/^src\/(.*)\.(ts|js)$/, 'dist/$1.js');

function publishedPaths() {
  return {
    name: 'published-paths',
    packageLinkPhase({ customElementsManifest }) {
      for (const mod of customElementsManifest.modules) {
        mod.path = toDist(mod.path);
        for (const exp of mod.exports ?? []) {
          if (exp.declaration?.module) exp.declaration.module = toDist(exp.declaration.module);
        }
      }
    },
  };
}

export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
  outdir: '.',
  litelement: true,
  plugins: [publishedPaths()],
};

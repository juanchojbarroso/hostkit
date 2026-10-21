// Static server for the share widget.
//
// The page loads hostkit from two base URLs, as an integrator would from
// jsDelivr. By default they point at local directories served under
// /vendor; set these variables to test another copy of the packages:
//
//   HOSTKIT_TOKENS_DIR, HOSTKIT_COMPONENTS_DIR  serve these directories
//     (e.g. an unpacked tarball) under /vendor/tokens and /vendor/components
//   HOSTKIT_TOKENS_BASE, HOSTKIT_COMPONENTS_BASE  use these base URLs in the
//     page instead (e.g. https://cdn.jsdelivr.net/npm/@hostkit-ui/tokens@0.1.0)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 4310);

const mounts = {
  '/vendor/tokens/': resolve(process.env.HOSTKIT_TOKENS_DIR ?? join(here, '../../packages/tokens')),
  '/vendor/components/': resolve(
    process.env.HOSTKIT_COMPONENTS_DIR ?? join(here, '../../packages/components'),
  ),
};

const bases = {
  HOSTKIT_TOKENS_BASE: process.env.HOSTKIT_TOKENS_BASE ?? '/vendor/tokens',
  HOSTKIT_COMPONENTS_BASE: process.env.HOSTKIT_COMPONENTS_BASE ?? '/vendor/components',
};

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

// Resolves a URL path inside a root directory, refusing to escape it.
function inside(root, path) {
  const file = normalize(join(root, decodeURIComponent(path)));
  return file.startsWith(root + sep) ? file : null;
}

async function respond(url) {
  // Pages: index.html, plus any other top-level .html page in this app.
  const page = url === '/' ? 'index.html' : url.slice(1);
  if (/^[\w-]+\.html$/.test(page)) {
    const html = await readFile(join(here, page), 'utf8');
    return [types['.html'], html.replace(/%(HOSTKIT_\w+_BASE)%/g, (_, name) => bases[name])];
  }
  for (const [prefix, root] of Object.entries(mounts)) {
    if (url.startsWith(prefix)) {
      const file = inside(root, url.slice(prefix.length));
      if (file) return [types[extname(file)] ?? 'application/octet-stream', await readFile(file)];
    }
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost').pathname;
  try {
    const found = await respond(url);
    if (!found) throw new Error('not found');
    res.writeHead(200, { 'content-type': found[0] }).end(found[1]);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`share-widget on http://localhost:${port}`));

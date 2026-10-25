import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// QA server: a fixed, in-memory snapshot of regular files in dist/ only.
// Symlinks are excluded; requests never become filesystem paths.
const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const portArgument = process.argv[2] ?? '4180';
const port = Number(portArgument);
if (!/^\d+$/.test(portArgument) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Usage : node scripts/serve-offline.mjs [port entre 1 et 65535]');
  process.exit(1);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const files = new Map();
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    const route = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await collect(filename, route);
    else if (entry.isFile()) {
      files.set(route, {
        body: await readFile(filename),
        type: mimeTypes[extname(entry.name).toLowerCase()] ?? 'application/octet-stream',
      });
    }
  }
}
try {
  await collect(distDirectory);
  if (!files.has('/index.html')) throw new Error('index.html absent');
} catch (error) {
  console.error(`Distribution indisponible : ${error.message}. Exécuter le build avant ce contrôle.`);
  process.exit(1);
}

const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'";
const server = createServer((request, response) => {
  response.setHeader('Content-Security-Policy', policy);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '.' || part === '..')) {
    response.writeHead(400);
    response.end();
    return;
  }

  const file = files.get(pathname === '/' ? '/index.html' : pathname);
  if (!file) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { 'Content-Type': file.type, 'Content-Length': file.body.length });
  response.end(request.method === 'HEAD' ? undefined : file.body);
});

server.on('error', error => {
  console.error(`Serveur indisponible : ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Contrôle local : http://127.0.0.1:${port}/`);
  console.log(`${files.size} fichiers de dist/ chargés. Relancer ce serveur après tout nouveau build.`);
  console.log('La CSP interdit les ressources distantes ; le système reste connecté à Internet. Arrêt : Ctrl+C.');
});

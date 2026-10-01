// One Mini App of the stand (docs/75): its built files, and every other request goes to the local
// backend behind the same origin, as on the phone. WebSockets (chat, live screens) go through too.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const fileOf = (root, url) => {
  const path = normalize(decodeURIComponent(new URL(url, 'http://stand').pathname));
  const file = join(root, path === '/' ? 'index.html' : path);
  return file.startsWith(`${root}${sep}`) && existsSync(file) && statSync(file).isFile() ? file : null;
};

// Only the path and the query of a request go on: the host is always the backend of the stand, so
// a full address in a request line cannot send the server elsewhere.
const pathOf = (url) => {
  const { pathname, search } = new URL(url, 'http://stand');
  return `${pathname}${search}`;
};

export function serveApp({ root, port, api }) {
  const backend = new URL(api);
  const server = createServer((incoming, outgoing) => {
    const file = fileOf(root, incoming.url ?? '/');
    if (file) {
      outgoing.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(outgoing);
      return;
    }
    const headers = { ...incoming.headers, host: backend.host };
    const forward = request({
      hostname: backend.hostname,
      port: backend.port,
      path: pathOf(incoming.url ?? '/'),
      method: incoming.method,
      headers,
    });
    forward.on('response', (answer) => {
      outgoing.writeHead(answer.statusCode ?? 502, answer.headers);
      answer.pipe(outgoing);
    });
    forward.on('error', () => outgoing.writeHead(502).end());
    incoming.pipe(forward);
  });
  server.on('upgrade', (incoming, socket, head) => {
    const upstream = connect(Number(backend.port), backend.hostname, () => {
      const lines = [`${incoming.method} ${pathOf(incoming.url ?? '/')} HTTP/1.1`];
      for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
        const name = incoming.rawHeaders[i];
        lines.push(`${name}: ${name.toLowerCase() === 'host' ? backend.host : incoming.rawHeaders[i + 1]}`);
      }
      upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
      upstream.write(head);
      upstream.pipe(socket).pipe(upstream);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  });
  server.listen(port);
  return server;
}

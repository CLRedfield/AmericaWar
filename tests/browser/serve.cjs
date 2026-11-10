const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(process.env.FOCUS_SOURCE_ROOT || path.join(__dirname, '../..'));
const port = Number(process.env.FOCUS_PORT || 8766);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

const server = http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405).end();
        return;
    }
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
        if (pathname.split('/').some(part => part.startsWith('.'))) {
            response.writeHead(403).end();
            return;
        }
        const file = path.resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
        const relative = path.relative(root, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            response.writeHead(403).end();
            return;
        }
        const realFile = await fs.realpath(file);
        const realRoot = await fs.realpath(root);
        const realRelative = path.relative(realRoot, realFile);
        if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
            response.writeHead(403).end();
            return;
        }
        const bytes = await fs.readFile(realFile);
        response.writeHead(200, { 'Content-Type': types[path.extname(realFile)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch {
        response.writeHead(404).end();
    }
});

server.listen(port, '127.0.0.1', () => console.log(`Focus test server: http://127.0.0.1:${port}/`));

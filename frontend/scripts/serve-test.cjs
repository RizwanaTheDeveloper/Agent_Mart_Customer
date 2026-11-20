const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const reference = url.pathname.startsWith('/__apk/');
  const base = path.join(root, reference ? 'assets/apk' : 'dist');
  const relative = reference ? url.pathname.slice('/__apk/'.length) : url.pathname.slice(1);
  let file = path.resolve(base, relative || 'index.html');
  if (!file.startsWith(base + path.sep) && file !== base) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(base, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(8092, '127.0.0.1', () => console.log('Test preview: http://127.0.0.1:8092'));

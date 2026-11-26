const { spawn, spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, openSync, closeSync } = require('node:fs');
const net = require('node:net');
const path = require('node:path');

function listening(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    const finish = result => { socket.destroy(); resolve(result); };
    socket.setTimeout(1000, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function ensureSellerService() {
  const configured = process.env.EXPO_PUBLIC_SELLER_URL
    ? new URL(process.env.EXPO_PUBLIC_SELLER_URL)
    : null;
  // A local override still needs the local service. Only remote workspaces
  // are managed elsewhere and can skip startup.
  if (configured && !['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname)) return;
  const port = configured
    ? Number(configured.port || (configured.protocol === 'https:' ? 443 : 80))
    : Number(process.env.EXPO_PUBLIC_SELLER_PORT || process.env.SELLER_PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid seller port.');
  process.env.EXPO_PUBLIC_SELLER_PORT = String(port);
  if (await listening(port)) {
    console.log(`Seller service already running at http://localhost:${port}`);
    return;
  }
  const seller = path.resolve(__dirname, '../seller');
  if (!existsSync(path.join(seller, 'node_modules/vinext/package.json'))) {
    throw Error('Seller dependencies are missing. Run npm.cmd --prefix seller ci from frontend/.');
  }
  const logs = path.resolve(__dirname, '../outputs');
  mkdirSync(logs, { recursive: true });
  const logFile = path.join(logs, 'seller-dev.log');
  const fd = openSync(logFile, 'a');
  const child = spawn(process.execPath, [path.join(seller, 'scripts/run-framework.mjs'), 'dev', '--port', String(port), '--hostname', '0.0.0.0'], {
    cwd: seller,
    env: process.env,
    stdio: ['ignore', fd, fd],
    windowsHide: true,
    detached: process.platform !== 'win32',
  });
  closeSync(fd);
  let error;
  child.once('error', value => { error = value; });
  // Only stop the service created by this Metro process; reused servers stay up.
  process.once('exit', () => {
    if (!child.pid || child.exitCode !== null) return;
    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true, timeout: 5000 });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already stopped. */ }
    }
  });
  console.log(`Starting Seller service at http://localhost:${port}`);
  for (let attempt = 0; attempt < 120; attempt++) {
    if (error || child.exitCode !== null) throw Error(`Seller service could not start. See ${logFile}${error ? `: ${error.message}` : ''}`);
    if (await listening(port)) {
      console.log(`Seller service ready. Logs: ${logFile}`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  child.kill();
  throw Error(`Seller service timed out. See ${logFile}`);
}

module.exports = { ensureSellerService };

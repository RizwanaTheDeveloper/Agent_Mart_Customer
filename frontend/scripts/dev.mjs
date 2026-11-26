import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const frontend = new URL('../', import.meta.url);
const sellerExpo = process.argv.includes('--seller-expo');
const expoArgs = process.argv.slice(2).filter(arg => arg !== '--seller-expo');
const sellerPort = Number(process.env.SELLER_PORT || 5173);
const buyerPort = sellerExpo ? Number(process.env.SELLER_EXPO_PORT || 8082) : Number(process.env.BUYER_PORT || 8081);
const apps = [
  {
    name: 'Seller',
    cwd: new URL('seller/', frontend),
    cli: new URL('seller/scripts/run-framework.mjs', frontend),
    dependency: new URL('seller/node_modules/vinext/package.json', frontend),
    args: ['dev', '--port', String(sellerPort), '--hostname', '0.0.0.0'],
    stdin: 'ignore',
  },
  {
    name: sellerExpo ? 'Seller Expo' : 'AgentMart',
    cwd: new URL(sellerExpo ? 'seller/expo/' : './', frontend),
    cli: new URL(sellerExpo ? 'seller/expo/node_modules/expo/bin/cli' : 'node_modules/expo/bin/cli', frontend),
    dependency: new URL(sellerExpo ? 'seller/expo/node_modules/expo/package.json' : 'node_modules/expo/package.json', frontend),
    args: ['start', ...(sellerExpo ? [] : ['--web']), '--port', String(buyerPort), ...expoArgs],
    stdin: 'inherit',
  },
];

function isListening(port, host) {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host });
    const finish = listening => { socket.destroy(); resolve(listening); };
    socket.setTimeout(1500, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function checkPort(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error(`Invalid frontend port: ${port}`);
  // Windows may allow a second bind on loopback even while a wildcard listener
  // owns the port. Probe IPv4 and IPv6 before attempting to reserve it.
  const listeners = await Promise.all(['127.0.0.1', '::1'].map(host => isListening(port, host)));
  if (listeners.some(Boolean)) throw Error(`A server is already listening at http://localhost:${port}. Open the existing AgentMart app at http://localhost:${buyerPort}, or press Ctrl+C in its original terminal before restarting. Do not start a second copy.`);
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(Error(`Port ${port} is already in use. Stop the existing app before starting both together.`)));
    server.listen({ port, host: '0.0.0.0', exclusive: true }, () => server.close(resolve));
  });
}

try {
  if (sellerPort === buyerPort) throw Error('Seller web and Expo must use different ports.');
  for (const app of apps) {
    try { await access(app.dependency); }
    catch { throw Error(`${app.name} dependencies are missing. Run ${sellerExpo ? 'npm run install:seller:expo' : 'npm run install:all'} from the repository root.`); }
  }
  await Promise.all([checkPort(sellerPort), checkPort(buyerPort)]);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`\nStarting ${sellerExpo ? 'Seller Studio with Expo' : 'AgentMart (Seller + Buyer)'}:\n  Seller web: http://127.0.0.1:${sellerPort}\n  ${sellerExpo ? 'Seller Expo' : 'AgentMart app (choose Buyer or Seller)'}: http://localhost:${buyerPort}\n\nScan Expo's QR code on your phone.\nPress Ctrl+C to stop both servers.\n`);

const children = [];
let stopping = false;

async function stop(code) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(child => new Promise(resolve => {
    if (!child.pid || child.exitCode !== null) { resolve(); return; }
    if (process.platform === 'win32') {
      // Kill only the process trees started by this launcher, including Metro workers.
      const cleanup = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      cleanup.once('close', resolve);
      cleanup.once('error', resolve);
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
      resolve();
    }
  })));
  process.exit(code);
}

process.on('SIGINT', () => void stop(0));
process.on('SIGTERM', () => void stop(0));

for (const app of apps) {
  const child = spawn(process.execPath, [fileURLToPath(app.cli), ...app.args], {
    cwd: fileURLToPath(app.cwd),
    env: { ...process.env, EXPO_PUBLIC_SELLER_PORT: String(sellerPort), AGENTMART_SELLER_MANAGED: '1' },
    stdio: [app.stdin, 'inherit', 'inherit'],
    detached: process.platform !== 'win32',
  });
  children.push(child);
  child.once('error', error => { console.error(`${app.name}: ${error.message}`); void stop(1); });
  child.once('exit', (code, signal) => {
    if (!stopping) {
      console.log(`${app.name} stopped${signal ? ` (${signal})` : ''}. Stopping the complete frontend.`);
      void stop(code || 1);
    }
  });
}

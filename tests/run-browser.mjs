import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const services = [
  { port: 5283, args: ['--host', '127.0.0.1', '--port', '5283', '--strictPort'], local: 'true' },
  { port: 5284, args: ['--host', '127.0.0.1', '--port', '5284', '--strictPort'], local: 'false' },
  {
    port: 4283,
    args: ['preview', '--host', '127.0.0.1', '--port', '4283', '--strictPort'],
    local: 'false',
  },
];
const processes = [];
async function waitFor(service) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (service.child.exitCode !== null)
      throw new Error(`Serveur ${service.port} arrêté : ${service.logs}`);
    try {
      const response = await fetch(`http://127.0.0.1:${service.port}`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Serveur ${service.port} indisponible : ${service.logs}`);
}
async function run(file) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'tests', file)], {
      cwd: root,
      windowsHide: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_URL: 'http://127.0.0.1:5283',
        AUTH_TEST_URL: 'http://127.0.0.1:5284',
        PWA_TEST_URL: 'http://127.0.0.1:4283',
      },
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${file} a échoué (${code}).`)),
    );
  });
}
try {
  for (const service of services) {
    service.logs = '';
    service.child = spawn(process.execPath, [vite, ...service.args], {
      cwd: root,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, VITE_LOCAL_MODE: service.local },
    });
    processes.push(service.child);
    const capture = (buffer) => {
      service.logs = (service.logs + buffer.toString()).slice(-4000);
    };
    service.child.stdout.on('data', capture);
    service.child.stderr.on('data', capture);
    service.child.once('error', (error) => {
      service.logs += error.message;
    });
  }
  await Promise.all(services.map(waitFor));
  for (const file of ['browser.mjs', 'auth.mjs', 'pwa.mjs']) await run(file);
} finally {
  processes.forEach((child) => child.kill());
}

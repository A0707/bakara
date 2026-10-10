import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve('dist');
const workerPath = path.join(root, 'sw.js');
const worker = fs.readFileSync(workerPath, 'utf8');
const assets = fs
  .readdirSync(path.join(root, 'assets'))
  .filter((name) => !name.endsWith('.map'))
  .map((name) => '/assets/' + name);
const revision = createHash('sha256')
  .update(worker)
  .update(fs.readFileSync(path.join(root, 'index.html')))
  .update(JSON.stringify(assets))
  .digest('hex')
  .slice(0, 12);
if (!worker.includes("'bakara-pwa-development'") || !worker.includes('const BUILD_ASSETS = [];'))
  throw new Error('PWA build markers not found');
fs.writeFileSync(
  workerPath,
  worker
    .replace("'bakara-pwa-development'", `'bakara-pwa-${revision}'`)
    .replace('const BUILD_ASSETS = [];', `const BUILD_ASSETS = ${JSON.stringify(assets)};`),
);
console.log(`PWA: ${assets.length} build assets precached, revision ${revision}`);

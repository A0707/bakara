import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
// Browser-native installation UI cannot be interacted with by this test. Keep
// the manual path deterministic, then dispatch a controlled prompt below.
await page.addInitScript(() =>
  window.addEventListener('beforeinstallprompt', (event) => {
    if (!event.bakaraTest) event.stopImmediatePropagation();
  }),
);
const base = process.env.PWA_TEST_URL || 'http://127.0.0.1:4173';
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(base);
await page.getByRole('heading', { name: 'Bienvenue chez Bakara.' }).waitFor();
const manifestResponse = await page.request.get(base + '/manifest.json');
const manifest = await manifestResponse.json();
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.id, '/');
for (const icon of manifest.icons) {
  const response = await page.request.get(base + '/' + icon.src);
  assert.equal(response.status(), 200);
  assert.ok(response.headers()['content-type'].includes('image/png'));
}
await page.getByRole('button', { name: 'Installer Bakara', exact: true }).click();
await page.getByRole('dialog', { name: 'Bakara sur votre téléphone' }).waitFor();
await page.getByRole('button', { name: 'Compris', exact: true }).click();
await page.evaluate(() => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  event.bakaraTest = true;
  event.prompt = async () => {
    window.installPrompted = true;
  };
  event.userChoice = Promise.resolve({ outcome: 'dismissed' });
  window.dispatchEvent(event);
});
await page.getByRole('button', { name: 'Installer Bakara', exact: true }).click();
assert.equal(await page.evaluate(() => window.installPrompted), true);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForFunction(() => !!navigator.serviceWorker.controller);
const cacheName = await page.evaluate(async () =>
  (await caches.keys()).find((key) => key.startsWith('bakara-pwa-')),
);
assert.ok(cacheName);
const assets = await page.evaluate(async () => {
  const key = (await caches.keys()).find((key) => key.startsWith('bakara-pwa-'));
  const cache = await caches.open(key);
  return (await cache.keys()).map((request) => request.url);
});
assert.equal(
  assets.some((url) => url.includes('supabase.co')),
  false,
);
assert.ok(assets.filter((url) => url.includes('/assets/')).length >= 2);
await context.setOffline(true);
await page.reload();
await page.getByRole('heading', { name: 'Bienvenue chez Bakara.' }).waitFor();
// Chromium's network emulation can leave navigator.onLine true in a
// service-worker-controlled page. Exercise the browser status event explicitly.
await page.evaluate(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
  window.dispatchEvent(new Event('offline'));
});
await page.getByText('Hors connexion.', { exact: false }).waitFor();
await page.getByLabel('Adresse email').fill('test@example.com');
await page.getByLabel('Mot de passe').fill('test-password');
assert.equal(
  await page.getByRole('button', { name: 'Se connecter', exact: true }).isDisabled(),
  true,
);
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
await context.setOffline(false);
await page.evaluate(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
  window.dispatchEvent(new Event('online'));
});
await page.getByText('Hors connexion.', { exact: false }).waitFor({ state: 'hidden' });
await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
await page
  .getByRole('button', { name: 'Installer Bakara', exact: true })
  .waitFor({ state: 'hidden' });
assert.deepEqual(errors, []);
const ios = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  reducedMotion: 'reduce',
});
const iphone = await ios.newPage();
await iphone.addInitScript(() =>
  window.addEventListener('beforeinstallprompt', (event) => event.stopImmediatePropagation()),
);
await iphone.goto(base);
await iphone.getByRole('button', { name: 'Installer Bakara', exact: true }).click();
await iphone.getByText('Ouvrez ce site dans Safari.', { exact: true }).waitFor();
await iphone.screenshot({ path: 'test-results/pwa-install-iphone.png', fullPage: true });
await ios.close();
await browser.close();
console.log(
  'Production PWA checks passed: manifest/icons, Android install prompt, iPhone instructions, first-visit offline shell, offline login disabled, installed state, no API cache.',
);

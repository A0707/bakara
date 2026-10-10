import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
const base = process.env.PWA_TEST_URL || 'http://127.0.0.1:4173';
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(base);
await page.getByRole('heading', { name: 'Heureux de vous retrouver.' }).waitFor();
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForFunction(() => !!navigator.serviceWorker.controller);
await page.reload();
await page.getByRole('heading', { name: 'Heureux de vous retrouver.' }).waitFor();
await page.waitForFunction(async () => {
  const cache = await caches.open('bakara-v10');
  return (await cache.keys()).filter((request) => request.url.includes('/assets/')).length >= 2;
});
const assets = await page.evaluate(async () => {
  const cache = await caches.open('bakara-v10');
  return (await cache.keys()).map((request) => request.url);
});
assert.equal(
  assets.some((url) => url.includes('supabase.co')),
  false,
);
await context.setOffline(true);
await page.reload();
await page.getByRole('heading', { name: 'Heureux de vous retrouver.' }).waitFor();
assert.deepEqual(errors, []);
await browser.close();
console.log(
  'Production PWA checks passed: compiled assets cached, offline login shell loads, no API requests cached.',
);

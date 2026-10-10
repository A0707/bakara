import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const base = process.env.AUTH_TEST_URL || 'http://127.0.0.1:5174';
const id = '00000000-0000-4000-8000-000000000001';
const user = {
  id,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  { alg: 'HS256', typ: 'JWT' },
  {
    sub: id,
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  'mock',
]
  .map((x, i) => (i < 2 ? Buffer.from(JSON.stringify(x)).toString('base64url') : x))
  .join('.');
async function setup(role, { failRead = false, missingIncome = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let loginAttempt = 0,
    denyWrites = true;
  const writes = [],
    collections = { charges: [], alim: [], biens: [], locataires: [] };
  await page.route('https://vpzsrmwthtllmwmsgfsn.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    let status = 200,
      body = {};
    if (url.pathname.endsWith('/token')) {
      loginAttempt++;
      if (loginAttempt === 1) {
        status = 400;
        body = { error: 'invalid_grant', error_description: 'Invalid login credentials' };
      } else
        body = {
          access_token: token,
          token_type: 'bearer',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          user,
        };
    } else if (url.pathname.endsWith('/user')) body = user;
    else if (url.pathname.endsWith('/profiles')) body = { id, role, email: user.email };
    else if (url.pathname.endsWith('/bakara_data')) {
      if (route.request().method() === 'POST') {
        const rows = route.request().postDataJSON();
        writes.push(rows);
        if (denyWrites) {
          status = 403;
          body = { message: 'Mock denied write', code: '42501' };
        } else {
          rows.forEach((row) => {
            collections[row.id] = row.data;
            if (row.id === 'alim') missingIncome = false;
          });
          body = rows;
        }
      } else if (failRead) {
        status = 403;
        body = { message: 'Mock denied read', code: '42501' };
      } else
        body = Object.entries(collections)
          .filter(([id]) => !missingIncome || id !== 'alim')
          .map(([id, data]) => ({ id, data }));
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Bienvenue chez Bakara.', exact: true }).waitFor();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(
    a11y.violations.map((v) => v.id),
    [],
    'login accessibility',
  );
  await page.screenshot({ path: `test-results/redesign-login-${role}.png`, fullPage: true });
  await page.getByLabel('Adresse email').fill(user.email);
  await page.getByLabel('Mot de passe').fill('mock-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  if (failRead)
    await page.getByRole('heading', { name: 'Retrouvons vos données.', exact: true }).waitFor();
  else await page.getByText('CAISSE DISPONIBLE', { exact: true }).waitFor();
  return {
    page,
    errors,
    writes,
    collections,
    allowWrites: () => {
      denyWrites = false;
    },
  };
}
const admin = await setup('admin');
await admin.page.getByRole('button', { name: 'Charges', exact: true }).click();
await admin.page.getByRole('button', { name: 'Nouvelle charge', exact: true }).click();
await admin.page.getByLabel(/^Désignation/).fill('Échec simulé');
await admin.page.getByLabel(/^Catégorie/).selectOption('Divers');
await admin.page.getByLabel(/^Montant \(MAD\)/).fill('15');
await admin.page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await admin.page
  .getByRole('alert')
  .getByText('La modification n’a pas été sauvegardée.', { exact: false })
  .waitFor();
assert.equal(admin.writes.length, 1);
assert.equal(admin.collections.charges.length, 0);
assert.equal(
  await admin.page
    .locator('.ledger-table')
    .getByRole('cell', { name: 'Échec simulé', exact: true })
    .count(),
  0,
);
admin.allowWrites();
await admin.page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await admin.page.getByRole('dialog').waitFor({ state: 'hidden' });
await admin.page.getByRole('cell', { name: 'Échec simulé', exact: true }).waitFor();
await admin.page.getByRole('button', { name: 'Biens immobiliers', exact: true }).click();
await admin.page.getByRole('button', { name: 'Nouveau bien', exact: true }).click();
await admin.page.getByLabel(/^Nom du bien/).fill('Bien cloud simulé');
await admin.page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await admin.page.getByRole('dialog').waitFor({ state: 'hidden' });
assert.deepEqual(
  admin.writes
    .at(-1)
    .map((row) => row.id)
    .sort(),
  ['biens', 'locataires'],
);
assert.deepEqual(admin.errors, []);
await admin.page.close();
const guest = await setup('guest');
await guest.page.getByRole('button', { name: 'Charges', exact: true }).click();
await guest.page.getByText('Vous consultez cet espace en lecture seule.').waitFor();
assert.equal(
  await guest.page.getByRole('button', { name: 'Nouvelle charge', exact: true }).count(),
  0,
);
assert.equal(guest.writes.length, 0);
assert.deepEqual(guest.errors, []);
await guest.page.close();
const failure = await setup('admin', { failRead: true });
assert.equal(await failure.page.getByText('CAISSE DISPONIBLE', { exact: true }).count(), 0);
assert.equal(failure.writes.length, 0);
await failure.page.close();
const partial = await setup('admin', { missingIncome: true });
await partial.page.getByText('Solde indisponible', { exact: true }).waitFor();
assert.equal(await partial.page.getByText('Solde déficitaire', { exact: true }).count(), 0);
await partial.page.getByRole('button', { name: 'Entrées de caisse', exact: true }).click();
await partial.page
  .getByText('L’historique des entrées de caisse n’est pas disponible', { exact: false })
  .waitFor();
partial.allowWrites();
await partial.page.getByRole('button', { name: 'Nouvelle entrée', exact: true }).click();
await partial.page.getByLabel(/^Source/).fill('Entrée confirmée');
await partial.page.getByLabel(/^Montant \(MAD\)/).fill('100');
await partial.page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await partial.page.getByRole('dialog').waitFor({ state: 'hidden' });
await partial.page.getByRole('button', { name: 'Vue d’ensemble', exact: true }).click();
await partial.page.getByText('Solde positif', { exact: true }).waitFor();
assert.equal(partial.writes.length, 1);
assert.deepEqual(partial.errors, []);
await partial.page.close();
await browser.close();
console.log(
  'Cloud mocks passed: login, guest permissions, rejected save leaves data unchanged, retry succeeds, linked rows in one request, read failure does not show fallback money.',
);

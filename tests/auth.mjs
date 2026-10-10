import { chromium } from '@playwright/test';
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
async function setup(role) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let loginAttempt = 0,
    writes = 0;
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
        writes++;
        status = 403;
        body = { message: 'Mock denied write', code: '42501' };
      } else body = { data: [] };
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Heureux de vous retrouver.' }).waitFor();
  await page.screenshot({ path: `test-results/login-${role}.png`, fullPage: true });
  await page.getByLabel('Adresse email').fill(user.email);
  await page.getByLabel('Mot de passe').fill('mock-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await page.getByRole('heading', { name: 'Votre patrimoine, en un regard.' }).waitFor();
  await page.getByText('CAISSE DISPONIBLE', { exact: true }).waitFor();
  return { page, errors, getWrites: () => writes };
}
const admin = await setup('admin');
await admin.page.getByRole('button', { name: 'Charges', exact: true }).click();
await admin.page.getByRole('button', { name: '+ Charge', exact: true }).click();
await admin.page.getByLabel('Designation', { exact: true }).fill('Échec simulé');
await admin.page.getByLabel('Categorie', { exact: true }).selectOption('Divers');
await admin.page.getByLabel('Montant (MAD)', { exact: true }).fill('15');
await admin.page.getByRole('button', { name: 'Ajouter', exact: true }).click();
await admin.page.getByText('La modification n’a pas été sauvegardée.', { exact: false }).waitFor();
assert.equal(admin.getWrites(), 1);
assert.equal(await admin.page.getByRole('button', { name: '+ Charge', exact: true }).count(), 0);
assert.equal(await admin.page.getByText('Enregistré', { exact: true }).count(), 0);
assert.deepEqual(admin.errors, []);
await admin.page.close();
const guest = await setup('guest');
await guest.page.getByRole('button', { name: 'Charges', exact: true }).click();
await guest.page.getByText('Vous consultez cet espace en lecture seule.').waitFor();
assert.equal(await guest.page.getByRole('button', { name: '+ Charge', exact: true }).count(), 0);
assert.equal(guest.getWrites(), 0);
assert.deepEqual(guest.errors, []);
await guest.page.setViewportSize({ width: 390, height: 844 });
await guest.page.screenshot({ path: 'test-results/guest-mobile.png', fullPage: true });
await browser.close();
console.log(
  'Mocked cloud checks passed: invalid and valid login, admin edit, save rejection, guest read-only. No live database requests.',
);

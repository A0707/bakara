import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base);
await page.getByRole('heading', { name: 'Votre patrimoine, en un regard.' }).waitFor();
await page.getByText('CAISSE DISPONIBLE', { exact: true }).waitFor();
fs.mkdirSync('test-results', { recursive: true });
await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
await page.getByRole('button', { name: 'Charges', exact: true }).click();
await page.getByRole('button', { name: '+ Charge', exact: true }).click();
await page.getByLabel('Designation', { exact: true }).fill('Charge de vérification');
await page.getByLabel('Categorie', { exact: true }).selectOption('Divers');
await page.getByLabel('Montant (MAD)', { exact: true }).fill('125.50');
await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
await page.getByLabel('Rechercher une charge').fill('Charge de vérification');
await page.getByRole('cell', { name: 'Charge de vérification', exact: true }).waitFor();
assert.equal(await page.locator('tbody tr').count(), 1);
await page.reload();
await page.getByRole('button', { name: 'Charges', exact: true }).click();
await page.getByLabel('Rechercher une charge').fill('Charge de vérification');
await page.getByRole('cell', { name: 'Charge de vérification', exact: true }).waitFor();
await page.getByRole('button', { name: 'Modifier', exact: true }).click();
await page.getByLabel('Montant (MAD)', { exact: true }).fill('150');
await page.getByRole('dialog').getByRole('button', { name: 'Modifier', exact: true }).click();
await page.locator('tbody').getByRole('cell', { name: '150,00', exact: true }).waitFor();
await page.getByRole('button', { name: 'Entrées de caisse', exact: true }).click();
await page.getByRole('button', { name: '+ Alimentation', exact: true }).click();
await page.getByLabel('Source', { exact: true }).fill('Entrée de vérification');
await page.getByLabel('Montant (MAD)', { exact: true }).fill('200');
await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
await page.getByRole('cell', { name: 'Entrée de vérification', exact: true }).waitFor();
await page.getByRole('button', { name: 'Loyers & locataires', exact: true }).click();
await page.getByRole('heading', { name: 'Des loyers suivis, l’esprit tranquille.' }).waitFor();
await page.screenshot({ path: 'test-results/loyers-desktop.png', fullPage: true });
await page.getByRole('button', { name: 'Biens immobiliers', exact: true }).click();
await page.getByRole('heading', { name: 'Votre patrimoine prend forme.' }).waitFor();
await page.getByRole('button', { name: '+ Bien', exact: true }).click();
await page.getByLabel('Nom / désignation', { exact: true }).fill('Bien de vérification');
await page.getByLabel('Type', { exact: true }).selectOption('Studio');
await page.getByLabel('Loyer actuel', { exact: true }).fill('1000');
await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
await page.getByText('Bien de vérification', { exact: true }).waitFor();
await page.getByRole('button', { name: 'Loyers & locataires', exact: true }).click();
await page.getByRole('button', { name: '+ Locataire', exact: true }).click();
await page.getByLabel('Nom', { exact: true }).fill('Locataire de vérification');
await page.getByLabel('Loyer mensuel (MAD)', { exact: true }).fill('1000');
const option = await page
  .getByRole('dialog')
  .locator('option')
  .filter({ hasText: 'Bien de vérification' })
  .getAttribute('value');
await page.getByRole('dialog').locator('select').selectOption(option);
await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
const tenantCard = page
  .locator('div')
  .filter({ has: page.getByText('Locataire de vérification', { exact: true }) })
  .filter({ has: page.getByRole('button', { name: 'Valider', exact: true }) })
  .last();
await tenantCard.getByRole('button', { name: 'Valider', exact: true }).click();
await page.getByRole('button', { name: '✓ Confirmer le paiement', exact: true }).click();
await page.getByText('Locataire de vérification', { exact: true }).waitFor();
const stored = await page.evaluate(() => ({
  properties: JSON.parse(localStorage.getItem('bakara_biens')),
  tenants: JSON.parse(localStorage.getItem('bakara_locataires')),
}));
const tenant = stored.tenants.find((l) => l.name === 'Locataire de vérification');
const property = stored.properties.find((b) => b.nom === 'Bien de vérification');
assert.equal(tenant.bienId, property.id);
assert.equal(property.locataireId, tenant.id);
assert.equal(Object.values(tenant.pay)[0].montant, 1000);
await page.getByRole('button', { name: 'Vue d’ensemble', exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  false,
  'no horizontal overflow',
);
await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
await page.getByRole('button', { name: 'Charges', exact: true }).click();
await page.getByRole('heading', { name: 'Gardez le cap sur vos dépenses.' }).waitFor();
await page.getByRole('button', { name: '+ Charge', exact: true }).click();
await page.getByRole('dialog').waitFor();
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(), 0);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  'Browser checks passed: dashboard, charges create/edit/persistence/search, entries, rents, properties, mobile navigation and modal keyboard.',
);

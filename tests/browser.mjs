import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
fs.mkdirSync('test-results', { recursive: true });
async function scan(name) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  fs.writeFileSync(`test-results/a11y-${name}.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
    [],
    `accessibility ${name}`,
  );
}
async function nav(name) {
  await page.getByRole('button', { name, exact: true }).click();
}
await page.goto(base);
await page.getByText('CAISSE DISPONIBLE', { exact: true }).waitFor();
await page.screenshot({ path: 'test-results/redesign-dashboard-desktop.png', fullPage: true });
await scan('dashboard-desktop');
await nav('Charges');
await page.getByRole('heading', { name: 'Toutes les charges', exact: true }).waitFor();
await page.getByRole('button', { name: 'Nouvelle charge', exact: true }).click();
await page.getByLabel(/^Désignation/).fill('Charge de vérification');
await page.getByLabel(/^Catégorie/).selectOption('Divers');
await page.getByLabel(/^Montant \(MAD\)/).fill('125.50');
await scan('charge-form');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page.getByLabel('Rechercher une charge', { exact: true }).fill('Charge de vérification');
await page.getByRole('cell', { name: 'Charge de vérification', exact: true }).waitFor();
assert.equal(await page.locator('.ledger-table tbody tr').count(), 1);
await page.reload();
await page.getByRole('heading', { name: 'Vos charges.', exact: true }).waitFor();
await page.getByLabel('Rechercher une charge', { exact: true }).fill('Charge de vérification');
await page
  .locator('.ledger-table')
  .getByRole('button', { name: 'Modifier Charge de vérification', exact: true })
  .click();
await page.getByLabel(/^Montant \(MAD\)/).fill('150');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page
  .locator('.ledger-table tbody')
  .getByRole('cell', { name: '150,00 MAD', exact: true })
  .waitFor();
await scan('charges-desktop');
await nav('Entrées de caisse');
await page.getByRole('button', { name: 'Nouvelle entrée', exact: true }).click();
await page.getByLabel(/^Source/).fill('Entrée de vérification');
await page.getByLabel(/^Montant \(MAD\)/).fill('200');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page.getByRole('cell', { name: 'Entrée de vérification', exact: true }).waitFor();
await scan('entries-desktop');
await nav('Biens immobiliers');
await page.getByRole('button', { name: 'Nouveau bien', exact: true }).click();
await page.getByLabel(/^Nom du bien/).fill('Bien de vérification');
await page.getByLabel(/^Type/).selectOption('Studio');
await page.getByLabel('Loyer actuel (MAD)', { exact: true }).fill('1000');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page.getByRole('heading', { name: 'Bien de vérification', exact: true }).waitFor();
await page.screenshot({ path: 'test-results/redesign-properties-desktop.png', fullPage: true });
await scan('properties-desktop');
await nav('Loyers & locataires');
await page.getByRole('button', { name: 'Nouveau locataire', exact: true }).click();
await page.getByLabel(/^Nom du locataire/).fill('Locataire de vérification');
await page.getByLabel(/^Loyer mensuel/).fill('1000');
const option = await page
  .getByRole('dialog')
  .locator('option')
  .filter({ hasText: 'Bien de vérification' })
  .getAttribute('value');
await page.getByLabel('Bien loué', { exact: true }).selectOption(option);
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
const tenantCard = page
  .locator('.tenant-card')
  .filter({ has: page.getByRole('heading', { name: 'Locataire de vérification', exact: true }) });
await tenantCard.getByRole('button', { name: 'Enregistrer le paiement', exact: true }).click();
await page.getByRole('button', { name: 'Confirmer le paiement', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await tenantCard.getByText('Réglé', { exact: true }).waitFor();
await page.locator('.owner-annual').first().getByText('750,00', { exact: false }).waitFor();
const stored = await page.evaluate(() => ({
  properties: JSON.parse(localStorage.getItem('bakara_biens')),
  tenants: JSON.parse(localStorage.getItem('bakara_locataires')),
}));
const tenant = stored.tenants.find((l) => l.name === 'Locataire de vérification'),
  property = stored.properties.find((b) => b.nom === 'Bien de vérification');
assert.equal(tenant.bienId, property.id);
assert.equal(property.locataireId, tenant.id);
assert.equal(Object.values(tenant.pay)[0].montant, 1000);
await tenantCard
  .getByRole('button', { name: 'Historique de Locataire de vérification', exact: true })
  .click();
await page.getByRole('dialog').getByText('Réglé', { exact: true }).waitFor();
await page.keyboard.press('Escape');
await tenantCard.getByRole('button', { name: 'Annuler le paiement', exact: true }).click();
await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await tenantCard.getByText('À régler', { exact: true }).waitFor();
await scan('rents-desktop');
await page.screenshot({ path: 'test-results/redesign-rents-desktop.png', fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
for (const [name, key, marker] of [
  ['Vue d’ensemble', 'dashboard', 'CAISSE DISPONIBLE'],
  ['Charges', 'charges', 'Toutes les charges'],
  ['Entrées de caisse', 'entries', 'Toutes les entrées'],
  ['Loyers & locataires', 'rents', 'Qui a réglé son loyer ?'],
  ['Biens immobiliers', 'properties', 'Les biens, simplement.'],
]) {
  await nav(name);
  await page.getByText(marker, { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    `no overflow ${key}`,
  );
  await scan(`${key}-mobile`);
  await page.screenshot({
    path: `test-results/redesign-${key}-mobile.png`,
    fullPage: key === 'dashboard',
  });
  if (key === 'dashboard')
    await page.screenshot({ path: 'test-results/redesign-mobile-overview.png', fullPage: false });
}
await nav('Charges');
await page.getByRole('button', { name: 'Nouvelle charge', exact: true }).click();
await page.getByRole('dialog').waitFor();
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(), 0);
await page.getByLabel('Rechercher une charge', { exact: true }).fill('Charge de vérification');
await page
  .locator('.ledger-mobile')
  .getByRole('button', { name: 'Supprimer Charge de vérification', exact: true })
  .click();
await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
assert.equal(
  await page.evaluate(() =>
    JSON.parse(localStorage.getItem('bakara_charges')).some(
      (x) => x.d === 'Charge de vérification',
    ),
  ),
  false,
);
await page.setViewportSize({ width: 320, height: 720 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  '320px layout',
);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  'Browser checks passed: CRUD, persistence, route reload, linked records, payment/history/cancellation, mobile navigation, 320px layout and accessibility across all five screens.',
);

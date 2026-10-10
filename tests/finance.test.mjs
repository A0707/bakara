import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateData } from '../src/lib/migrations.js';
import { categoryTotals, rentMetrics, sum } from '../src/lib/metrics.js';
test('migration retains legacy paid months and property links without modifying input', () => {
  const old = [{ id: 1, rent: 1200, months: { 0: true, 1: 0, 11: 1200 } }];
  const result = migrateData('locataires', old, []);
  assert.deepEqual(Object.keys(result[0].pay), ['2025-0', '2025-11']);
  assert.equal(result[0].bienId, null);
  assert.deepEqual(old[0].months, { 0: true, 1: 0, 11: 1200 });
});
test('empty collections remain empty instead of being replaced by seed records', () => {
  assert.deepEqual(migrateData('charges', [], [{ id: 1 }]), []);
  assert.deepEqual(migrateData('biens', null, []), []);
});
test('rents use zero-based legacy payment keys and the selected year', () => {
  const rows = [
    { rent: 1000, pay: { '2026-9': { mode: 'espece' } } },
    { rent: 2000, pay: { '2025-9': {} } },
  ];
  const result = rentMetrics(rows, new Date(2026, 9, 10));
  assert.equal(result.received, 1000);
  assert.equal(result.due, 2000);
  assert.equal(result.pct, 50);
  assert.equal(rentMetrics([], new Date()).pct, 0);
});
test('financial aggregates preserve decimal amounts and unknown categories', () => {
  const rows = [
    { m: 83.6, c: 'Divers' },
    { m: 16.4, c: 'Divers' },
    { m: 50, c: 'Nouvelle catégorie' },
  ];
  assert.equal(sum(rows), 150);
  assert.deepEqual(categoryTotals(rows), [
    { category: 'Divers', amount: 100 },
    { category: 'Nouvelle catégorie', amount: 50 },
  ]);
});
test('historical rent amount remains unchanged after a rent increase', () => {
  const rows = [{ rent: 1500, pay: { '2026-9': { montant: 1200 } } }];
  assert.equal(rentMetrics(rows, new Date(2026, 9, 10)).received, 1200);
});

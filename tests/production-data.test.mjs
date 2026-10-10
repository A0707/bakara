import test from 'node:test';
import assert from 'node:assert/strict';
import { createFinanceRepository } from '../src/lib/financeRepository.js';
import { cashMetrics } from '../src/lib/metrics.js';
test('missing income row is not treated as a confirmed zero balance', async () => {
  const rows = [
    { id: 'biens', data: [] },
    { id: 'charges', data: [{ id: 1, d: 'Charge', m: 100 }] },
    { id: 'locataires', data: [] },
  ];
  const client = {
    from: () => ({
      select: () => ({ in: () => ({ abortSignal: async () => ({ data: rows, error: null }) }) }),
    }),
  };
  const snapshot = await createFinanceRepository(client).load();
  assert.deepEqual(snapshot._missingCollections, ['alim']);
  assert.equal(cashMetrics(snapshot).income, null);
  assert.equal(cashMetrics(snapshot).balance, null);
  assert.equal(cashMetrics(snapshot).expenses, 100);
});
test('an existing empty income collection is different from an absent collection', () => {
  const snapshot = { alim: [], charges: [{ m: 100 }], _missingCollections: [] };
  assert.equal(cashMetrics(snapshot).income, 0);
  assert.equal(cashMetrics(snapshot).balance, -100);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveProperty,
  saveTenant,
  removeProperty,
  removeTenant,
  saveLedger,
  savePayment,
  removePayment,
} from '../src/lib/financeModel.js';
import { createFinanceRepository, emptySnapshot } from '../src/lib/financeRepository.js';
const base = () => ({
  ...emptySnapshot(),
  biens: [
    { id: 1, nom: 'Bien A', type: 'Studio', loyer: 100, prev: 150, surf: 25, locataireId: 11 },
    { id: 2, nom: 'Bien B', type: 'Magasin', loyer: 200, prev: 250, surf: 30, locataireId: 12 },
  ],
  locataires: [
    { id: 11, name: 'A', rent: 100, bienId: 1, pay: { '2026-0': { montant: 100 } } },
    { id: 12, name: 'B', rent: 200, bienId: 2, pay: {} },
  ],
});
test('moving a tenant releases both previous links and retains history', () => {
  const snapshot = base(),
    patch = saveTenant(snapshot, { ...snapshot.locataires[0], bienId: '2', rent: 110 });
  assert.equal(patch.biens[0].locataireId, null);
  assert.equal(patch.biens[1].locataireId, 11);
  assert.equal(patch.locataires[0].bienId, 2);
  assert.equal(patch.locataires[1].bienId, null);
  assert.equal(patch.locataires[0].pay['2026-0'].montant, 100);
  assert.equal(snapshot.biens[0].locataireId, 11);
});
test('a property can be made vacant without deleting its tenant', () => {
  const snapshot = base(),
    patch = saveProperty(snapshot, { ...snapshot.biens[0], locataireId: '' });
  assert.equal(patch.biens[0].locataireId, null);
  assert.equal(patch.locataires[0].bienId, null);
  assert.equal(patch.locataires.length, 2);
});
test('editing a tenant without supplying history preserves payments', () => {
  const snapshot = base();
  const patch = saveTenant(snapshot, { id: 11, name: 'A', rent: 110, bienId: 1 });
  assert.equal(patch.locataires[0].pay['2026-0'].montant, 100);
  assert.throws(() => saveProperty(snapshot, { ...snapshot.biens[0], id: 999 }));
});
test('deleting a property or tenant releases the reverse link', () => {
  assert.equal(removeProperty(base(), 1).locataires[0].bienId, null);
  assert.equal(removeTenant(base(), 11).biens[0].locataireId, null);
});
test('money and required fields are validated; legacy periods remain editable', () => {
  assert.throws(() =>
    saveLedger(emptySnapshot(), 'charges', { d: 'Test', c: 'Divers', date: '2026-10-10', m: -5 }),
  );
  assert.throws(() => saveLedger(emptySnapshot(), 'alim', { s: ' ', m: 5 }));
  const snapshot = {
    ...emptySnapshot(),
    charges: [{ id: 1, d: 'Historique', c: 'Divers', p: '2025', m: 20 }],
  };
  const patch = saveLedger(snapshot, 'charges', { ...snapshot.charges[0], m: 20.345, date: '' });
  assert.equal(patch.charges[0].m, 20.35);
  assert.equal(patch.charges[0].p, '2025');
  assert.equal(patch.charges[0].date, '');
});
test('payment records keep their amount and can be cancelled immutably', () => {
  const snapshot = base(),
    patch = savePayment(snapshot, 11, '2026-9', { date: '2026-10-10', mode: 'virement' });
  assert.equal(patch.locataires[0].pay['2026-9'].montant, 100);
  assert.equal(snapshot.locataires[0].pay['2026-9'], undefined);
  assert.equal(
    removePayment({ ...snapshot, ...patch }, 11, '2026-9').locataires[0].pay['2026-9'],
    undefined,
  );
});
test('linked collections are sent together in one upsert', async () => {
  const calls = [];
  const client = {
    from: () => ({
      upsert: (rows, options) => {
        calls.push({ rows, options });
        return { abortSignal: async () => ({ error: null }) };
      },
    }),
  };
  await createFinanceRepository(client).save(
    saveTenant(base(), { ...base().locataires[0], bienId: '' }),
  );
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].rows.map((row) => row.id).sort(), ['biens', 'locataires']);
  assert.equal(calls[0].rows[0].updated_at, calls[0].rows[1].updated_at);
});
test('cloud read failure cannot substitute seed data', async () => {
  const client = {
    from: () => ({
      select: () => ({ in: () => ({ abortSignal: async () => ({ error: new Error('denied') }) }) }),
    }),
  };
  await assert.rejects(() => createFinanceRepository(client).load(base()));
});
test('local write failure restores both collections', async () => {
  const records = new Map([
    ['bakara_biens', '[]'],
    ['bakara_locataires', '[]'],
  ]);
  let failed = false;
  const local = {
    getItem: (key) => records.get(key) ?? null,
    removeItem: (key) => records.delete(key),
    setItem: (key, value) => {
      if (key === 'bakara_locataires' && !failed) {
        failed = true;
        throw new Error('quota');
      }
      records.set(key, value);
    },
  };
  await assert.rejects(() =>
    createFinanceRepository(null, local).save({ biens: [{ id: 1 }], locataires: [{ id: 2 }] }),
  );
  assert.equal(records.get('bakara_biens'), '[]');
  assert.equal(records.get('bakara_locataires'), '[]');
});

import { migrateData } from './migrations.js';
export const COLLECTIONS = ['charges', 'alim', 'biens', 'locataires'];
export const emptySnapshot = () => Object.fromEntries(COLLECTIONS.map((key) => [key, []]));
const prefix = 'bakara_';
export function createFinanceRepository(client, local) {
  return {
    async load(fallback = emptySnapshot()) {
      if (client) {
        const { data, error } = await client
          .from('bakara_data')
          .select('id,data')
          .in('id', COLLECTIONS)
          .abortSignal(AbortSignal.timeout(7000));
        if (error) throw error;
        const snapshot = Object.fromEntries(
          COLLECTIONS.map((key) => {
            const rows = data?.find((row) => row.id === key)?.data ?? [];
            if (!Array.isArray(rows)) throw new Error('Format de données invalide.');
            return [key, migrateData(key, rows, [])];
          }),
        );
        return {
          ...snapshot,
          _missingCollections: COLLECTIONS.filter((key) => !data?.some((row) => row.id === key)),
        };
      }
      return Object.fromEntries(
        COLLECTIONS.map((key) => {
          const raw = local.getItem(prefix + key);
          const rows = raw ? JSON.parse(raw) : fallback[key];
          if (!Array.isArray(rows)) throw new Error('Format de données invalide.');
          return [key, migrateData(key, rows, [])];
        }),
      );
    },
    async save(patch) {
      const keys = Object.keys(patch);
      if (
        !keys.length ||
        keys.some((key) => !COLLECTIONS.includes(key) || !Array.isArray(patch[key]))
      )
        throw new Error('Modification invalide.');
      if (client) {
        const updated_at = new Date().toISOString();
        const rows = keys.map((id) => ({ id, data: patch[id], updated_at }));
        // One Data API request: linked collections are committed in one SQL transaction.
        const { error } = await client
          .from('bakara_data')
          .upsert(rows, { onConflict: 'id' })
          .abortSignal(AbortSignal.timeout(10000));
        if (error) throw error;
      } else {
        const previous = keys.map((key) => [key, local.getItem(prefix + key)]);
        try {
          keys.forEach((key) => local.setItem(prefix + key, JSON.stringify(patch[key])));
        } catch (error) {
          previous.forEach(([key, value]) => {
            if (value === null) local.removeItem(prefix + key);
            else local.setItem(prefix + key, value);
          });
          throw error;
        }
      }
    },
  };
}

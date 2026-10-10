import { supabase } from './supabase';
import { migrateData } from './migrations';
const prefix = 'bakara_';
export const storage = {
  async get(key, fallback) {
    if (supabase) {
      const { data, error } = await supabase
        .from('bakara_data')
        .select('data')
        .eq('id', key)
        .maybeSingle()
        .abortSignal(AbortSignal.timeout(7000));
      if (error) throw error;
      return migrateData(key, data?.data, []);
    }
    const raw = localStorage.getItem(prefix + key);
    return migrateData(key, raw ? JSON.parse(raw) : null, fallback);
  },
  async set(key, value) {
    if (supabase) {
      const { error } = await supabase
        .from('bakara_data')
        .upsert({ id: key, data: value, updated_at: new Date().toISOString() })
        .abortSignal(AbortSignal.timeout(10000));
      if (error) throw error;
    } else {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    }
  },
};

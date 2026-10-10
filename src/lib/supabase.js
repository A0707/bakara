import { createClient } from '@supabase/supabase-js';
import { legacyConfig } from './config';
const url = import.meta.env.VITE_SUPABASE_URL || legacyConfig.SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.SUPABASE_KEY;
export const supabase = import.meta.env.VITE_LOCAL_MODE === 'true' ? null : createClient(url, key);

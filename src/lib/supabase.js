import { createClient } from '@supabase/supabase-js';
import { legacyConfig } from './config';
const url = import.meta.env.VITE_SUPABASE_URL || legacyConfig.SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.SUPABASE_KEY;
export const LOCAL_MODE = import.meta.env.DEV && import.meta.env.VITE_LOCAL_MODE === 'true';
export const supabase = LOCAL_MODE ? null : createClient(url, key);

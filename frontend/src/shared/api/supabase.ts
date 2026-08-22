import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const missingRealtimeConfig = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean);

if (missingRealtimeConfig.length > 0) {
  console.error(`[realtime] Supabase is disabled: missing ${missingRealtimeConfig.join(', ')}.`);
}

/**
 * The REST API remains the source of truth for mutations. This client is only
 * used to receive the authenticated Postgres changes published by Supabase.
 */
export const supabaseRealtime = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
  : null;

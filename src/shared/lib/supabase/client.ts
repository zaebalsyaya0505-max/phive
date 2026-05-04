import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let configMissing = false;

function initSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) {
    configMissing = true;
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder');
    return supabaseInstance;
  }
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

export function getSupabase(): SupabaseClient {
  return initSupabase();
}

export function isSupabaseConfigured(): boolean {
  return !configMissing && !!supabaseUrl && !!supabaseKey;
}

export const supabase = {
  from: (...args: any[]) => getSupabase().from(...args),
  auth: getSupabase().auth,
  channel: (...args: any[]) => getSupabase().channel(...args),
  rpc: (...args: any[]) => getSupabase().rpc(...args),
};

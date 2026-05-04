import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

console.log('[Supabase] Env check:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey,
  url: supabaseUrl ? supabaseUrl.slice(0, 20) + '...' : 'MISSING' 
});

let supabaseInstance: SupabaseClient | null = null;
let configMissing = false;

function initSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) {
    configMissing = true;
    console.warn('[Supabase] Missing credentials!');
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

export const supabase = getSupabase();

export async function getNotes(userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select()
    .eq('user_id', userId)
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createNote(title: string, userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, user_id: userId }])
    .select();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: number, userId: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateNote(id: number, title: string) {
  const { data, error } = await supabase
    .from('notes')
    .update({ title })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

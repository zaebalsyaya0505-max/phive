import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase URL or Anon Key. Please check your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch notes for the current user only
 */
export async function getNotes(userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select()
    .eq('user_id', userId)
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new note tied to the current user
 */
export async function createNote(title: string, userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, user_id: userId }])
    .select();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a note by ID — only if owned by user
 */
export async function deleteNote(id: number, userId: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Update a note
 */
export async function updateNote(id: number, title: string) {
  const { data, error } = await supabase
    .from('notes')
    .update({ title })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  return data;
}

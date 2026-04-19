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
 * Fetch all notes from Supabase
 */
export async function getNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select()
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new note
 */
export async function createNote(title: string) {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title }])
    .select();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a note by ID
 */
export async function deleteNote(id: number) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

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

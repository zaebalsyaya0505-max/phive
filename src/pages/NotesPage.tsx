import { useEffect, useState } from 'react';
import { getNotes, createNote, deleteNote } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface Note {
  id: number;
  title: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await createNote(newNote);
      setNewNote('');
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">pHive Notes</span>
          </h1>
          <p className="text-white/50 text-lg">
            Real-time note management with Supabase
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Add Note Form */}
        <div className="mb-8 glass rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleAddNote} className="flex gap-4">
            <Input
              type="text"
              placeholder="Add a new note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder-white/30"
            />
            <Button
              type="submit"
              className="bg-phantom-purple hover:bg-phantom-purple/80"
            >
              Add Note
            </Button>
          </form>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/50">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">No notes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="glass rounded-xl p-6 border border-white/10 hover:border-phantom-purple/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs text-phantom-purple font-semibold">
                    #{note.id}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
                <p className="text-white/80 line-clamp-3">{note.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-12 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/50 text-sm font-mono">
            Total notes: {notes.length}
          </p>
        </div>
      </div>
    </div>
  );
}

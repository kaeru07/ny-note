'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadNotes, saveNotes } from '@/lib/note-storage';
import { Note, SaveStatus } from '@/types/note';

const createEmptyNote = (): Note => ({
  id: crypto.randomUUID(),
  title: '',
  content: '',
  updatedAt: new Date().toISOString()
});

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      const ok = saveNotes(notes);
      setHasStorageError(!ok);
      setSaveStatus('saved');
    }, 250);

    return () => window.clearTimeout(timer);
  }, [notes, hydrated]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return notes;
    }

    return notes.filter((note) => note.title.toLowerCase().includes(q));
  }, [notes, query]);

  const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

  const createNote = () => {
    const next = createEmptyNote();
    setNotes((prev) => [next, ...prev]);
    setSelectedId(next.id);
  };

  const updateNote = (id: string, payload: Pick<Note, 'title' | 'content'>) => {
    const timestamp = new Date().toISOString();
    setNotes((prev) => {
      const updated = prev.map((note) =>
        note.id === id
          ? {
              ...note,
              ...payload,
              updatedAt: timestamp
            }
          : note
      );

      return updated.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((note) => note.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  return {
    hydrated,
    hasStorageError,
    notes: filteredNotes,
    allNotes: notes,
    query,
    saveStatus,
    selectedId,
    selectedNote,
    setQuery,
    setSelectedId,
    createNote,
    updateNote,
    deleteNote
  };
};

'use client';

import { useEffect, useState } from 'react';
import { Editor } from '@/components/Editor';
import { Header } from '@/components/Header';
import { NoteList } from '@/components/NoteList';
import { useNotes } from '@/hooks/useNotes';

const THEME_KEY = 'quick-notes-theme';

export default function Home() {
  const {
    hydrated,
    hasStorageError,
    notes,
    query,
    saveStatus,
    selectedId,
    selectedNote,
    setQuery,
    setSelectedId,
    createNote,
    updateNote,
    deleteNote
  } = useNotes();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldDark);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark, hydrated]);

  if (!hydrated) {
    return <main className="p-6">読み込み中...</main>;
  }

  return (
    <main className="min-h-screen">
      <Header
        query={query}
        onQueryChange={setQuery}
        isDark={isDark}
        onToggleDark={() => setIsDark((prev) => !prev)}
        onCreate={createNote}
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[320px,1fr]">
        <aside className="h-full rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          {hasStorageError ? (
            <p className="mb-3 rounded-md bg-rose-100 p-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              保存時にエラーが発生しました。ブラウザ設定を確認してください。
            </p>
          ) : null}
          <NoteList notes={notes} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
        <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <Editor
            note={selectedNote}
            saveStatus={saveStatus}
            onChange={updateNote}
            onDelete={deleteNote}
          />
        </section>
      </div>
    </main>
  );
}

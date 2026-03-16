'use client';

import { formatUpdatedAt } from '@/lib/date';
import { Note } from '@/types/note';

type NoteListProps = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const previewText = (content: string): string => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, 80) : '本文なし';
};

export const NoteList = ({ notes, selectedId, onSelect }: NoteListProps) => {
  if (notes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        ノートがありません。新規作成してください
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => {
        const isActive = note.id === selectedId;

        return (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => onSelect(note.id)}
              className={`w-full rounded-md border p-3 text-left transition ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <p className="truncate font-medium">{note.title || '（無題）'}</p>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                {previewText(note.content)}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                更新: {formatUpdatedAt(note.updatedAt)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

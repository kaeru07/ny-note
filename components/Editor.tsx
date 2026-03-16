'use client';

import { Note, SaveStatus } from '@/types/note';

type EditorProps = {
  note: Note | null;
  saveStatus: SaveStatus;
  onChange: (id: string, payload: Pick<Note, 'title' | 'content'>) => void;
  onDelete: (id: string) => void;
};

export const Editor = ({ note, saveStatus, onChange, onDelete }: EditorProps) => {
  if (!note) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
        左からノートを選択、または新規作成してください
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {saveStatus === 'saving' ? '保存中...' : '保存済み'}
        </p>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:hover:bg-rose-950/30"
        >
          削除
        </button>
      </div>
      <input
        value={note.title}
        onChange={(event) =>
          onChange(note.id, { title: event.target.value, content: note.content })
        }
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-lg font-semibold outline-none ring-indigo-300 focus:ring dark:border-slate-700 dark:bg-slate-800"
        placeholder="タイトル"
      />
      <textarea
        value={note.content}
        onChange={(event) =>
          onChange(note.id, { title: note.title, content: event.target.value })
        }
        className="min-h-[320px] flex-1 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 focus:ring dark:border-slate-700 dark:bg-slate-800"
        placeholder="本文を入力してください"
      />
    </section>
  );
};

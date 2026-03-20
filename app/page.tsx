"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: number;
  text: string;
  updatedAt: string;
};

const NOTES_KEY = "ny-note-notes";
const DRAFT_KEY = "ny-note-draft";

function readNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(NOTES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Note[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item.id === "number" && typeof item.text === "string" && typeof item.updatedAt === "string")
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export default function Page() {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [showList, setShowList] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDraft(window.localStorage.getItem(DRAFT_KEY) ?? "");
    setNotes(readNotes());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DRAFT_KEY, draft);
  }, [draft]);

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return notes;
    }

    return notes.filter((note) => note.text.toLowerCase().includes(keyword));
  }, [notes, search]);

  const handleSave = () => {
    const text = draft.trim();

    if (!text) {
      setMessage("空入力は保存できません");
      return;
    }

    const nextNote: Note = {
      id: Date.now(),
      text,
      updatedAt: new Date().toISOString()
    };

    const nextNotes = [nextNote, ...notes];
    setNotes(nextNotes);
    writeNotes(nextNotes);
    setDraft("");
    window.localStorage.removeItem(DRAFT_KEY);
    setMessage("保存しました");
    setShowList(true);
  };

  const handleDelete = (id: number) => {
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);
    writeNotes(nextNotes);
    setMessage("削除しました");
  };

  return (
    <main className="container">
      <h1>ny-note</h1>

      <div className="buttonRow">
        <a className="btn" href="https://keep.google.com/" target="_blank" rel="noopener noreferrer">
          Google Keep
        </a>
        <a className="btn" href="https://app.simplenote.com/" target="_blank" rel="noopener noreferrer">
          Simplenote
        </a>
        <button className="btn" type="button" onClick={() => setShowList((prev) => !prev)}>
          {showList ? "一覧を閉じる" : "一覧表示"}
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder="メモを入力"
        aria-label="メモ入力"
      />

      <div className="buttonRow saveRow">
        <button className="btn btnPrimary" type="button" onClick={handleSave}>
          保存
        </button>
      </div>

      {message && <p className="status">{message}</p>}

      {showList && (
        <section className="listSection">
          <h2>保存済みメモ一覧</h2>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="検索"
            aria-label="メモ検索"
          />

          <div className="notes">
            {filteredNotes.length === 0 ? (
              <p className="empty">メモはありません</p>
            ) : (
              filteredNotes.map((note) => (
                <article key={note.id} className="card">
                  <p className="text">{note.text}</p>
                  <p className="meta">更新: {formatDate(note.updatedAt)}</p>
                  <button className="btn btnDanger" type="button" onClick={() => handleDelete(note.id)}>
                    削除
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}

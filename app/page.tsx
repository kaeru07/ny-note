"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";

type Note = {
  id: string;
  text: string;
  created_at: string;
  updated_at: string;
};

const DRAFT_KEY = "ny-note-draft";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export default function Home() {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDraft = window.localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setDraft(savedDraft);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DRAFT_KEY, draft);
  }, [draft]);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setErrorMessage("接続エラー");
      setIsLoading(false);
      return;
    }

    const fetchNotes = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("notes")
        .select("id, text, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) {
        setErrorMessage("接続エラー");
      } else if (data) {
        setNotes(data);
      }
      setIsLoading(false);
    };

    void fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return notes;
    }

    return notes.filter((note) => note.text.toLowerCase().includes(keyword));
  }, [notes, search]);

  const saveNote = async () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    if (!hasSupabaseEnv()) {
      setErrorMessage("接続エラー");
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notes")
      .insert({ text })
      .select("id, text, created_at, updated_at")
      .single();

    if (error || !data) {
      setErrorMessage("接続エラー");
      return;
    }

    setNotes((prev) => [data, ...prev]);
    setDraft("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  };

  const deleteNote = async (id: string) => {
    if (!hasSupabaseEnv()) {
      setErrorMessage("接続エラー");
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      setErrorMessage("接続エラー");
      return;
    }

    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <main className="container">
      <h1>ny-note</h1>

      <div className="buttonRow">
        <a
          className="btn"
          href="https://keep.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Google Keep を開く"
        >
          Google Keep
        </a>
        <a
          className="btn"
          href="https://app.simplenote.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Simplenote を開く"
        >
          Simplenote
        </a>
        <button
          className="btn"
          type="button"
          aria-label="一覧表示を切り替える"
          onClick={() => setShowList((prev) => !prev)}
        >
          {showList ? "一覧を閉じる" : "一覧表示"}
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="メモを入力"
        aria-label="メモ入力"
      />

      <div className="buttonRow saveRow">
        <button className="btn btnPrimary" type="button" aria-label="メモを保存" onClick={saveNote}>
          保存
        </button>
      </div>

      {showList && (
        <section className="listSection">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="検索"
            aria-label="メモ検索"
          />

          <div className="notes">
            {errorMessage ? (
              <p className="empty">{errorMessage}</p>
            ) : isLoading ? (
              <p className="empty">読み込み中...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="empty">該当するメモはありません</p>
            ) : (
              filteredNotes.map((note) => (
                <article key={note.id} className="card">
                  <p className="text">{note.text}</p>
                  <p className="meta">更新日時: {formatDate(note.updated_at)}</p>
                  <button
                    className="btn"
                    type="button"
                    aria-label="メモを削除"
                    onClick={() => void deleteNote(note.id)}
                  >
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [debugMessage, setDebugMessage] = useState("");

  const getMissingSupabaseEnv = useCallback(() => {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      missing.push("NEXT_PUBLIC_SUPABASE_URL");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    return missing;
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!hasSupabaseEnv()) {
      const missing = getMissingSupabaseEnv();
      setFetchError("読み込みに失敗しました");
      setDebugMessage(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    setIsLoading(true);
    setFetchError("");
    console.log("notes fetch start");

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, text, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("notes fetch error", error.message);
        setFetchError("読み込みに失敗しました");
        setDebugMessage(`読み込みエラー: ${error.message}`);
        return;
      }

      setNotes(data ?? []);
      setDebugMessage("");
      console.log("notes fetch success", { count: data?.length ?? 0 });
    } catch (error) {
      console.error("notes fetch error", error);
      setFetchError("読み込みに失敗しました");
      setDebugMessage(`読み込み例外: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [getMissingSupabaseEnv]);

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
    void fetchNotes();
  }, [fetchNotes]);

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
      const missing = getMissingSupabaseEnv();
      setSaveError("保存に失敗しました");
      setDebugMessage(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      return;
    }

    const supabase = getSupabaseClient();
    setSaveError("");
    console.log("note save start");

    try {
      const { data, error } = await supabase.from("notes").insert([{ text }]).select("id, text, created_at, updated_at");

      if (error) {
        console.error("note save error", error.message);
        setSaveError("保存に失敗しました");
        setDebugMessage(`保存エラー: ${error.message}`);
        return;
      }

      console.log("note save success", { count: data?.length ?? 0 });
      setDebugMessage("");
      setDraft("");

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }

      await fetchNotes();
    } catch (error) {
      console.error("note save error", error);
      setSaveError("保存に失敗しました");
      setDebugMessage(`保存例外: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const deleteNote = async (id: string) => {
    if (!hasSupabaseEnv()) {
      const missing = getMissingSupabaseEnv();
      setDeleteError("削除に失敗しました");
      setDebugMessage(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      return;
    }

    const supabase = getSupabaseClient();
    setDeleteError("");

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("note delete error", error.message);
      setDeleteError("削除に失敗しました");
      setDebugMessage(`削除エラー: ${error.message}`);
      return;
    }

    setDebugMessage("");
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

      {saveError && <p className="empty">{saveError}</p>}
      {debugMessage && (
        <p className="empty" role="status" aria-live="polite">
          デバッグ情報: {debugMessage}
        </p>
      )}

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
            {fetchError ? (
              <p className="empty">{fetchError}</p>
            ) : isLoading ? (
              <p className="empty">読み込み中...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="empty">まだメモはありません</p>
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
          {deleteError && <p className="empty">{deleteError}</p>}
        </section>
      )}
    </main>
  );
}

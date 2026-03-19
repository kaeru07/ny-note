"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

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

function formatDbError(prefix: string, error: PostgrestError | Error | string) {
  if (typeof error === "string") {
    return `${prefix}: ${error}`;
  }

  if ("code" in error && "details" in error && "hint" in error) {
    const details = [error.message, error.code, error.details, error.hint].filter(Boolean).join(" | ");
    return `${prefix}: ${details}`;
  }

  return `${prefix}: ${error.message}`;
}

export default function Home() {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [dbError, setDbError] = useState("");

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
    console.log("notes fetch start");

    if (!hasSupabaseEnv()) {
      const missing = getMissingSupabaseEnv();
      setFetchError("読み込みに失敗しました");
      setDbError(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    setIsLoading(true);
    setFetchError("");
    setDbError("");

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("FETCH RESULT:", { data, error });

      if (error) {
        console.error("notes fetch error full:", JSON.stringify(error, null, 2));
        setFetchError("読み込みに失敗しました");
        setDbError(formatDbError("読み込みエラー", error));
        return;
      }

      if (!data) {
        const message = "読み込み結果が空です（data が null）";
        console.error("notes fetch error", message);
        setFetchError("読み込みに失敗しました");
        setDbError(message);
        return;
      }

      setNotes(data as Note[]);
      console.log("notes fetch success", { count: data.length });
    } catch (error) {
      console.error("notes fetch exception full:", error);
      setFetchError("読み込みに失敗しました");
      setDbError(formatDbError("読み込み例外", error instanceof Error ? error : String(error)));
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
    console.log("save button clicked");
    const text = draft.trim();

    setSaveMessage("");

    if (!text) {
      setSaveError("メモを入力してください");
      return;
    }

    if (!hasSupabaseEnv()) {
      const missing = getMissingSupabaseEnv();
      setSaveError("保存に失敗しました");
      setDbError(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      return;
    }

    const supabase = getSupabaseClient();
    setSaveError("");
    setDbError("");
    setIsSaving(true);
    console.log("note save start");

    try {
      const { data, error } = await supabase.from("notes").insert([{ text }]).select();
      console.log("INSERT RESULT:", { data, error });

      if (error) {
        console.error("note save error full:", JSON.stringify(error, null, 2));
        setSaveError(`保存に失敗しました: ${error.message}`);
        setDbError(formatDbError("保存エラー", error));
        alert("保存エラー: " + JSON.stringify(error));
        return;
      }

      alert("保存成功");
      setSaveMessage("保存しました");
      setDraft("");

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }

      await fetchNotes();
    } catch (e) {
      console.error("note save exception full:", e);
      setSaveError(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
      setDbError(formatDbError("保存例外", e instanceof Error ? e : String(e)));
      alert("例外: " + String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!hasSupabaseEnv()) {
      const missing = getMissingSupabaseEnv();
      setDeleteError("削除に失敗しました");
      setDbError(`Supabase環境変数が不足しています: ${missing.join(", ")}`);
      return;
    }

    const supabase = getSupabaseClient();
    setDeleteError("");
    setDbError("");

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("note delete error", error);
      setDeleteError("削除に失敗しました");
      setDbError(formatDbError("削除エラー", error));
      return;
    }

    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <main className="container">
      <h1>ny-note</h1>
      <p style={{ color: "red" }}>DEBUG BUILD 001</p>

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
        <button
          className="btn btnPrimary"
          type="button"
          aria-label="メモを保存"
          onClick={saveNote}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "保存 DEBUG"}
        </button>
      </div>

      {saveError && <p className="empty">{saveError}</p>}
      {saveMessage && <p className="empty">{saveMessage}</p>}
      {dbError && (
        <p className="empty" role="status" aria-live="polite">
          エラー詳細: {dbError}
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

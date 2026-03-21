"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabase";

type Note = {
  id: number;
  text: string;
  updatedAt: string;
};

type SupabaseNote = {
  id: number;
  text: string;
  created_at: string;
  updated_at: string;
};

const NOTES_KEY = "ny-note-notes";
const DRAFT_KEY = "ny-note-draft";

function sortNotesDesc(notes: Note[]) {
  return [...notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function normalizeNotes(input: unknown): Note[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Note => {
      return (
        !!item &&
        typeof item === "object" &&
        typeof (item as Note).id === "number" &&
        typeof (item as Note).text === "string" &&
        typeof (item as Note).updatedAt === "string"
      );
    })
    .map((item) => ({
      id: item.id,
      text: item.text.trim(),
      updatedAt: item.updatedAt
    }))
    .filter((item) => item.text.length > 0);
}

function readNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(NOTES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return sortNotesDesc(normalizeNotes(parsed));
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [supabaseNotes, setSupabaseNotes] = useState<SupabaseNote[]>([]);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [supabaseErrorMessage, setSupabaseErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSupabaseNotes = useCallback(async () => {
    if (!hasSupabaseEnv()) {
      setSupabaseErrorMessage("Supabaseの環境変数が未設定です");
      setSupabaseNotes([]);
      return;
    }

    console.log("supabase fetch start");
    setIsSupabaseLoading(true);
    setSupabaseErrorMessage(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });

      console.log("supabase fetch result", { data, error });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        setSupabaseNotes([]);
        setSupabaseErrorMessage(error.message);
        return;
      }

      setSupabaseNotes((data ?? []) as SupabaseNote[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase一覧の取得に失敗しました";
      setSupabaseNotes([]);
      setSupabaseErrorMessage(message);
    } finally {
      setIsSupabaseLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchSupabaseNotes();
  }, [fetchSupabaseNotes]);

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return notes;
    }

    return notes.filter((note) => note.text.toLowerCase().includes(keyword));
  }, [notes, search]);

  const resetEditing = () => {
    setEditingId(null);
  };

  const handleSave = async () => {
    const text = draft.trim();

    if (!text) {
      setMessage("空入力は保存できません");
      return;
    }

    const now = new Date().toISOString();

    if (editingId !== null) {
      const nextNotes = sortNotesDesc(
        notes.map((note) =>
          note.id === editingId
            ? {
                ...note,
                text,
                updatedAt: now
              }
            : note
        )
      );
      setNotes(nextNotes);
      writeNotes(nextNotes);
      setMessage("更新しました");
    } else {
      const nextNote: Note = {
        id: Date.now(),
        text,
        updatedAt: now
      };

      const nextNotes = sortNotesDesc([nextNote, ...notes]);
      setNotes(nextNotes);
      writeNotes(nextNotes);
      setMessage("保存しました");

      if (hasSupabaseEnv()) {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.from("notes").insert([{ text }]).select();

          if (error) {
            console.error(JSON.stringify(error, null, 2));
            setMessage(`保存しました（Supabase保存失敗: ${error.message}）`);
          } else {
            console.log("supabase insert success", data);
            setMessage("保存しました / Supabase保存成功");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Supabase保存に失敗しました";
          console.error(JSON.stringify(error, null, 2));
          setMessage(`保存しました（Supabase保存失敗: ${errorMessage}）`);
        }

        await fetchSupabaseNotes();
      }
    }

    setDraft("");
    resetEditing();
    window.localStorage.removeItem(DRAFT_KEY);
    setShowList(true);
  };

  const handleDelete = (id: number) => {
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);
    writeNotes(nextNotes);

    if (editingId === id) {
      setDraft("");
      resetEditing();
      window.localStorage.removeItem(DRAFT_KEY);
    }

    setMessage("削除しました");
  };

  const handleEditStart = (note: Note) => {
    setDraft(note.text);
    setEditingId(note.id);
    setShowList(true);
    setMessage("編集中です");
  };

  const handleEditCancel = () => {
    setDraft("");
    resetEditing();
    setMessage("編集をキャンセルしました");
    window.localStorage.removeItem(DRAFT_KEY);
  };

  const handleExport = () => {
    if (notes.length === 0) {
      setMessage("エクスポートするメモがありません");
      return;
    }

    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `ny-note-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setMessage("エクスポートしました");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = normalizeNotes(parsed);

      if (imported.length === 0) {
        setMessage("インポート可能なメモがありません");
        return;
      }

      const existingIds = new Set(notes.map((note) => note.id));
      const now = new Date().toISOString();
      let sequence = Date.now();

      const sanitized = imported.map((note) => {
        if (!existingIds.has(note.id)) {
          existingIds.add(note.id);
          return note;
        }

        sequence += 1;
        return {
          ...note,
          id: sequence,
          updatedAt: now
        };
      });

      const nextNotes = sortNotesDesc([...sanitized, ...notes]);
      setNotes(nextNotes);
      writeNotes(nextNotes);
      setMessage(`${sanitized.length}件インポートしました`);
    } catch {
      setMessage("不正なJSONのためインポートできません");
    }
  };

  const hasSearch = search.trim().length > 0;

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
        <button className="btn" type="button" onClick={handleExport}>
          エクスポート
        </button>
        <button className="btn" type="button" onClick={handleImportClick}>
          インポート
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hiddenInput" onChange={handleImportChange} />
      </div>

      <div className="sectionTitleRow">
        <h2>{editingId !== null ? "メモ編集" : "メモ作成"}</h2>
        {editingId !== null && <span className="editingBadge">編集中</span>}
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder="メモを入力"
        aria-label="メモ入力"
      />

      <div className="buttonRow saveRow">
        <button className="btn btnPrimary" type="button" onClick={handleSave}>
          {editingId !== null ? "更新保存" : "保存"}
        </button>
        {editingId !== null && (
          <button className="btn" type="button" onClick={handleEditCancel}>
            編集キャンセル
          </button>
        )}
      </div>

      {message && <p className="status">{message}</p>}

      {showList && (
        <>
          <section className="listSection">
            <div className="sectionTitleRow">
              <h2>保存済みメモ一覧</h2>
              <p className="count">{notes.length}件</p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="検索"
              aria-label="メモ検索"
            />

            <div className="notes">
              {filteredNotes.length === 0 ? (
                <p className="empty">{hasSearch ? "検索結果は0件です" : "メモはありません"}</p>
              ) : (
                filteredNotes.map((note) => (
                  <article key={note.id} className="card">
                    <p className="text">{note.text}</p>
                    <p className="meta">更新: {formatDate(note.updatedAt)}</p>
                    <div className="buttonRow cardActions">
                      <button className="btn" type="button" onClick={() => handleEditStart(note)}>
                        編集
                      </button>
                      <button className="btn btnDanger" type="button" onClick={() => handleDelete(note.id)}>
                        削除
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="listSection">
            <div className="sectionTitleRow">
              <h2>Supabaseメモ一覧</h2>
              <p className="count">{supabaseNotes.length}件</p>
            </div>

            {isSupabaseLoading && <p className="status">読み込み中...</p>}
            {!isSupabaseLoading && supabaseErrorMessage && <p className="status">取得失敗: {supabaseErrorMessage}</p>}
            {!isSupabaseLoading && !supabaseErrorMessage && <p className="status">読み込み成功: {supabaseNotes.length}件</p>}

            <div className="notes">
              {!isSupabaseLoading && !supabaseErrorMessage && supabaseNotes.length === 0 ? (
                <p className="empty">Supabaseにメモはありません</p>
              ) : (
                supabaseNotes.map((note) => (
                  <article key={`supabase-${note.id}`} className="card">
                    <p className="text">{note.text}</p>
                    <p className="meta">作成: {formatDate(note.created_at)}</p>
                    <p className="meta">更新: {formatDate(note.updated_at)}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

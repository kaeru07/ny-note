'use client';

type HeaderProps = {
  query: string;
  onQueryChange: (value: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onCreate: () => void;
};

export const Header = ({
  query,
  onQueryChange,
  isDark,
  onToggleDark,
  onCreate
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center">
        <h1 className="text-xl font-bold">Quick Notes</h1>
        <input
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-300 transition focus:ring dark:border-slate-600 dark:bg-slate-800 md:max-w-xs"
          type="search"
          placeholder="タイトル検索"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div className="flex gap-2 md:ml-auto">
          <button
            type="button"
            onClick={onToggleDark}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {isDark ? 'ライトモード' : 'ダークモード'}
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            新規作成
          </button>
        </div>
      </div>
    </header>
  );
};

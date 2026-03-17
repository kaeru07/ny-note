# ny-note

Supabase で永続化するシンプルな 1 ページノートアプリです。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 環境変数

`.env.local` を作成して以下を設定してください。

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase テーブル

```sql
create extension if not exists pgcrypto;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
before update on public.notes
for each row
execute procedure public.set_updated_at();
```

## RLS 例（匿名アクセスを許可する場合）

```sql
alter table public.notes enable row level security;

create policy "allow select notes"
on public.notes for select
using (true);

create policy "allow insert notes"
on public.notes for insert
with check (true);

create policy "allow delete notes"
on public.notes for delete
using (true);
```

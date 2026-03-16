# Quick Notes

Next.js + TypeScript + App Router + Tailwind CSS で実装したシンプルなノートアプリです。

## 主な機能

- ノート一覧表示
- ノート新規作成 / 編集 / 削除
- タイトル検索
- 本文プレビュー表示
- 最終更新日時表示
- ダークモード切替
- localStorage 永続化
- レスポンシブ対応（モバイル1カラム）

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## セットアップ

```bash
npm install
npm run dev
```

起動後、`http://localhost:3000` を開いてください。

## 利用方法

1. ヘッダー右側の「新規作成」でノートを追加
2. 左カラムでノートを選択
3. 右カラムでタイトル・本文を編集（自動保存）
4. 不要なノートは「削除」ボタンで削除
5. ヘッダー検索ボックスでタイトル検索
6. ダークモードボタンで表示切替

## Vercel デプロイ手順

1. GitHub にリポジトリを push する
2. [Vercel](https://vercel.com/) にログイン
3. **Add New** → **Project** を選択
4. 対象の GitHub リポジトリを Import
5. Framework Preset が **Next.js** になっていることを確認
6. **Deploy** をクリック
7. デプロイ完了後に発行される URL へアクセス

## 開発コマンド

```bash
npm run dev    # 開発サーバー
npm run lint   # ESLint
npm run build  # 本番ビルド
npm run start  # 本番サーバー
```

# ny-note

Vercelで公開する「全体ノートアプリ」の作成・運用メモです。

## GitHub → ChatGPT環境 → Vercel 公開手順

### ① GitHubでリポジトリ作成
- https://github.com を開く
- 右上の「＋」→ **New repository**
- **Repository name** を入力
- **Public** を選択
- **Add README** にチェック
- **Create repository** を押す

### ② ChatGPTブラウザで環境作成
- ChatGPTを開く
- 左メニューの「環境」を選択
- 「＋」を押す
- **GitHub repository** を選択
- 作成したリポジトリを選択
- 環境名を入力
- **環境作成** を押す

### ③ ChatGPT環境で開発
- 環境を開く
- コード生成・ファイル作成・修正を行う
- ノート機能に加えて、自分で描ける（手書き）機能を追加する
- 変更内容を確認して、GitHubへcommitする

### ④ Copilotへ初回コミットを依頼（追記）
- ノート作成後、GitHub Copilot Chatに初回コミットを依頼する
- 依頼例: 「この変更を初回コミットとして、わかりやすいコミットメッセージでcommitしてください」
- commit内容を確認して必要なら修正する

### ⑤ Pull Requestを作成
- GitHubで対象リポジトリを開く
- 作業ブランチを `main` に向けて **Compare & pull request**
- タイトル・説明を入力して **Create pull request**

### ⑥ Vercelで公開
- https://vercel.com を開く
- **Add New** → **Project**
- GitHub repository を選択
- **Deploy** を押す

### ⑦ 公開URLを確認
- 数十秒で公開される
- 例: `https://xxxx.vercel.app`

### ⑧ 更新方法
- ChatGPT環境で修正
- GitHubにcommit
- 必要に応じてPRを作成・マージ
- Vercelが自動デプロイ

## PR作成で止まるときのエラーチェック
- リポジトリに変更があるか（差分が0だとPRは作れない）
- `main` ではなく作業ブランチで作業しているか
- ブランチがGitHubにpush済みか
- ベースブランチ（通常 `main`）と比較ブランチが逆になっていないか
- GitHub / Vercel 側の一時的障害（Statusページ）

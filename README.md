# 講師・生徒コミュニケーション管理システム

## セットアップ

### 必要環境
- Node.js v22以上（v24推奨）

### インストール

```bash
cd communication-app

# バックエンド依存パッケージのインストール
npm install --prefix backend

# フロントエンド依存パッケージのインストール
npm install --prefix frontend
```

### 起動

**バックエンドサーバー（ターミナル1）:**
```bash
cd backend
npm run dev
```

**フロントエンドサーバー（ターミナル2）:**
```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 を開く

## ログイン情報

### 管理者ログイン
- 名前: `管理者`
- パスワード: `admin1234`
- ログイン画面で「管理者ログイン」タブを選択

### 講師ログイン
- 管理者画面で講師アカウントを作成してからログイン
- 「講師ログイン」タブで名前とパスワードを入力

## 機能

### 講師向け
- **コミュニケーション記録**: シフト日を選んで話した生徒をチェック
- **生徒カルテ**: 好きなもの・頑張ってること・話した内容を記録
- **頑張ったカード**: 生徒の頑張りをカードにして印刷/PDF保存

### 管理者向け
- **生徒管理**: 生徒の登録・編集・削除
- **講師管理**: 講師アカウントの作成・削除・活動確認
- **活動状況**: 講師別・生徒別のコミュニケーション状況確認

## 技術構成

| 層 | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript + Tailwind CSS |
| バックエンド | Node.js + Express + TypeScript |
| データベース | Turso (libSQL) |
| 認証 | JWT (24時間有効) |
| ホスティング | Vercel (フロントエンド + APIサーバーレス関数) |

## デプロイ (Vercel)

フロントエンドとAPIを1つのVercelプロジェクトで動かします。

- `frontend/` をビルドして静的配信
- `api/[...path].ts` が `/api/*` をすべて受け取り、`backend/src/app.ts` のExpressアプリに渡す

ビルド設定はリポジトリ直下の `vercel.json` に入っているので、Vercel側の設定は以下だけです。

**1. Root Directory**

Settings → Build and Deployment → Root Directory を**リポジトリ直下（空欄）**にする。
`frontend` のままだと `api/` が見つからずAPIが動きません。

**2. 環境変数** (Settings → Environment Variables)

| 変数名 | 内容 |
|---|---|
| `TURSO_DATABASE_URL` | TursoのデータベースURL |
| `TURSO_AUTH_TOKEN` | Tursoの認証トークン |
| `JWT_SECRET` | 任意の長いランダム文字列 |

`VITE_API_URL` は**設定しない**でください。未設定だとフロントが同じドメインの `/api` を呼びます。

`FRONTEND_URL` も同一ドメインなので不要です。

## データ保存場所

Turso (libSQL)。`TURSO_DATABASE_URL` で指定したデータベースに保存されます。
ホスティング先を変えてもデータはTursoに残ります。

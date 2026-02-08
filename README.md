# Cloudflare Pages + Google Sheets API

GoogleスプレッドシートをAPIのデータソースとして使用するCloudflare Pagesアプリケーションです。

## 特徴

- **APIキー不要**: 公開スプレッドシートならCSVエクスポート機能を使用
- **APIキー対応**: より高速なアクセスが必要な場合はGoogle Sheets APIも使用可能
- **柔軟な設定**: 環境変数またはURLパラメータで設定可能

## セットアップ

### 方法1: APIキーなし（推奨）

#### 1. Googleスプレッドシートの準備

1. Googleスプレッドシートを作成
2. スプレッドシートを「リンクを知っている全員」に**閲覧可能**で共有
3. URLから`SPREADSHEET_ID`をコピー（例: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`）

### 方法2: APIキーあり（オプション）

#### 1. Google API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「ライブラリ」から「Google Sheets API」を有効化
4. 「APIとサービス」→「認証情報」から「APIキー」を作成
5. APIキーをコピー

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### APIキーなしで使う場合

`.dev.vars` ファイルを作成:

```
GOOGLE_SHEET_ID=your_spreadsheet_id
```

### APIキーありで使う場合

`.dev.vars` ファイルを作成:

```
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_API_KEY=your_api_key
SHEET_RANGE=Sheet1!A:Z
```

## Cloudflare Pagesへのデプロイ

```bash
# Cloudflareにログイン
npx wrangler login

# デプロイ
npm run deploy
```

初回デプロイ後、Cloudflare Dashboardで環境変数を設定:

1. Cloudflare Dashboardにログイン
2. 「Pages」→ 作成したプロジェクトを選択
3. 「Settings」→「Environment variables」
4. 最低限必要な環境変数:
   - `GOOGLE_SHEET_ID`: スプレッドシートID

5. オプション（APIキーを使う場合）:
   - `GOOGLE_API_KEY`: Google APIキー
   - `SHEET_RANGE`: 読み取り範囲（例: Sheet1!A:Z）

## プロジェクト構成

```
.
├── functions/
│   └── api/
│       └── sheets.js       # Google Sheets APIエンドポイント
├── public/
│   └── index.html         # フロントエンドページ
├── package.json
├── .env.example           # 環境変数のサンプル
└── README.md
```

## 機能

- Googleスプレッドシートからデータを取得
- テーブル表示とグリッド表示の切り替え
- リアルタイム検索機能
- レスポンシブデザイン
- データの自動更新

## API エンドポイント

### GET /api/sheets

Googleスプレッドシートからデータを取得します。

**URLパラメータ（オプション）:**
- `sheet_id`: スプレッドシートID（環境変数より優先）
- `range`: 読み取り範囲（デフォルト: Sheet1!A:Z）
- `csv`: `true`にするとCSVエクスポートを強制使用
- `gid`: シートのID（CSVモードで複数シートがある場合、デフォルト: 0）

**使用例:**

```bash
# 環境変数を使用
GET /api/sheets

# URLパラメータで指定
GET /api/sheets?sheet_id=YOUR_SHEET_ID

# CSVモードを強制
GET /api/sheets?csv=true&gid=0
```

**レスポンス例:**

```json
{
  "data": [
    {
      "Name": "John Doe",
      "Email": "john@example.com",
      "Age": "30"
    }
  ],
  "total": 1,
  "method": "csv"
}
```

## トラブルシューティング

### APIキーが機能しない場合

1. Google Sheets APIが有効になっているか確認
2. APIキーの制限を確認（IPアドレスやHTTPリファラーの制限を一時的に解除）

### スプレッドシートが読み込めない場合

1. スプレッドシートの共有設定を確認
2. SPREADSHEET_IDが正しいか確認
3. SHEET_RANGEが正しいか確認
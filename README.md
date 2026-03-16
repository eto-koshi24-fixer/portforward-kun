# portforward-kun (ポートフォワード管理くん)

AWS SSM経由のRDSポートフォワーディングをGUIで管理するデスクトップアプリ。
複数環境(dev/stg/prod)のRDSへの接続をワンクリックで確立・管理できます。
Electron でパッケージングされた `.exe` を配布でき、利用者は開発環境不要で使えます。

![メイン画面](docs/images/main-screen.png)

## 主な機能

- **トンネル管理** — SSMポートフォワーディングの接続・切断をワンクリックで操作
- **マルチ環境対応** — public(直接接続) / private(SSM経由) を環境ごとに切り替え
- **接続テスト** — AWS CLI → SSO → Bastion → RDS の4ステップ検証
- **マルチSSM接続** — 1つのDBに対して複数ポートフォワードを同時起動
- **設定管理** — 環境・DB・接続情報をGUIから編集
- **リアルタイムログ** — バックエンド操作のログをアプリ上で確認

| 接続情報の編集 | 接続テスト |
|:---:|:---:|
| ![接続情報の編集](docs/images/connection-edit.png) | ![接続テスト](docs/images/connection-test.png) |

## 利用者向け（配布版 .exe）

### 前提条件

- Windows 10/11 (x64)
- AWS CLI v2
- AWS SSO 設定済み

### 使い方

1. GitHub Releases から zip をダウンロードして展開
2. `portforward-kun.exe` の隣にある `db_env_config.json` を自分の環境に合わせて編集（SSO URL、アカウントID、RDSホスト、パスワード等）
3. `portforward-kun.exe` を起動

## 開発者向け（ソースから起動）

### 前提条件

- AWS CLI v2
- AWS SSO 設定済み
- Python 3.10+
- Node.js 18+
- pnpm

### クイックスタート

#### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-org>/portforward-kun.git
cd portforward-kun
```

#### 2. 設定ファイルを準備

```bash
cp db_env_config.example.json db_env_config.json
```

`db_env_config.json` を開いて、自分の環境に合わせて編集してください。

#### 3. 起動

**ワンクリック起動（Windows）:**

`start.bat` をダブルクリック。初回は依存パッケージのインストールも自動で行います。

**手動起動:**

```bash
# バックエンド
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 18080

# フロントエンド（別ターミナル）
cd frontend
pnpm install
pnpm dev
```

ブラウザで http://localhost:18081 にアクセス。

#### 停止

`stop.bat` をダブルクリック、または各ターミナルで `Ctrl+C`。

## デスクトップアプリ (Electron)

ブラウザを使わず、単体のデスクトップアプリ (.exe) としてパッケージングできます。

### 前提条件（ビルド時のみ）

開発マシンに以下が必要です（利用者側は不要）。

- Node.js 18+ / npm
- pnpm
- Python 3.10+ / pip
- PyInstaller (`pip install pyinstaller`)

### ビルド手順

**ワンクリックビルド:**

`build-desktop.bat` をダブルクリック。以下を自動で実行します。

**手動ビルド:**

```bash
# 1. Electron 依存パッケージをインストール
npm install

# 2. フロントエンドを静的エクスポート
cd frontend
pnpm install
set ELECTRON_BUILD=1
set NEXT_PUBLIC_API_BASE=http://localhost:18080
npx next build
cd ..

# 3. バックエンドを .exe にバンドル
pip install pyinstaller
pyinstaller --noconfirm --clean --distpath dist/backend backend_entry.py

# 4. Electron でパッケージング
npx electron-builder --win --dir
```

### 出力

`release/win-unpacked/` に以下の構成で出力されます。

```
release/win-unpacked/
├── portforward-kun.exe          ← 起動ファイル
├── resources/
│   ├── frontend/                # 静的 HTML/CSS/JS
│   ├── backend/                 # Python バックエンド (.exe)
│   └── db_env_config.example.json
└── db_env_config.json           ← 初回起動時に example からコピー
```

### 配布

`release/win-unpacked/` フォルダを zip で固めて GitHub Releases にアップロードします。

```bash
git tag v1.0.0
git push origin v1.0.0
gh release create v1.0.0 ./portforward-kun-v1.0.0-win-x64.zip \
  --title "v1.0.0" --notes "リリースノート"
```

利用者は zip をダウンロード → 展開 → `portforward-kun.exe` を起動するだけです。
`db_env_config.json` を自分の環境に合わせて編集してください。

### 仕組み

| コンポーネント | 役割 |
|---------------|------|
| `electron/main.js` | Electron メインプロセス。バックエンド起動・ウィンドウ管理 |
| `backend_entry.py` | PyInstaller 用エントリポイント |
| `electron-builder.yml` | パッケージング設定 |
| `build-desktop.bat` | ワンクリックビルドスクリプト |

- Electron がウィンドウを提供し、カスタムプロトコル `app://` でフロントエンドの静的ファイルを配信
- Python バックエンドは Electron の子プロセスとして自動起動・終了
- `PORTFORWARD_DATA_DIR` 環境変数で設定ファイルの場所を制御（.exe と同じフォルダ）
- フロントエンドは `ELECTRON_BUILD=1` で Next.js の静的エクスポート、`NEXT_PUBLIC_API_BASE` でバックエンドの直接アクセスに切り替え

### 開発モードで Electron を起動

バックエンド・フロントエンドを通常通り起動した状態で：

```bash
npx electron .
```

ブラウザの代わりに Electron ウィンドウが開きます（DevTools 付き）。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Desktop | Electron / electron-builder |
| Frontend | Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 |
| 状態管理 | Zustand + SWR |
| Backend | Python FastAPI / Uvicorn / PyInstaller |
| インフラ連携 | AWS CLI (subprocess) / SSM / SSO |
| Lint / Format | Biome |

## ディレクトリ構成

```
portforward-kun/
├── frontend/              # Next.js フロントエンド
│   ├── src/
│   │   ├── app/           # App Router (layout, page)
│   │   ├── components/    # UIコンポーネント
│   │   │   ├── ui/        # 汎用プリミティブ (Button, Table, Dialog, etc.)
│   │   │   └── dialogs/   # 各種ダイアログ
│   │   ├── hooks/         # カスタムフック (useConfig, useTunnels, etc.)
│   │   ├── stores/        # Zustand ストア
│   │   └── lib/           # 型定義, APIクライアント
│   └── next.config.ts     # APIプロキシ設定
├── backend/               # Python FastAPI バックエンド
│   ├── core/              # ビジネスロジック
│   │   ├── aws_db_tunnel.py      # AWS SSMトンネル管理
│   │   ├── connection_manager.py # 接続状態管理
│   │   ├── process_manager.py    # プロセス管理
│   │   └── port_validator.py     # ポート検証
│   ├── routers/           # APIルーター
│   └── config/            # 設定管理
├── electron/              # Electron メインプロセス
│   └── main.js            # ウィンドウ管理・バックエンド起動
├── docs/                  # 設計ドキュメント・画像
├── db_env_config.example.json  # 設定ファイルのテンプレート
├── backend_entry.py       # PyInstaller 用エントリポイント
├── electron-builder.yml   # Electron パッケージング設定
├── build-desktop.bat      # デスクトップ版ビルド (Windows)
├── start.bat              # Web版 ワンクリック起動 (Windows)
├── stop.bat               # Web版 ワンクリック停止 (Windows)
└── requirements.txt       # Python依存パッケージ
```

## 設定ファイル (`db_env_config.json`)

| セクション | 内容 |
|-----------|------|
| `Global` | SSO URL、リージョン、DBポート、DBユーザー等 |
| `Envs` | 環境ごとのアクセスタイプ・AWSプロファイル設定 |
| `DbInstances` | 環境ごとのDB一覧（ID、表示名、カテゴリ） |
| `Connections` | 環境×DBごとの接続情報（ホスト、パスワード、ローカルポート） |

詳細は `db_env_config.example.json` を参照してください。

## ライセンス

Private

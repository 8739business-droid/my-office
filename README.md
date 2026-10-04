# my-office

大阪弁の秘書「ショー」が窓口になり、仕事に合わせて部署が増えていく、Claude Code 用の仮想オフィスプラグインです。

- `/sho` で話しかけるだけ。TODO・メモ・壁打ちは、ショーがその場で受け持ちます
- 同じ種類の依頼が続くと、ショーが部署を提案します(例: リサーチ部の「ミオ」)
- 記録はすべて、カレントディレクトリの `my-office/` フォルダに Markdown で残ります

マニュアル: https://8739business-droid.github.io/my-office/

## インストール

Claude Code の中で、次の2行を実行します。

```
/plugin marketplace add 8739business-droid/my-office
/plugin install my-office@my-office-marketplace
```

## 使い方

### 初回セットアップ

オフィスを置きたいフォルダで Claude Code を起動し、`/sho` を実行します。
ショーが4つの質問(事業・活動、目標・困りごと、よく扱う仕事、ダッシュボードを使うか)をしたあと、秘書室を作ります。

```
my-office/
├── CLAUDE.md
└── secretary/
    ├── CLAUDE.md
    ├── inbox/
    ├── todos/
    │   └── YYYY-MM-DD.md
    └── notes/
```

### 毎日の使い方

| 話しかけ方の例 | ショーがすること |
|---|---|
| 「明日までに LP のワイヤー、TODO に入れといて」 | 今日の TODO に追加 |
| 「メモ: 料金プランは3段階がよさそう」 | Inbox に時刻つきで記録 |
| 「アプリ名、ちょっと壁打ちしたい」 | 一緒に考えて、まとまったら notes/ に保存 |
| 「今日やること」 | 今日の TODO を表示 |
| 「ダッシュボード」 | 件数のまとめをテキストで表示 |

その日最初に話しかけると、前回のやり残し TODO を引き継ぐか聞いてくれます。

### 部署が増える

部署がまだない種類の依頼が2回続くと、ショーが部署を提案します。
「〇〇部門を作って」と頼めば、すぐに作ります。

## 部署一覧

| 部署 | フォルダ | 担当の名前の例 | 主なサブフォルダ |
|---|---|---|---|
| 秘書室(常設) | secretary | ショー | inbox/, todos/, notes/ |
| PM | pm | ケンタ | projects/, tickets/ |
| リサーチ | research | ミオ | topics/ |
| マーケティング | marketing | ハナ | content-plan/, campaigns/ |
| 開発 | engineering | リク | docs/, debug-log/ |
| 経理 | finance | ツムギ | invoices/, expenses/ |
| 営業 | sales | ダイキ | clients/, proposals/ |
| クリエイティブ | creative | アオイ | briefs/, assets/ |
| 人事 | hr | ナギ | hiring/ |

一覧にない部署も、汎用のひな形で作れます。

## ファイル構成(このリポジトリ)

```
.
├── .claude-plugin/
│   └── marketplace.json          # マーケットプレイスの定義
├── plugins/my-office/
│   ├── .claude-plugin/
│   │   └── plugin.json           # プラグインの定義
│   └── skills/sho/
│       ├── SKILL.md              # 秘書ショーの振る舞い
│       └── references/
│           ├── departments.md        # 部署のひな形
│           └── claude-md-template.md # 組織 CLAUDE.md のひな形
├── packages/dashboard/           # ブラウザ版ダッシュボード(別パッケージ)
├── docs/                         # マニュアルサイト(VitePress)
└── tests/                        # 定義ファイルのテスト(vitest)
```

## 開発

```bash
npm install
npm test            # 定義ファイルのテスト
npm run docs:dev    # マニュアルをローカルで表示
```

プラグインを手元で試すときは、空のフォルダで次のように起動します。

```bash
claude --plugin-dir /path/to/my-office/plugins/my-office
```

## クレジット

my-office は、[cc-company](https://github.com/Shin-sibainu/cc-company)(作者: Shin-sibainu、MIT License)の
仕組み・フォルダ構成・書式を参考に作りました。文章は my-office 用に書き直しています。

cc-company の著作権表示:

```
MIT License
Copyright (c) 2026 (cc-company, https://github.com/Shin-sibainu/cc-company)
```

## ライセンス

[MIT](./LICENSE)

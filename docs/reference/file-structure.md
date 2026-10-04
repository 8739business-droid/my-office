# ファイル構成

## 生成されるオフィス

### 初回セットアップ直後

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

### 部署が増えたあと(例)

```
my-office/
├── CLAUDE.md                  ← 組織図と部署一覧の表が更新される
├── _assets/                   ← 担当キャラクターの画像(任意)
│   └── research.png
├── secretary/
│   ├── CLAUDE.md
│   ├── inbox/2026-10-04.md
│   ├── todos/2026-10-04.md
│   └── notes/
│       ├── 2026-10-04-decisions.md
│       ├── department-proposals.md
│       └── saas-pricing-benchmark.md   ← status: moved(部署へ移動済み)
└── research/
    ├── CLAUDE.md
    ├── _template.md
    └── topics/
        ├── _template.md
        └── saas-pricing-benchmark.md
```

## ファイル名のルール

| 種類 | 形 | 例 |
|---|---|---|
| 日次のファイル | `YYYY-MM-DD.md` | `todos/2026-10-04.md` |
| トピックのファイル | `kebab-case.md` | `notes/app-name-ideas.md` |
| 意思決定ログ | `YYYY-MM-DD-decisions.md` | `notes/2026-10-04-decisions.md` |
| 学び・気づき | `YYYY-MM-DD-learnings.md` | `notes/2026-10-04-learnings.md` |
| ひな形 | `_template.md` | `research/topics/_template.md` |

名前が `_` で始まるファイルとフォルダは、ひな形や素材の置き場です。ダッシュボードの集計には入りません。

## 決まった書式

ダッシュボードが読み取るため、次の書式は変わりません。

### TODO

```markdown
## 最優先
- [ ] タスク内容 | 優先度: 高 | 期限: 2026-10-05

## 通常
- [ ] 前回からの引き継ぎ | 優先度: 通常 | 繰越: 2026-10-03

## 余裕があれば

## 完了
- [x] 完了タスク | 完了: 2026-10-04

## メモ・振り返り
```

- 期限が決まっていなければ `| 期限: …` は書きません

### Inbox

```markdown
- **14:30** | 内容
```

### 部署の CLAUDE.md

```markdown
# リサーチ

## 役割
市場・競合・技術を調べて、判断に使える形にまとめる。

## 担当
ミオ
```

### 部署の提案メモ(secretary/notes/department-proposals.md)

```markdown
## 依頼の記録
- 2026-10-04 23:10 | research | 競合SaaSの料金を調べた

## 提案の記録
- 2026-10-04 23:17 | research | 提案 → 作成(担当: ミオ)
```

### 進行状況

各ファイルの先頭の設定欄に、英語の `status` で書きます。

```markdown
---
created: "2026-10-04"
type: research
status: in-progress
---
```

## プラグインのリポジトリ

```
.
├── .claude-plugin/marketplace.json
├── plugins/my-office/
│   ├── .claude-plugin/plugin.json
│   └── skills/sho/
│       ├── SKILL.md
│       └── references/
│           ├── departments.md
│           └── claude-md-template.md
├── packages/dashboard/        ← ブラウザ版ダッシュボード
├── docs/                      ← このマニュアル
└── tests/                     ← 定義ファイルのテスト
```

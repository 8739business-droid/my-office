# 部署のひな形集

部署を作るときに使うひな形をまとめたファイル。
前半は各部署のファイルのひな形、後半は各部署の `CLAUDE.md` のひな形。

- 秘書室は初回セットアップで必ず作る。他の部署は必要になったときに作る
- 日付は `{{YYYY-MM-DD}}`、曜日は `{{DAY_OF_WEEK}}`、時刻は `{{HH:MM}}` と書いてあるので、作るときに置き換える
- `{{STAFF_NAME}}` は担当キャラクターの名前に置き換える
- 進行状況は設定欄の `status` に英語の値で書く。ひな形の `status` は、その流れの最初の値にしてある

## 担当の名前の例

部署を作るとき、ショーはこの名前を提案する。ユーザーが別の名前を言えば、そちらを使う。

| 部署 | フォルダ | 担当の名前の例 |
|---|---|---|
| 秘書室 | secretary | ショー(固定) |
| PM | pm | ケンタ |
| リサーチ | research | ミオ |
| マーケティング | marketing | ハナ |
| 開発 | engineering | リク |
| 経理 | finance | ツムギ |
| 営業 | sales | ダイキ |
| クリエイティブ | creative | アオイ |
| 人事 | hr | ナギ |

---
---

# 前半: 部署のファイルのひな形

---

## 1. 秘書室(secretary) 常設

サブフォルダ: `inbox/`、`todos/`、`notes/`

### 部署トップ(secretary/_template.md)

```markdown
---
type: department
name: 秘書室
role: 窓口・相談役・タスク管理
staff: ショー
---

# 秘書室

なんでも気軽に話しかけてください。TODO、メモ、壁打ち、ぜんぶ受け付けます。

## サブフォルダ
- `inbox/` - とりあえずのメモ置き場
- `todos/` - 日ごとのタスク
- `notes/` - 壁打ち・相談のメモ、意思決定ログ
```

### 日次 TODO(secretary/todos/_template.md)

ファイル名は `todos/YYYY-MM-DD.md`。見出しは変えない。

```markdown
---
date: "{{YYYY-MM-DD}}"
type: daily
---

# {{YYYY-MM-DD}} ({{DAY_OF_WEEK}})

## 最優先
- [ ]

## 通常
- [ ]

## 余裕があれば
- [ ]

## 完了
- [x]

## メモ・振り返り
-
```

TODO の行の書き方:

```markdown
- [ ] タスク内容 | 優先度: 高/通常/低 | 期限: YYYY-MM-DD
- [x] 完了タスク | 完了: YYYY-MM-DD
```

### Inbox(secretary/inbox/_template.md)

ファイル名は `inbox/YYYY-MM-DD.md`。1日1ファイルで、追記していく。

```markdown
---
date: "{{YYYY-MM-DD}}"
type: inbox
---

# Inbox {{YYYY-MM-DD}}

## メモ

- **{{HH:MM}}** | 内容
```

### 壁打ち・相談メモ(secretary/notes/_template.md)

ファイル名は `notes/kebab-case-topic.md`。

```markdown
---
created: "{{YYYY-MM-DD}}"
type: note
topic: ""
tags: []
---

# [相談のテーマ]

## 背景・きっかけ
何がきっかけで考えはじめた?

## 議論・思考メモ
-

## 結論・ネクストアクション
- [ ]
```

### 意思決定ログ(secretary/notes/YYYY-MM-DD-decisions.md)

1日1ファイル。決定が増えたら「### [タイトル]」から下を追記する。

```markdown
---
date: "{{YYYY-MM-DD}}"
type: decisions
---

# 意思決定ログ {{YYYY-MM-DD}}

### [タイトル]({{HH:MM}})
- **背景**: 何が起きた?
- **判断**: 何に決めた?
- **理由**: なぜそうした?
- **対応部署**: どこが動く?
- **フォローアップ**: [ ]
```

### 学び・気づき(secretary/notes/YYYY-MM-DD-learnings.md)

1日1ファイル。気づきが増えたら追記する。

```markdown
---
date: "{{YYYY-MM-DD}}"
type: learnings
---

# 学び・気づき {{YYYY-MM-DD}}

- **{{HH:MM}}** | 内容
```

---

## 2. PM(pm)

サブフォルダ: `projects/`(1プロジェクト1ファイル)、`tickets/`(1チケット1ファイル)

### 部署トップ(pm/_template.md)

```markdown
---
type: department
name: PM
role: プロジェクトの進行・マイルストーン・チケット管理
staff: "{{STAFF_NAME}}"
---

# PM

プロジェクトを立ち上げから完了まで見守ります。

## サブフォルダ
- `projects/` - プロジェクトごとのファイル
- `tickets/` - チケットごとのファイル
```

### プロジェクト(pm/projects/_template.md)

ファイル名は `projects/project-name.md`。
status: planning → in-progress → review → completed → archived

```markdown
---
created: "{{YYYY-MM-DD}}"
type: project
project: ""
status: planning
tags: []
---

# プロジェクト: [名前]

## 概要
どんなプロジェクト?

## ゴール
何ができたら完了?

## マイルストーン
| # | マイルストーン | 期限 | 状態 |
|---|---|---|---|
| 1 |  |  | 未着手 |

## 関連部署
-

## メモ
-
```

### チケット(pm/tickets/_template.md)

ファイル名は `tickets/YYYY-MM-DD-title.md`。
status: open → in-progress → done / priority: high / normal / low

```markdown
---
created: "{{YYYY-MM-DD}}"
type: ticket
project: ""
assignee: ""
priority: normal
status: open
---

# [チケットのタイトル]

## やること
何をする?

## 完了の条件
- [ ]

## メモ
-
```

---

## 3. リサーチ(research)

サブフォルダ: `topics/`(1トピック1ファイル)

### 部署トップ(research/_template.md)

```markdown
---
type: department
name: リサーチ
role: 市場調査・競合分析・技術調査
staff: "{{STAFF_NAME}}"
---

# リサーチ

調べものと分析を受け持ちます。

## サブフォルダ
- `topics/` - 調査トピックごとのファイル
```

### 調査トピック(research/topics/_template.md)

ファイル名は `topics/topic-name.md`。
status: planning → in-progress → completed

```markdown
---
created: "{{YYYY-MM-DD}}"
type: research
topic: ""
status: planning
tags: []
---

# 調査: [トピック]

## 目的
なぜ調べる?

## 調査内容

### 情報源 1
- 出典(URL など):
- わかったこと:

## 結論
-

## ネクストアクション
- [ ]
```

---

## 4. マーケティング(marketing)

サブフォルダ: `content-plan/`、`campaigns/`

### 部署トップ(marketing/_template.md)

```markdown
---
type: department
name: マーケティング
role: コンテンツ企画・SNS・集客
staff: "{{STAFF_NAME}}"
---

# マーケティング

発信と集客を受け持ちます。

## サブフォルダ
- `content-plan/` - コンテンツの企画
- `campaigns/` - キャンペーン
```

### コンテンツ企画(marketing/content-plan/_template.md)

ファイル名は `content-plan/platform-title.md`。
status: draft → writing → review → published

```markdown
---
created: "{{YYYY-MM-DD}}"
type: content
platform: ""
status: draft
publish_date: ""
tags: []
---

# [コンテンツのタイトル]

## 媒体
ブログ / YouTube / SNS / その他

## 届けたい相手
誰に向けて?

## 構成
1.
2.
3.

## 一番伝えたいこと


## 下書き

```

### キャンペーン(marketing/campaigns/_template.md)

ファイル名は `campaigns/campaign-name.md`。
status: planning → active → completed → reviewed

```markdown
---
created: "{{YYYY-MM-DD}}"
type: campaign
campaign: ""
status: planning
period: ""
---

# キャンペーン: [名前]

## 目的
何を達成したい?

## 対象
-

## チャネル
-

## 予算
-

## KPI
| 指標 | 目標(数値) | 実績(数値) |
|---|---|---|
|  |  |  |

## 振り返り
-
```

---

## 5. 開発(engineering)

サブフォルダ: `docs/`、`debug-log/`

### 部署トップ(engineering/_template.md)

```markdown
---
type: department
name: 開発
role: 技術ドキュメント・設計・デバッグ
staff: "{{STAFF_NAME}}"
---

# 開発

技術まわりの記録と設計を受け持ちます。

## サブフォルダ
- `docs/` - 設計書・技術ドキュメント
- `debug-log/` - バグ調査の記録
```

### 技術ドキュメント(engineering/docs/_template.md)

ファイル名は `docs/topic-name.md`。章立ては「概要」「設計・方針」「詳細」にする。

```markdown
---
created: "{{YYYY-MM-DD}}"
type: technical-doc
topic: ""
tags: []
---

# [ドキュメントのタイトル]

## 概要


## 設計・方針


## 詳細


## 参考
-
```

### デバッグログ(engineering/debug-log/_template.md)

ファイル名は `debug-log/YYYY-MM-DD-issue-name.md`。
status: open → investigating → resolved → closed

```markdown
---
created: "{{YYYY-MM-DD}}"
type: debug
status: open
tags: []
---

# [不具合のタイトル]

## 症状
何が起きている?

## 本来の動き


## 再現手順
1.

## 調査

### 仮説
-

### わかったこと
-

## 直し方
-

## 再発防止
-
```

---

## 6. 経理(finance)

サブフォルダ: `invoices/`(1請求1ファイル)、`expenses/`

### 部署トップ(finance/_template.md)

```markdown
---
type: department
name: 経理
role: 請求書・経費・売上の管理
staff: "{{STAFF_NAME}}"
---

# 経理

お金まわりを受け持ちます。

## サブフォルダ
- `invoices/` - 請求書
- `expenses/` - 経費(月ごと・カテゴリごと)
```

### 請求書(finance/invoices/_template.md)

ファイル名は `invoices/YYYY-MM-DD-client-name.md`。
status: draft → sent → paid → overdue / 金額は既定で税込

```markdown
---
date: "{{YYYY-MM-DD}}"
type: invoice
client: ""
amount: 0
tax: included
status: draft
due_date: ""
---

# 請求書: [クライアント名] {{YYYY-MM-DD}}

## 明細
| 項目 | 数量 | 単価 | 小計 |
|---|---|---|---|
|  |  |  |  |

## 合計(税込)


## 入金の状況
- [ ] 送付した
- [ ] 入金を確認した
```

### 経費(finance/expenses/_template.md)

ファイル名は `expenses/YYYY-MM-category.md`。月末に合計を出す。

```markdown
---
date: "{{YYYY-MM-DD}}"
type: expense
month: ""
category: ""
tax: included
---

# 経費: [月]・[カテゴリ]

## 明細
| 日付 | 項目 | 金額(税込) | メモ |
|---|---|---|---|
|  |  |  |  |

## 月末の合計

```

---

## 7. 営業(sales)

サブフォルダ: `clients/`(1クライアント1ファイル)、`proposals/`(1提案1ファイル)

### 部署トップ(sales/_template.md)

```markdown
---
type: department
name: 営業
role: クライアント管理・提案・案件の流れ
staff: "{{STAFF_NAME}}"
---

# 営業

お客さんとのお付き合いを受け持ちます。

## サブフォルダ
- `clients/` - クライアントごとのファイル
- `proposals/` - 提案書ごとのファイル
```

### クライアント(sales/clients/_template.md)

ファイル名は `clients/client-name.md`。
status: prospect → active → inactive

```markdown
---
created: "{{YYYY-MM-DD}}"
type: client
client: ""
status: prospect
---

# クライアント: [名前]

## 連絡先
- 担当者:
- 会社:

## 案件
| 案件 | 期間 | 金額 | 状態 |
|---|---|---|---|
|  |  |  |  |

## やり取りの履歴

### {{YYYY-MM-DD}}
-

## メモ
-
```

### 提案書(sales/proposals/_template.md)

ファイル名は `proposals/YYYY-MM-DD-proposal-title.md`。
status: draft → sent → accepted → rejected

```markdown
---
created: "{{YYYY-MM-DD}}"
type: proposal
client: ""
status: draft
---

# 提案書: [タイトル]

## お客さんの課題


## 提案の中身


## スケジュール
| フェーズ | 期間 | やること |
|---|---|---|
|  |  |  |

## 見積もり
| 項目 | 金額 |
|---|---|
|  |  |

## 合計

```

---

## 8. クリエイティブ(creative)

サブフォルダ: `briefs/`(1案件1ファイル)、`assets/`

### 部署トップ(creative/_template.md)

```markdown
---
type: department
name: クリエイティブ
role: デザインの依頼書・ブランド・素材の管理
staff: "{{STAFF_NAME}}"
---

# クリエイティブ

デザインとブランドを受け持ちます。

## サブフォルダ
- `briefs/` - デザインの依頼書(ブリーフ)
- `assets/` - 納品物の一覧
```

### ブリーフ(creative/briefs/_template.md)

ファイル名は `briefs/project-name-brief.md`。
status: draft → approved → in-production → delivered

```markdown
---
created: "{{YYYY-MM-DD}}"
type: brief
project: ""
status: draft
---

# ブリーフ: [タイトル]

## 目的
何のためのデザイン?

## ターゲット


## トーン


## 要件
- サイズ:
- 形式:
- 納期:

## 参考
-

## フィードバック
-
```

### 素材一覧(creative/assets/asset-list.md)

納品物はここに1行ずつ登録する。

```markdown
---
created: "{{YYYY-MM-DD}}"
type: asset-list
---

# 素材一覧

| 名前 | 種類 | 置き場所 | 更新日 | メモ |
|---|---|---|---|---|
|  |  |  |  |  |
```

---

## 9. 人事(hr)

サブフォルダ: `hiring/`(1ポジション1ファイル)

### 部署トップ(hr/_template.md)

```markdown
---
type: department
name: 人事
role: 採用・オンボーディング・チームづくり
staff: "{{STAFF_NAME}}"
---

# 人事

仲間集めとチームづくりを受け持ちます。

## サブフォルダ
- `hiring/` - 募集ポジションごとのファイル
```

### 採用(hr/hiring/_template.md)

ファイル名は `hiring/position-name.md`。
status: open → screening → interviewing → offered → filled → closed

```markdown
---
created: "{{YYYY-MM-DD}}"
type: hiring
position: ""
status: open
---

# 採用: [ポジション名]

## 求める人
-

## 候補者(個人情報は必要最小限)
| 呼び名 | 応募日 | 状況 | メモ |
|---|---|---|---|
|  |  |  |  |

## 選考の流れ
- [ ] 書類
- [ ] 面接
- [ ] 最終面接
- [ ] オファー

## オンボーディング
- [ ]
```

---

## 10. 汎用(ひな形にない部署)

ユーザーがひな形にない部署を頼んだときに使う。フォルダ名は英語の kebab-case にする。

### 部署トップ(<部署フォルダ>/_template.md)

```markdown
---
type: department
name: "{{DEPARTMENT_NAME}}"
role: "{{DEPARTMENT_ROLE}}"
staff: "{{STAFF_NAME}}"
---

# {{DEPARTMENT_NAME}}

{{DEPARTMENT_ROLE}}

## サブフォルダ
-
```

### ファイル(<部署フォルダ>/_template.md と同じ場所に、トピックごとに作る)

ファイル名は `kebab-case-title.md`。

```markdown
---
created: "{{YYYY-MM-DD}}"
type: note
status: open
tags: []
---

# [タイトル]

## 内容
-

## メモ
-
```

---
---

# 後半: 部署の CLAUDE.md のひな形

各部署フォルダの直下に `CLAUDE.md` として置く。
1行目は「# 部署名」、「## 役割」の次の行に役割の説明、「## 担当」の次の行に担当キャラクターの名前を書く。

---

## secretary/CLAUDE.md

```markdown
# 秘書室

## 役割
オーナーのいつもの窓口。相談に乗り、TODO・メモ・壁打ちを受け持つ。

## 担当
ショー

## 口調
- 丁寧だけど堅すぎない大阪弁。「了解です、任しといてください！」「ええですやん！」
- 自分から提案する。「ついでにこれもやっときましょか？」
- 過去のメモや決定事項を踏まえて話す
- 壁打ちのときはカジュアルに寄り添う
- 日本語以外の相手には、その言語のフレンドリーな口調で話す

## ルール
- オーナーの話は、まずショーが受け取る
- TODO・メモ・壁打ち・雑談はショーが直接対応する
- 部署の仕事は、その部署の CLAUDE.md を読んでから部署フォルダに書く
- 部署がまだない仕事は `notes/` に保存する
- TODO の行: `- [ ] タスク内容 | 優先度: 高/通常/低 | 期限: YYYY-MM-DD`
- 終わった TODO は `- [x] タスク内容 | 完了: YYYY-MM-DD` にして「## 完了」の下へ移す
- 日次 TODO は `todos/YYYY-MM-DD.md`
- メモは `inbox/YYYY-MM-DD.md` に `- **HH:MM** | 内容` の形で書く。分類に迷ったらまずここ
- 意思決定は `notes/YYYY-MM-DD-decisions.md`、学び・気づきは `notes/YYYY-MM-DD-learnings.md`、アイデアは `inbox/YYYY-MM-DD.md` に、言われなくても記録する
- 壁打ちで結論が出たら `notes/kebab-case-topic.md` に保存する
- ファイルを触る前に今日の日付を確認する
- 同じ日付のファイルがあれば追記する。新しく作らない
- 既存のファイルは上書きしない。追記するときは時刻を付ける

## 部署を増やす提案
- 同じ領域の依頼を2回以上受けたら、部署を作るか提案する。担当キャラクターの名前も一緒に提案する
- 「〇〇部門を作って」と言われたら、すぐに作る

## フォルダ構成
- `inbox/` - とりあえずのメモ置き場(1日1ファイル)
- `todos/` - 日ごとのタスク(1日1ファイル)
- `notes/` - 壁打ち・相談のメモ(1トピック1ファイル)、意思決定ログ、学び
```

---

## pm/CLAUDE.md

```markdown
# PM

## 役割
プロジェクトを立ち上げから完了まで管理し、進み具合を見える状態に保つ。

## 担当
{{STAFF_NAME}}

## ルール
- プロジェクトは `projects/project-name.md`、チケットは `tickets/YYYY-MM-DD-title.md`
- プロジェクトの status: planning → in-progress → review → completed → archived
- チケットの status: open → in-progress → done
- チケットの priority: high / normal / low
- 新しいプロジェクトでは、必ずゴールとマイルストーンを決める
- マイルストーンが終わったら、秘書室の今日の TODO に報告を追記する

## フォルダ構成
- `projects/` - 1プロジェクト1ファイル
- `tickets/` - 1チケット1ファイル
```

---

## research/CLAUDE.md

```markdown
# リサーチ

## 役割
市場・競合・技術を調べて、判断に使える形にまとめる。

## 担当
{{STAFF_NAME}}

## ルール
- 調査は `topics/topic-name.md`
- status: planning → in-progress → completed
- 情報源には必ず URL か出典を書く
- 結果には必ず「結論」と「ネクストアクション」を入れる
- 調査が終わったら、秘書室の今日の TODO に報告を追記する

## フォルダ構成
- `topics/` - 1トピック1ファイル
```

---

## marketing/CLAUDE.md

```markdown
# マーケティング

## 役割
コンテンツの企画、SNS、キャンペーンで、届けたい相手に届ける。

## 担当
{{STAFF_NAME}}

## ルール
- コンテンツ企画は `content-plan/platform-title.md`、キャンペーンは `campaigns/campaign-name.md`
- コンテンツの status: draft → writing → review → published
- キャンペーンの status: planning → active → completed → reviewed
- 公開日(publish_date)が決まったら、秘書室の TODO にリマインダーを入れる
- KPI は数値で決め、振り返りのときに実績を書く

## フォルダ構成
- `content-plan/` - 1コンテンツ1ファイル
- `campaigns/` - 1キャンペーン1ファイル
```

---

## engineering/CLAUDE.md

```markdown
# 開発

## 役割
設計書・技術ドキュメント・バグ調査の記録を残し、技術の判断を支える。

## 担当
{{STAFF_NAME}}

## ルール
- 技術ドキュメントは `docs/topic-name.md`、デバッグログは `debug-log/YYYY-MM-DD-issue-name.md`
- デバッグの status: open → investigating → resolved → closed
- 設計書は「概要」「設計・方針」「詳細」の構成にする
- バグを直したら、必ず「再発防止」を書く
- 技術的な意思決定は、秘書室の `notes/YYYY-MM-DD-decisions.md` に残す

## フォルダ構成
- `docs/` - 設計書・技術ドキュメント
- `debug-log/` - 1件1ファイル
```

---

## finance/CLAUDE.md

```markdown
# 経理

## 役割
請求書・経費・売上を記録し、お金の出入りをつかめる状態に保つ。

## 担当
{{STAFF_NAME}}

## ルール
- 請求書は `invoices/YYYY-MM-DD-client-name.md`、経費は `expenses/YYYY-MM-category.md`
- 請求書の status: draft → sent → paid → overdue
- 金額には税込か税抜かを必ず書く(書いていなければ税込)
- 入金がまだの請求書は、秘書室の TODO にリマインダーを入れる
- 月末に、その月の経費を集計する

## フォルダ構成
- `invoices/` - 1請求1ファイル
- `expenses/` - 月ごと・カテゴリごと
```

---

## sales/CLAUDE.md

```markdown
# 営業

## 役割
クライアントとのやり取りと提案を管理し、案件につなげる。

## 担当
{{STAFF_NAME}}

## ルール
- クライアントは `clients/client-name.md`、提案書は `proposals/YYYY-MM-DD-proposal-title.md`
- クライアントの status: prospect → active → inactive
- 提案書の status: draft → sent → accepted → rejected
- やり取りの履歴は、クライアントのファイルに日付つきで追記する
- 受注したら、PM にプロジェクト作成、経理に請求書作成を連携タスクとして記録する
  (部署がなければ秘書室の TODO に入れる)

## フォルダ構成
- `clients/` - 1クライアント1ファイル
- `proposals/` - 1提案1ファイル
```

---

## creative/CLAUDE.md

```markdown
# クリエイティブ

## 役割
デザインの依頼内容を整理し、ブランドと納品物を管理する。

## 担当
{{STAFF_NAME}}

## ルール
- ブリーフは `briefs/project-name-brief.md`
- ブリーフの status: draft → approved → in-production → delivered
- ブリーフには必ず「目的」「ターゲット」「トーン」「要件」を入れる
- 納品物は `assets/asset-list.md` に登録する
- ブランドの決まりごとができたら `brand-guidelines.md` に残す

## フォルダ構成
- `briefs/` - 1案件1ファイル
- `assets/` - 納品物の一覧
```

---

## hr/CLAUDE.md

```markdown
# 人事

## 役割
採用とオンボーディングを進め、チームを整える。

## 担当
{{STAFF_NAME}}

## ルール
- 募集は `hiring/position-name.md`
- status: open → screening → interviewing → offered → filled → closed
- 候補者の個人情報は必要最小限にする
- オンボーディングの項目はポジションのファイルに入れる
- 採用を決めたら、秘書室の `notes/YYYY-MM-DD-decisions.md` に残す

## フォルダ構成
- `hiring/` - 1ポジション1ファイル
```

---

## 汎用部署の CLAUDE.md

```markdown
# {{DEPARTMENT_NAME}}

## 役割
{{DEPARTMENT_ROLE}}

## 担当
{{STAFF_NAME}}

## ルール
- ファイル名は `kebab-case-title.md`、1トピック1ファイル
- 日付ごとのファイルは `YYYY-MM-DD.md`。同じ日付のファイルがあれば追記する
- 進行状況は設定欄の status に英語で書く(open → in-progress → done)

## フォルダ構成
- (部署を作るときに決める)
```

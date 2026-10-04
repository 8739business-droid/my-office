# 部署一覧

部署は秘書室(常設)と、必要に応じて作る8部署です。一覧にない部署も汎用のひな形で作れます。
進行状況は、各ファイルの先頭の設定欄に `status` として英語で書かれます。

## 秘書室(secretary) 常設

- **担当**: ショー
- **役割**: いつもの窓口。TODO・メモ・壁打ちを受け持ち、仕事を部署へ振り分ける
- **サブフォルダ**: `inbox/`(メモ)、`todos/`(日次 TODO)、`notes/`(壁打ち・意思決定ログ・学び・部署の提案メモ)

## PM(pm)

- **担当の例**: ケンタ
- **サブフォルダ**: `projects/`(1プロジェクト1ファイル)、`tickets/`(1チケット1ファイル)
- **ファイル名**: `projects/project-name.md`、`tickets/YYYY-MM-DD-title.md`
- **status**: プロジェクト planning → in-progress → review → completed → archived / チケット open → in-progress → done(優先度 high / normal / low)
- **ルール**: 新規プロジェクトには必ずゴールとマイルストーンを決める。マイルストーン完了時は秘書の TODO に報告

## リサーチ(research)

- **担当の例**: ミオ
- **サブフォルダ**: `topics/`(1トピック1ファイル)
- **status**: planning → in-progress → completed
- **ルール**: 情報源には URL か出典。結果には「結論」と「ネクストアクション」。完了時は秘書の TODO に報告

## マーケティング(marketing)

- **担当の例**: ハナ
- **サブフォルダ**: `content-plan/`、`campaigns/`
- **status**: コンテンツ draft → writing → review → published / キャンペーン planning → active → completed → reviewed
- **ルール**: 公開日が決まったら秘書の TODO にリマインダー。KPI は数値で決め、振り返りで実績を記入

## 開発(engineering)

- **担当の例**: リク
- **サブフォルダ**: `docs/`、`debug-log/`
- **ファイル名**: `docs/topic-name.md`、`debug-log/YYYY-MM-DD-issue-name.md`
- **status**: デバッグ open → investigating → resolved → closed
- **ルール**: 設計書は「概要」「設計・方針」「詳細」。バグ修正時は「再発防止」を必ず書く。技術的な意思決定は秘書室の意思決定ログへ

## 経理(finance)

- **担当の例**: ツムギ
- **サブフォルダ**: `invoices/`(1請求1ファイル)、`expenses/`
- **ファイル名**: `invoices/YYYY-MM-DD-client-name.md`、`expenses/YYYY-MM-category.md`
- **status**: 請求書 draft → sent → paid → overdue
- **ルール**: 金額は税込・税抜を明記(既定は税込)。未入金は秘書の TODO にリマインダー。月末に経費を集計

## 営業(sales)

- **担当の例**: ダイキ
- **サブフォルダ**: `clients/`(1クライアント1ファイル)、`proposals/`(1提案1ファイル)
- **status**: クライアント prospect → active → inactive / 提案書 draft → sent → accepted → rejected
- **ルール**: やり取りの履歴はクライアントのファイルに日付つきで追記。受注時は PM にプロジェクト作成、経理に請求書作成を連携

## クリエイティブ(creative)

- **担当の例**: アオイ
- **サブフォルダ**: `briefs/`(1案件1ファイル)、`assets/`
- **status**: ブリーフ draft → approved → in-production → delivered
- **ルール**: ブリーフには「目的」「ターゲット」「トーン」「要件」。納品物は `assets/asset-list.md` に登録

## 人事(hr)

- **担当の例**: ナギ
- **サブフォルダ**: `hiring/`(1ポジション1ファイル)
- **status**: open → screening → interviewing → offered → filled → closed
- **ルール**: 候補者の個人情報は必要最小限。採用決定は秘書室の意思決定ログへ

## 汎用(一覧にない部署)

- 「〇〇部門を作って」で作れます。フォルダ名は英語の kebab-case(例: 動画部 → `video`)
- 部署トップ、ファイル、`CLAUDE.md` の最小限のひな形が使われます
- **status**: open → in-progress → done

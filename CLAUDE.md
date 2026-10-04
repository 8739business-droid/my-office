# my-office 開発メモ

> **重要な決定やルールは随時ここへ追記する。**

Claude Code 用プラグイン「my-office」のリポジトリ。
秘書「ショー」が窓口になり、必要に応じて部署が増えていく仮想組織を作る。
お手本は [cc-company](https://github.com/Shin-sibainu/cc-company)(MIT)。

## 働き方のルール

- やり取り・コメント・ドキュメントはすべて日本語
- 作業前に必ずプランを提示し、オーナーの承認を得てから実行する
- 不明点は推測で進めず、先にまとめて質問する
- 依存の追加、GitHub や npm への公開操作、破壊的操作は必ず事前に確認する
- 段階ごとに区切り、各段階の終わりに「作ったもの」と「オーナーが動作確認する手順」を報告する
- 決定事項やルールは、指示を待たずにこのファイルへ追記する

## 仕様確認のルール

- プラグインの仕様は記憶で書かず、公式ドキュメント
  (https://code.claude.com/docs/en/plugins/create とそのリンク先)を読んでから設計する
- SKILL.md の先頭の設定欄(frontmatter)には、公式ドキュメントに載っている項目だけを使う
- お手本と公式ドキュメントが食い違う場合は公式を優先し、食い違いをオーナーに報告する

## お手本の扱い

- お手本は `.reference/cc-company/` に clone 済み(`.gitignore` 済み、コミットしない)
- 仕組み、フォルダ構成、書式は忠実に踏襲する
- 文章は丸写しせず、my-office 用に書き直す
- お手本の文章を流用した箇所がある場合は、README にクレジットを書き、MIT の著作権表示を残す
- プラグイン名とコマンド名は cc-company と重ならないものにする
- 作らないもの: 旧バージョンからの移行機能、作者の講座の紹介ページ

## 決定事項(2026-10-04 段階0)

| 項目 | 決定 |
|---|---|
| プラグイン名 | `my-office` |
| スキル名・コマンド | `sho` → `/sho`(正式表記 `/my-office:sho`)。実際の表記は段階2の動作確認で確定する |
| プラグイン名とスキル名 | 当初仕様の「同じにする」から変更し、異なる名前にする(オーナー承認済み) |
| マーケットプレイス名 | `my-office-marketplace` |
| 秘書 | 名前は「ショー」。日本語には大阪弁、日本語以外にはその言語のフレンドリーな口調。丁寧で親しみやすく |
| 組織フォルダ | `my-office/`(先頭に点を付けない) |
| 初回の質問 | ① 事業・活動 ② 目標・困りごと ③ よく扱う仕事の種類。段階7で ④ ダッシュボードを使うか を追加 |
| 部署 | 秘書室 + 8部署(PM、リサーチ、マーケティング、開発、経理、営業、クリエイティブ、人事)。お手本と同じ |
| 部署の担当者 | 各部署にキャラクター名の担当者を置く(例: リサーチ部のミオ)。部署作成時にショーが名前を提案する |
| 見える化 | 段階2の後に HTML モックアップを作る。参考はオーナー提供の画面録画(社長 → CEO → 部署 → 担当者カードの組織図、暗いテーマ)。他者のキャラクター画像は使わない |
| GitHub | `8739business-droid/my-office`(public) |
| 作者表記 | `8739business-droid`(メールアドレスは載せない) |
| ライセンス | MIT |
| マニュアル | 日本語のみ(英語版は作らない) |
| ダッシュボード | npm パッケージ `my-office-dashboard`、既定ポート `8739` |
| 作業場所 | `/Users/masa/my-office` |
| version の置き場所 | `plugin.json` だけに書く。marketplace.json には書かない(validate の警告回避。段階1で承認) |
| status の初期値 | 各ひな形の status は、その流れの最初の値にする(例: 請求書 draft、調査 planning、クライアント prospect) |
| モックアップの見せ方 | 段階2の後、HTML モックアップを claude.ai の Artifact(非公開 URL)で見せる |
| 担当キャラの保存先 | 各部署の CLAUDE.md に `## 担当` 見出しを置き、次の行に名前を書く。組織 CLAUDE.md の部署一覧では役割欄に「(担当: 名前)」を添える |

## 開発環境メモ

- 動作確認中は、cc-company プラグインを無効化している
  (`claude plugin disable company@cc-company`。戻すときは `enable`)

## 公式ドキュメントの確認結果(2026-10-04 段階1、Claude Code 2.1.289)

- SKILL.md の frontmatter で使える項目: name, description, when_to_use, argument-hint, arguments,
  disable-model-invocation, user-invocable, allowed-tools, disallowed-tools, model, effort, context,
  agent, background, hooks, paths, shell, metadata, license, compatibility
  - お手本の `trigger:` は公式に無いので使わない。呼び出しのきっかけになる言葉は `when_to_use` に書く
  - description と when_to_use は合計 1,536 文字まで
- プラグインのスキルは `/プラグイン名:スキル名` と、衝突がなければ `/スキル名` でも呼べる
- スキル内から同梱ファイルを参照するときは `${CLAUDE_SKILL_DIR}/references/...` を使う
  (利用者のカレントディレクトリに左右されないため)
- plugin.json と marketplace.json の両方に version があると plugin.json が優先され、validate が警告を出す
- `claude plugin validate <パス>`: marketplace.json があればそれを、なければ plugin.json を検証する
- `--plugin-dir` にはプラグインのルート(`plugins/my-office`)を渡す
- 予約済みのマーケットプレイス名(claude-plugins-official など)と `my-office-marketplace` は重ならない

## お手本の調査で分かった注意点

- お手本のダッシュボードは、TODO の完了数を「## 完了」見出しの下の行だけで数える。
  完了したタスクは `- [x] … | 完了: YYYY-MM-DD` の形で「完了」見出しの下へ移す運用にする
- お手本は v1 からの移行機能と講座の宣伝ページを持つが、my-office では作らない
- お手本の MCP 接続コマンドは写さない(段階6で公式ドキュメントを確認して書く)
- お手本の LICENSE は `Copyright (c) 2026` のみで著作者名が無い。クレジットでは作者を Shin-sibainu と明記する

## 段階2で確認したこと(2026-10-04)

- コマンドの表記は **`/sho`** に統一する(登録名は `my-office:sho`。`/sho` だけでも呼べることを確認済み)
- `claude -p`(非対話)では AskUserQuestion が使えないため、ショーは文章で質問する。対話モードでは選択式になる
- `.gitignore` の組織フォルダは `/my-office/` と先頭に `/` を付ける(付けないと `plugins/my-office/` まで無視される)
- plugin.json には validate の警告を消すため `author` も入れている

## 見える化モックアップ(2026-10-04)

- URL: https://claude.ai/artifact/L4whQcJvoKJqvZzTCJfmhK(非公開。共有はオーナーが設定)
- オーナーの指示で、提供写真(IMG_0499.jpg)の配置を忠実に再現した。段階7のダッシュボードの「概要」画面はこの配置を目標にする
  - 上部バー(LIVE・時計・数値タイル・24時間グラフ)/ オーナー → ショー → 部署の放射状の線 / 部署見出し(稼働数/全体)と担当カード / フォルダのチップ / 吹き出し / 右の縦並び枠 / 下の流れる活動ログ / 動きを止めるボタン
- 他者のキャラクター画像と人物名は使わない。担当はイニシャルの丸アイコンで表す
- 右の枠(写真では別のAI)は「提案待ちの部署」として使う

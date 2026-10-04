# MCP 連携ガイド

::: tip MCP がなくても完全に動きます
my-office は `my-office/` フォルダのファイルだけで動きます。外部サービスとの連携は、便利にしたいときの追加機能です。
:::

MCP(Model Context Protocol)を使うと、Claude Code から外部のサービスを読み書きできるようになります。
ショーは、次のような場面で連携を提案します。

| 場面 | 提案するサービス |
|---|---|
| 予定・スケジュールの話題 | Google カレンダー |
| ナレッジ整理・ドキュメント管理の話題 | Notion |
| Issue や PR の話題 | GitHub |
| チームへの連絡の話題 | Slack |
| 「連携したい」と言ったとき | 話の内容に合うもの |

断った場合、その会話の中では同じ提案をくり返しません。

## まず確認: claude.ai のコネクタ

claude.ai のアカウントで Claude Code にログインしている場合、
claude.ai の [コネクタ](https://claude.ai/customize/connectors) で追加したサービスは、Claude Code でもそのまま使えます。
すでに追加済みなら、下の作業は不要です。

## 接続方法

2026年10月時点の公式ドキュメントで確認した手順です。手順は変わることがあるので、うまくいかないときは各リンク先を確認してください。

### Notion

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

追加したら Claude Code で `/mcp` を開き、ブラウザで Notion にログインします。
([Notion の公式ガイド](https://developers.notion.com/guides/mcp/))

### GitHub

```bash
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'
```

`YOUR_GITHUB_PAT` を、GitHub で作った個人アクセストークンに置き換えます。
トークンは秘密の値なので、ショーには渡さず、自分でコマンドに入力してください。
([GitHub MCP Server の Claude 向けインストール手順](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md))

### Slack

Claude Code の中で次を実行します。初回にワークスペースへのログインを求められます。

```
/plugin install slack
```

([Slack の公式ガイド](https://docs.slack.dev/ai/slack-mcp-server/connect-to-claude/))

### Google カレンダー

claude.ai の [コネクタ](https://claude.ai/customize/connectors) で Google カレンダーを追加してください。
Claude Code に直接追加する公式のコマンドは確認できなかったため、ここでは載せていません。

## 接続の確認と解除

```bash
claude mcp list            # 接続しているサーバーの一覧
claude mcp remove notion   # 接続を外す(名前は追加したときのもの)
```

詳しくは [Claude Code の MCP ドキュメント](https://code.claude.com/docs/en/mcp) を見てください。

## 連携後のショー

<div class="chat">
  <div class="msg user"><span class="who">あなた</span>来週の予定、空いてるとこある？LPの作業を入れたい</div>
  <div class="msg sho"><span class="who">ショー</span>カレンダー見てみますね。(予定を確認して)水曜の午後が空いてますよ。TODO にも期限つきで入れときましょか？</div>
</div>

- 連携先に書いた内容も、`my-office/` のファイルへの記録は必ず続けます
- 連携先が使えないときも、ファイルへの記録だけで仕事を続けます

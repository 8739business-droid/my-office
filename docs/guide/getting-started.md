# クイックスタート

## 1. インストール

Claude Code を起動し、次の2行を実行します。

```
/plugin marketplace add 8739business-droid/my-office
/plugin install my-office@my-office-marketplace
```

## 2. ショーを呼ぶ

オフィスを置きたいフォルダで Claude Code を起動し、次のコマンドを実行します。

```
/sho
```

`/my-office:sho` と書いても同じです。

## 3. 4つの質問に答える

ショーが1問ずつ質問します。選択肢から選んでも、自由に書いても大丈夫です。

| # | 質問 | 選択肢の例 |
|---|---|---|
| 1 | どんなお仕事や活動をしているか | 個人開発 / フリーランス / 副業 / スタートアップ / 学業 |
| 2 | 今の目標や困りごと | SaaS で月10万円を目指している / タスクが散らかる / アイデアを忘れる |
| 3 | 普段よく扱う仕事(いくつでも) | 企画・プロジェクト管理 / 調べもの・リサーチ / 発信・集客 / 開発・技術 |
| 4 | ブラウザのダッシュボードを使うか | 使う / 今はいい |

<div class="chat">
  <div class="msg sho"><span class="who">ショー</span>まいど！今日からあなたの秘書をやらしてもらう、ショーいいます。よろしゅうお願いします！<br>まずは、どんなお仕事や活動をしてはるか教えてもらえます？</div>
  <div class="msg user"><span class="who">あなた</span>フリーランスのWebエンジニアです</div>
  <div class="msg sho"><span class="who">ショー</span>おおきに！ほな次は、今の目標とか、日々困ってることがあったら聞かせてください。</div>
  <div class="msg user"><span class="who">あなた</span>個人でSaaSを作って月10万円を目指してます。タスクが散らかりがち</div>
  <div class="msg sho"><span class="who">ショー</span>ええ目標ですやん！普段よう扱う仕事はどれに近いです？(いくつ選んでもええですよ)</div>
  <div class="msg user"><span class="who">あなた</span>開発・技術と、調べもの・リサーチです</div>
  <div class="msg sho"><span class="who">ショー</span>最後にひとつだけ。オフィスの様子をブラウザで見渡せるダッシュボードもあるんですけど、使います？</div>
  <div class="msg user"><span class="who">あなた</span>使う</div>
</div>

## 4. 秘書室ができる

答え終わると、カレントディレクトリにこのフォルダができます。

```
my-office/
├── CLAUDE.md              ← オフィス全体のルールと、あなたのプロフィール
└── secretary/
    ├── CLAUDE.md          ← 秘書室のルール
    ├── inbox/             ← メモ置き場
    ├── todos/
    │   └── YYYY-MM-DD.md  ← 今日の TODO
    └── notes/             ← 壁打ち・相談のメモ
```

<div class="chat">
  <div class="msg sho"><span class="who">ショー</span>秘書室の準備、できましたで！<br>これからは /sho でいつでも声かけてください。TODO でもメモでも、ちょっとした相談でも何でもどうぞ！<br>お仕事が進んできたら、「この部署あったら便利ちゃいます？」って、こっちから提案させてもらいますね。<br>ブラウザでオフィスを見渡したいときは、このフォルダで npx my-office-dashboard を実行してください。</div>
</div>

## 次のステップ

- [秘書との日常](./daily-usage) — TODO・メモ・壁打ちの使い方
- [部署を追加する](./adding-departments) — オフィスを大きくする

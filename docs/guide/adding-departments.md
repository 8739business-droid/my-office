# 部署を追加する

最初のオフィスは秘書室だけです。部署は、仕事に合わせてあとから増えていきます。

## ショーからの提案

部署がまだない種類の依頼を受けると、ショーは `secretary/notes/department-proposals.md` に記録します。
同じ種類の依頼が **2回** になると、部署を作るか提案します。前の会話の分も数えます。

<div class="chat">
  <div class="msg user"><span class="who">あなた</span>競合のSaaSの料金を調べて。ざっくりでいい</div>
  <div class="msg sho"><span class="who">ショー</span>ざっくり調べときました！まとめは secretary/notes/saas-pricing-benchmark.md に残しときました。</div>
  <div class="msg user"><span class="who">あなた</span>あと、別の競合のオンボーディングの流れも調べといて</div>
  <div class="msg sho"><span class="who">ショー</span>ほな、オンボーディングの流れも調べときました！<br>ところで、調べものの依頼が2回続いてますね。リサーチ部、作っときましょか？担当は「ミオ」ちゃんでどうです？</div>
  <div class="msg user"><span class="who">あなた</span>リサーチ部門を作って</div>
  <div class="msg sho"><span class="who">ショー</span>リサーチ部、作りましたで！担当は ミオ ちゃんです。</div>
</div>

断った場合も記録に残り、同じ種類の依頼がさらに2回増えるまで、同じ提案はしません。

## 自分から頼む

「〇〇部門を作って」と言えば、提案を待たずにすぐ作ります。
一覧にない部署(例:「動画部を作って」)も、汎用のひな形で作れます。

## 部署ができると

1. `my-office/<部署フォルダ>/` とサブフォルダができる
2. 部署のルールを書いた `CLAUDE.md` が置かれる(担当キャラクターの名前もここに書かれる)
3. `my-office/CLAUDE.md` の組織図と部署一覧の表が更新される
4. それまで秘書室に置いていたその種類のメモが、部署へ書き写される

```
my-office/
├── CLAUDE.md
├── secretary/
└── research/
    ├── CLAUDE.md
    ├── _template.md
    └── topics/
        ├── _template.md
        ├── saas-pricing-benchmark.md
        └── saas-onboarding-patterns.md
```

書き写した元のメモは消さずに残し、先頭の設定欄に `status: moved` と移動先が書き足されます。
ダッシュボードは `status: moved` のファイルを数えないので、二重に数えられることはありません。

## 担当キャラクター

部署を作るとき、ショーが担当の名前を提案します。別の名前がよければ、そう伝えてください。

| 部署 | 担当の名前の例 |
|---|---|
| PM | ケンタ |
| リサーチ | ミオ |
| マーケティング | ハナ |
| 開発 | リク |
| 経理 | ツムギ |
| 営業 | ダイキ |
| クリエイティブ | アオイ |
| 人事 | ナギ |

`my-office/_assets/<部署フォルダ>.png`(`.jpg` `.webp` も可)に画像を置くと、ダッシュボードでその画像がアイコンになります。

## 部署の一覧

各部署のフォルダやルールは [部署一覧](../reference/departments) を見てください。

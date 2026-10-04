// パーサー(書式の読み取り)の単体テスト
import { describe, expect, it } from "vitest";
import {
  firstHeading,
  isActiveStatus,
  isDeliveredStatus,
  isOrgClaudeMd,
  localDateString,
  normalizeDate,
  parseDeptClaudeMd,
  parseFrontmatter,
  parseInbox,
  parseMarkdownFile,
  parseOrgClaudeMd,
  parseProposals,
  parseTodos,
  truncate,
} from "../server/parser.js";

describe("parseTodos", () => {
  const todo = `---
date: "2026-10-04"
type: daily
---

# 2026-10-04 (土)

## 最優先
- [ ] LPのワイヤーを作る | 優先度: 高 | 期限: 2026-10-05 | 繰越: 2026-10-03
- [ ]

## 通常
- [ ] 料金プランを考える | 優先度: 通常 | 期限: 2026-10-10
- [x] 通常の下の [x] は完了に数えない | 完了: 2026-10-04

## 余裕があれば
- [ ] ロゴ | 優先度: 低 | 期限: 2026-10-31

## 完了
- [x] 競合を調べる | 完了: 2026-10-04
- [X] 大文字の X も完了 | 完了: 2026-10-04
- [x]
- [ ] 完了の下の [ ] は未完了に数えない

## メモ・振り返り
- [ ] メモ欄は数えない
-
`;

  it("未完了は3つの見出しの中身のある [ ] だけを数える", () => {
    const r = parseTodos(todo);
    expect(r.openCount).toBe(3);
    expect(r.open.map((i) => i.text)).toEqual(["LPのワイヤーを作る", "料金プランを考える", "ロゴ"]);
  });

  it("完了は「完了」見出しの中身のある [x] だけを数える", () => {
    const r = parseTodos(todo);
    expect(r.doneCount).toBe(2);
    expect(r.done[0]).toMatchObject({ text: "競合を調べる", completedOn: "2026-10-04", section: "完了" });
  });

  it("優先度・期限・繰越を読み取る", () => {
    const [first] = parseTodos(todo).open;
    expect(first).toMatchObject({ priority: "高", due: "2026-10-05", carriedFrom: "2026-10-03", section: "最優先" });
  });

  it("ひな形のままのファイルは 0 件", () => {
    const tpl = "## 最優先\n- [ ]\n\n## 通常\n- [ ]\n\n## 余裕があれば\n- [ ]\n\n## 完了\n- [x]\n\n## メモ・振り返り\n-\n";
    expect(parseTodos(tpl)).toMatchObject({ openCount: 0, doneCount: 0 });
  });

  it("CRLF の改行でも読める", () => {
    const r = parseTodos("## 通常\r\n- [ ] A | 優先度: 高\r\n## 完了\r\n- [x] B | 完了: 2026-10-04\r\n");
    expect(r.openCount).toBe(1);
    expect(r.doneCount).toBe(1);
  });
});

describe("parseInbox", () => {
  it("`- **HH:MM** | 内容` の行だけを数える", () => {
    const items = parseInbox("# Inbox\n\n## メモ\n\n- **09:12** | 料金案\n- **9:05** | 早朝\n- **{{HH:MM}}** | ひな形\n- ただのメモ\n");
    expect(items).toEqual([
      { time: "09:12", text: "料金案" },
      { time: "9:05", text: "早朝" },
    ]);
  });
});

describe("組織の CLAUDE.md", () => {
  const org = "# my-office 仮想オフィス\n\n## オーナープロフィール\n\n- **事業・活動**: 個人開発\n- **目標・課題**: 月10万円\n- **作成日**: 2026-10-01\n";

  it("「## オーナープロフィール」があるものだけを組織とみなす", () => {
    expect(isOrgClaudeMd(org)).toBe(true);
    expect(isOrgClaudeMd("# my-office 開発メモ\n\n## 働き方のルール\n")).toBe(false);
  });

  it("事業・目標・作成日を読む", () => {
    expect(parseOrgClaudeMd(org)).toEqual({ business: "個人開発", goals: "月10万円", created: "2026-10-01" });
  });

  it("ひな形の変数のままなら null", () => {
    expect(parseOrgClaudeMd("- **事業・活動**: {{BUSINESS_TYPE}}\n").business).toBeNull();
  });
});

describe("parseDeptClaudeMd", () => {
  it("1行目・役割・担当を読む", () => {
    const r = parseDeptClaudeMd("# リサーチ\n\n## 役割\n市場を調べる。\n\n## 担当\nミオ\n\n## ルール\n- x\n");
    expect(r).toEqual({ name: "リサーチ", role: "市場を調べる。", staff: "ミオ" });
  });

  it("担当がひな形の変数のままなら null", () => {
    expect(parseDeptClaudeMd("# PM\n\n## 担当\n{{STAFF_NAME}}\n").staff).toBeNull();
  });

  it("見出しが無ければ null", () => {
    expect(parseDeptClaudeMd("# 開発\n")).toEqual({ name: "開発", role: null, staff: null });
  });
});

describe("parseProposals", () => {
  const memo = `---
type: department-proposals
---

# 部署の提案メモ

## 依頼の記録
- {{YYYY-MM-DD}} {{HH:MM}} | 部署フォルダ | 内容
- 2026-10-01 10:00 | research | 競合を調べた
- 2026-10-02 15:30 | creative | ロゴの相談

## 提案の記録
- 2026-10-02 12:00 | research | 提案 → 作成(担当: ミオ)
- 2026-10-03 22:10 | creative | 提案 → 見送り
`;

  it("依頼と提案を分けて読み、ひな形の行は無視する", () => {
    const r = parseProposals(memo);
    expect(r.requests).toHaveLength(2);
    expect(r.requests[0]).toEqual({ date: "2026-10-01", time: "10:00", dept: "research", text: "競合を調べた" });
    expect(r.proposals.map((p) => [p.dept, p.result])).toEqual([
      ["research", "created"],
      ["creative", "declined"],
    ]);
  });
});

describe("設定欄と見出し", () => {
  it("status を小文字にそろえ、日付を文字列にする", () => {
    const r = parseMarkdownFile("---\nstatus: In-Progress\ncreated: 2026-10-03\n---\n\n# 調査: 市場\n");
    expect(r.status).toBe("in-progress");
    expect(r.created).toBe("2026-10-03");
    expect(r.title).toBe("調査: 市場");
  });

  it("created が無ければ date を使う", () => {
    expect(parseMarkdownFile('---\ndate: "2026-10-04"\n---\n# x\n').created).toBe("2026-10-04");
  });

  it("壊れた YAML でも例外を出さない", () => {
    const r = parseFrontmatter("---\nstatus: [壊れ\n---\n# 本文\n");
    expect(r.data).toEqual({});
    expect(firstHeading(r.body)).toBe("本文");
  });

  it("最初の # 見出しだけを拾う(## は拾わない)", () => {
    expect(firstHeading("## 小見出し\n# 大見出し\n# 2つ目\n")).toBe("大見出し");
    expect(firstHeading("見出しなし")).toBeNull();
  });

  it("normalizeDate は Date も文字列も扱う", () => {
    expect(normalizeDate(new Date("2026-10-03T00:00:00Z"))).toBe("2026-10-03");
    expect(normalizeDate("2026-10-03")).toBe("2026-10-03");
    expect(normalizeDate("")).toBeNull();
  });
});

describe("status の分類", () => {
  it("進行中に数えるもの・数えないもの", () => {
    for (const s of ["open", "in-progress", "investigating", "writing", "review", "active", "sent", "in-production", "screening", "interviewing", "offered", "planning"]) {
      expect(isActiveStatus(s), s).toBe(true);
    }
    for (const s of ["completed", "published", "delivered", "paid", "done", "resolved", "closed", "draft", "moved", null, ""]) {
      expect(isActiveStatus(s), String(s)).toBe(false);
    }
  });

  it("納品は completed / published / delivered / paid", () => {
    expect(["completed", "published", "delivered", "paid", "Paid"].every(isDeliveredStatus)).toBe(true);
    expect(isDeliveredStatus("done")).toBe(false);
  });
});

describe("小物", () => {
  it("localDateString はローカル日付", () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("truncate は文字数で省略する", () => {
    expect(truncate("あいうえおかきくけこ", 5)).toBe("あいうえ…");
    expect(truncate("短い", 5)).toBe("短い");
  });
});

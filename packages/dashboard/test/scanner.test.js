// 集計(scanner)とサーバーのテスト。fixtures を一時フォルダに写して、更新時刻をそろえてから調べる。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildDepartmentDetail,
  buildHourly,
  buildOverview,
  buildTree,
  findAsset,
  findOrgDir,
  readOrgFile,
  resolveInside,
  searchFiles,
  stateFromTime,
} from "../server/scanner.js";
import { createApp } from "../server/server.js";

const FIXTURES = path.join(path.dirname(new URL(import.meta.url).pathname), "fixtures");
// 2026-10-04 15:00(ローカル時刻)を「今」とする
const NOW = new Date(2026, 9, 4, 15, 0, 0);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

let tmp;
let orgDir;

function touch(rel, msAgo) {
  const t = new Date(NOW.getTime() - msAgo);
  fs.utimesSync(path.join(orgDir, rel), t, t);
}

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "my-office-dashboard-test-"));
  fs.cpSync(FIXTURES, tmp, { recursive: true });
  orgDir = path.join(tmp, "my-office");
  // まず全部を3日前にしておく
  const all = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else all.push(path.relative(orgDir, p));
    }
  };
  walk(orgDir);
  for (const rel of all) touch(rel, 72 * HOUR);
  // 秘書室: 5分前(稼働中)、リサーチ: 3時間前(最近)、マーケ: 3日前(待機)
  touch("secretary/todos/2026-10-04.md", 5 * MIN);
  touch("secretary/inbox/2026-10-04.md", 2 * HOUR);
  touch("research/topics/market-size.md", 3 * HOUR);
  touch("research/topics/competitor-pricing.md", 5 * HOUR);
  touch("marketing/content-plan/blog-launch.md", 70 * HOUR);
});

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("findOrgDir", () => {
  it("開始位置から親へたどって my-office/ を見つける", () => {
    expect(findOrgDir(tmp)).toBe(orgDir);
    expect(findOrgDir(path.join(orgDir, "research", "topics"))).toBe(orgDir);
  });

  it("「## オーナープロフィール」の無い my-office/ は組織とみなさない", () => {
    const fake = fs.mkdtempSync(path.join(os.tmpdir(), "my-office-fake-"));
    fs.mkdirSync(path.join(fake, "my-office"));
    fs.writeFileSync(path.join(fake, "my-office", "CLAUDE.md"), "# my-office 開発メモ\n");
    try {
      // 親をたどっても一時フォルダの外に組織フォルダは無い前提
      const found = findOrgDir(fake);
      expect(found === null || !found.startsWith(fake)).toBe(true);
    } finally {
      fs.rmSync(fake, { recursive: true, force: true });
    }
  });
});

describe("buildOverview", () => {
  let ov;
  beforeAll(() => {
    ov = buildOverview(orgDir, NOW);
  });

  it("オーナー情報を読む", () => {
    expect(ov.org).toMatchObject({ business: "個人開発(家計簿アプリ)", goals: "SaaSで月10万円を目指している", created: "2026-10-01" });
  });

  it("今日の TODO と Inbox を数える", () => {
    expect(ov.today).toBe("2026-10-04");
    expect(ov.todos.openCount).toBe(3);
    expect(ov.todos.doneCount).toBe(1);
    expect(ov.inbox.count).toBe(2);
  });

  it("部署は秘書室 → 標準部署の順で、_assets は部署にしない", () => {
    expect(ov.departments.map((d) => d.id)).toEqual(["secretary", "research", "marketing"]);
    expect(ov.stats.departmentCount).toBe(3);
  });

  it("CLAUDE.md・_ で始まるもの・status: moved は件数に数えない", () => {
    const sec = ov.departments.find((d) => d.id === "secretary");
    // todos 2件 + inbox 1件 + notes 2件(proposals, decisions)。moved のメモと _template は除く
    expect(sec.fileCount).toBe(5);
    const research = ov.departments.find((d) => d.id === "research");
    expect(research.fileCount).toBe(2);
  });

  it("見出しの a/b: 秘書室は TODO、他は進行中/ファイル数", () => {
    const by = Object.fromEntries(ov.departments.map((d) => [d.id, d.ratio]));
    expect(by.secretary).toMatchObject({ active: 3, total: 4, kind: "todo" });
    expect(by.research).toMatchObject({ active: 1, total: 2 }); // in-progress 1 / 2
    expect(by.marketing).toMatchObject({ active: 1, total: 3 }); // active 1(draft と published は除く)
  });

  it("担当の状態は最終更新で決まる", () => {
    const by = Object.fromEntries(ov.departments.map((d) => [d.id, d.state]));
    expect(by).toEqual({ secretary: "active", research: "recent", marketing: "idle" });
    expect(ov.stats.activeStaff).toBe(1);
  });

  it("担当名・役割は部署の CLAUDE.md から読む", () => {
    const research = ov.departments.find((d) => d.id === "research");
    expect(research).toMatchObject({ name: "リサーチ", staff: "ミオ", role: "市場・競合・技術を調べて、判断に使える形にまとめる。", hasAsset: true });
  });

  it("吹き出しは最後に更新されたファイルの見出し、納品は完了系の最新", () => {
    const research = ov.departments.find((d) => d.id === "research");
    expect(research.bubble).toBe("調査: 家計簿アプリの市場規模");
    expect(research.delivered).toMatchObject({ title: "調査: 競合SaaSの料金", status: "completed" });
    const marketing = ov.departments.find((d) => d.id === "marketing");
    expect(marketing.delivered.title).toBe("リリース告知のブログ");
  });

  it("秘書室のチップは todos → inbox → notes と、意思決定ログ・学び", () => {
    const sec = ov.departments.find((d) => d.id === "secretary");
    expect(sec.chips.map((c) => c.label)).toEqual(["todos/", "inbox/", "notes/", "意思決定ログ", "学び・気づき"]);
    expect(sec.chips[0].state).toBe("active");
  });

  it("提案待ちは未作成の標準部署と、メモにだけ出てくる部署(依頼の多い順)", () => {
    const ids = ov.proposals.pending.map((p) => p.id);
    expect(ids).not.toContain("research");
    expect(ids).not.toContain("marketing");
    expect(ids).not.toContain("secretary");
    expect(ids.slice(0, 2)).toEqual(["creative", "video"]);
    expect(ids).toHaveLength(7); // pm, engineering, finance, sales, creative, hr + video
    const creative = ov.proposals.pending.find((p) => p.id === "creative");
    expect(creative).toMatchObject({ name: "クリエイティブ", staff: "アオイ", requests: 2, lastProposal: { result: "declined" } });
    const video = ov.proposals.pending.find((p) => p.id === "video");
    expect(video).toMatchObject({ custom: true, staff: "(未定)", requests: 1 });
    expect(ov.proposals.lastProposal).toMatchObject({ time: "22:10", dept: "creative" });
  });

  it("活動ログは新しい順で「HH:MM 担当名 → ファイル名 を更新」", () => {
    expect(ov.activity[0]).toMatchObject({ staff: "ショー", file: "2026-10-04.md", time: "14:55" });
    expect(ov.activity[0].text).toBe("14:55 ショー → 2026-10-04.md を更新");
    expect(ov.activity.some((a) => a.file === "competitor-pricing.md" && a.dept === "secretary")).toBe(false);
    expect(ov.activity.length).toBeLessThanOrEqual(20);
  });

  it("24時間の更新回数は24個で、最後が今の時間帯", () => {
    expect(ov.hourly).toHaveLength(24);
    expect(ov.hourly[23].hour).toBe(15);
    expect(ov.hourly[23].count).toBe(0);
    expect(ov.hourly[22].count).toBe(1); // 5分前 = 14時台
    expect(ov.stats.updates24h).toBe(4);
  });
});

describe("部署詳細・ツリー・検索・ファイル", () => {
  it("部署詳細にはファイル一覧が付き、無い部署は null", () => {
    const d = buildDepartmentDetail(orgDir, "research", NOW);
    expect(d.files.map((f) => f.path)).toEqual(["research/topics/market-size.md", "research/topics/competitor-pricing.md"]);
    expect(buildDepartmentDetail(orgDir, "nope", NOW)).toBeNull();
    expect(buildDepartmentDetail(orgDir, "_assets", NOW)).toBeNull();
  });

  it("ツリーには CLAUDE.md と _ で始まるものを出さない", () => {
    const tree = buildTree(orgDir);
    const names = [];
    const walk = (n) => {
      names.push(n.path);
      (n.children || []).forEach(walk);
    };
    walk(tree);
    expect(names).toContain("secretary/todos/2026-10-04.md");
    expect(names.some((p) => p.endsWith("CLAUDE.md"))).toBe(false);
    expect(names.some((p) => p.split("/").some((s) => s.startsWith("_")))).toBe(false);
  });

  it("全文検索は一致行の抜粋つき", () => {
    const r = searchFiles(orgDir, "stripe");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].matches[0].text.toLowerCase()).toContain("stripe");
    expect(searchFiles(orgDir, "")).toEqual([]);
    expect(searchFiles(orgDir, "ひな形の行(数えない)")).toEqual([]); // _template は対象外
  });

  it("組織フォルダの外を指すパスは拒否する", () => {
    expect(resolveInside(orgDir, "../outside.txt")).toBeNull();
    expect(resolveInside(orgDir, "/etc/passwd")).toBeNull();
    expect(resolveInside(orgDir, "")).toBeNull();
    expect(readOrgFile(orgDir, "secretary/../../outside.txt").error).toBe("forbidden");
    const ok = readOrgFile(orgDir, "research/topics/market-size.md");
    expect(ok).toMatchObject({ title: "調査: 家計簿アプリの市場規模", status: "in-progress" });
    expect(ok.frontmatter.created).toBe("2026-10-03");
  });

  it("担当の画像は _assets/<folder>.png などから探す", () => {
    expect(findAsset(orgDir, "research")).toMatch(/research\.png$/);
    expect(findAsset(orgDir, "marketing")).toBeNull();
    expect(findAsset(orgDir, "../secret")).toBeNull();
  });

  it("stateFromTime と buildHourly の境界", () => {
    const now = NOW.getTime();
    expect(stateFromTime(now - 10 * MIN, now)).toBe("active");
    expect(stateFromTime(now - 10 * MIN - 1, now)).toBe("recent");
    expect(stateFromTime(now - 24 * HOUR - 1, now)).toBe("idle");
    expect(stateFromTime(null, now)).toBe("idle");
    const h = buildHourly([{ mtimeMs: now - 23 * HOUR - 1 }, { mtimeMs: now - 30 * MIN }], NOW);
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(1);
  });
});

describe("サーバー", () => {
  let server;
  let base;
  let close;
  beforeAll(async () => {
    const created = createApp(orgDir, { watch: false, distDir: path.join(tmp, "no-dist") });
    close = created.close;
    await new Promise((resolve) => {
      server = created.app.listen(0, "127.0.0.1", resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => {
    await close();
    await new Promise((r) => server.close(r));
  });

  it("各 API が返る", async () => {
    for (const p of ["/api/overview", "/api/tree", "/api/activity", "/api/department/secretary", "/api/search?q=料金"]) {
      const res = await fetch(base + p);
      expect(res.status, p).toBe(200);
    }
  });

  it("外を指す /api/file は 403、無いファイルは 404", async () => {
    expect((await fetch(`${base}/api/file?path=${encodeURIComponent("../outside.txt")}`)).status).toBe(403);
    expect((await fetch(`${base}/api/file?path=${encodeURIComponent("nothing.md")}`)).status).toBe(404);
    expect((await fetch(`${base}/api/file?path=${encodeURIComponent("secretary/todos/2026-10-04.md")}`)).status).toBe(200);
  });

  it("画像は有れば返し、無ければ 404", async () => {
    const ok = await fetch(`${base}/api/asset/research`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toContain("image/png");
    expect((await fetch(`${base}/api/asset/marketing`)).status).toBe(404);
  });

  it("書き込み系のメソッドは受け付けない", async () => {
    expect((await fetch(`${base}/api/overview`, { method: "POST" })).status).toBe(405);
  });
});

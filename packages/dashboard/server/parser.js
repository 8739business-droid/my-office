// my-office の組織フォルダにあるファイルの書式を読み取る、純粋な関数をまとめたもの。
// ファイルシステムには触れない(文字列を受け取り、結果を返すだけ)。
// 書式は plugins/my-office/skills/sho の SKILL.md と references/ に従う。

import matter from "gray-matter";

/** 標準の8部署 + 秘書室(フォルダ名 → 表示名・担当の例) */
export const KNOWN_DEPARTMENTS = [
  { id: "secretary", name: "秘書室", staff: "ショー" },
  { id: "pm", name: "PM", staff: "ケンタ" },
  { id: "research", name: "リサーチ", staff: "ミオ" },
  { id: "marketing", name: "マーケティング", staff: "ハナ" },
  { id: "engineering", name: "開発", staff: "リク" },
  { id: "finance", name: "経理", staff: "ツムギ" },
  { id: "sales", name: "営業", staff: "ダイキ" },
  { id: "creative", name: "クリエイティブ", staff: "アオイ" },
  { id: "hr", name: "人事", staff: "ナギ" },
];

export const KNOWN_BY_ID = Object.fromEntries(KNOWN_DEPARTMENTS.map((d) => [d.id, d]));

/** 「✓ 納品」に使う status */
export const DELIVERED_STATUSES = new Set(["completed", "published", "delivered", "paid"]);

/** 進行中として数えない status(完了系・下書き・移動済み) */
export const NOT_ACTIVE_STATUSES = new Set([
  // 完了系
  "completed",
  "published",
  "delivered",
  "paid",
  "done",
  "resolved",
  "closed",
  "filled",
  "accepted",
  "rejected",
  "reviewed",
  "archived",
  "inactive",
  // 下書き・移動済み
  "draft",
  "moved",
]);

/** 日次 TODO の見出し */
export const TODO_OPEN_SECTIONS = ["最優先", "通常", "余裕があれば"];
export const TODO_DONE_SECTION = "完了";

/** Date をローカル時刻の YYYY-MM-DD にする */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date をローカル時刻の HH:MM にする */
export function localTimeString(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 改行コードをそろえて行に分ける */
function toLines(text) {
  return String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
}

/** 日付らしい値を YYYY-MM-DD の文字列にする(YAML が Date に変換した場合も含む) */
export function normalizeDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // YAML の日付は UTC として解釈されるので、UTC のまま取り出す
    return value.toISOString().slice(0, 10);
  }
  const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/**
 * 設定欄(YAML frontmatter)と本文に分ける。壊れた YAML でも例外を出さない。
 * @returns {{ data: object, body: string }}
 */
export function parseFrontmatter(content) {
  const text = String(content ?? "");
  try {
    // gray-matter はキャッシュを持つので、第2引数で無効にする
    const parsed = matter(text, {});
    return { data: parsed.data || {}, body: parsed.content };
  } catch {
    // 設定欄が壊れているときは、区切りの後ろを本文として扱う
    const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
    return { data: {}, body: m ? m[1] : text };
  }
}

/** status を英語小文字にそろえる。なければ null */
export function normalizeStatus(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  return s === "" ? null : s;
}

/** status が「進行中」に当たるか */
export function isActiveStatus(status) {
  const s = normalizeStatus(status);
  return s != null && !NOT_ACTIVE_STATUSES.has(s);
}

/** status が「納品」に当たるか */
export function isDeliveredStatus(status) {
  const s = normalizeStatus(status);
  return s != null && DELIVERED_STATUSES.has(s);
}

/** 本文の最初の `# ` 見出し。なければ null */
export function firstHeading(body) {
  for (const line of toLines(body)) {
    const m = line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) return m[1].trim();
  }
  return null;
}

/** Markdown ファイルの内容から、集計に使う情報を取り出す */
export function parseMarkdownFile(content) {
  const { data, body } = parseFrontmatter(content);
  return {
    status: normalizeStatus(data.status),
    created: normalizeDate(data.created ?? data.date),
    type: data.type != null ? String(data.type) : null,
    movedTo: data.moved_to != null ? String(data.moved_to) : null,
    title: firstHeading(body),
    data,
    body,
  };
}

/** 「内容 | 優先度: 高 | 期限: …」の欄を分ける */
function splitTodoFields(rest) {
  const parts = rest.split("|").map((p) => p.trim());
  const text = parts.shift() ?? "";
  const fields = {};
  for (const p of parts) {
    const m = p.match(/^([^:：]+)[:：]\s*(.*)$/);
    if (m) fields[m[1].trim()] = m[2].trim();
  }
  return { text, fields };
}

/**
 * 日次 TODO(secretary/todos/YYYY-MM-DD.md)を読む。
 * 未完了 = 「最優先」「通常」「余裕があれば」の下の中身のある `- [ ]`
 * 完了   = 「完了」の下の中身のある `- [x]`
 */
export function parseTodos(content) {
  const { body } = parseFrontmatter(content);
  const items = [];
  let section = null;
  for (const line of toLines(body)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      section = h[1].trim();
      continue;
    }
    const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s?(.*)$/);
    if (!m) continue;
    const checked = m[1].toLowerCase() === "x";
    const rest = m[2].trim();
    if (rest === "") continue; // 中身が空の行は数えない
    const { text, fields } = splitTodoFields(rest);
    if (text === "") continue;
    items.push({
      section,
      checked,
      text,
      priority: fields["優先度"] || null,
      due: fields["期限"] || null,
      carriedFrom: fields["繰越"] || null,
      completedOn: fields["完了"] || null,
    });
  }
  const open = items.filter((i) => !i.checked && TODO_OPEN_SECTIONS.includes(i.section));
  const done = items.filter((i) => i.checked && i.section === TODO_DONE_SECTION);
  return { open, done, openCount: open.length, doneCount: done.length };
}

/** Inbox(secretary/inbox/YYYY-MM-DD.md)の `- **HH:MM** | 内容` 行を読む */
export function parseInbox(content) {
  const items = [];
  for (const line of toLines(content)) {
    const m = line.match(/^\s*[-*]\s+\*\*(\d{1,2}:\d{2})\*\*\s*\|\s*(.*)$/);
    if (m) items.push({ time: m[1], text: m[2].trim() });
  }
  return items;
}

/** 組織の CLAUDE.md か(「## オーナープロフィール」があるか) */
export function isOrgClaudeMd(content) {
  return /^##\s+オーナープロフィール\s*$/m.test(String(content ?? ""));
}

/** 組織の CLAUDE.md からオーナープロフィールを読む */
export function parseOrgClaudeMd(content) {
  const text = String(content ?? "");
  const pick = (label) => {
    const re = new RegExp(`^\\s*-\\s+\\*\\*${label}\\*\\*\\s*[:：]\\s*(.*)$`, "m");
    const m = text.match(re);
    if (!m) return null;
    const v = m[1].trim();
    return v === "" || /^\{\{.*\}\}$/.test(v) ? null : v;
  };
  return {
    business: pick("事業・活動"),
    goals: pick("目標・課題"),
    created: pick("作成日"),
  };
}

/** 見出しの次の、空でない最初の行 */
function lineAfterHeading(lines, heading) {
  const idx = lines.findIndex((l) => l.trim() === heading);
  if (idx === -1) return null;
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "") continue;
    if (t.startsWith("#")) return null;
    return t.replace(/^[-*]\s+/, "");
  }
  return null;
}

/** 部署の CLAUDE.md(1行目 `# 部署名`、`## 役割`、`## 担当`)を読む */
export function parseDeptClaudeMd(content) {
  const lines = toLines(content);
  let name = null;
  for (const l of lines) {
    if (l.trim() === "") continue;
    const m = l.match(/^#\s+(.+?)\s*$/);
    if (m) name = m[1].trim();
    break;
  }
  const clean = (v) => (v == null || /\{\{.*\}\}/.test(v) ? null : v);
  return {
    name: clean(name),
    role: clean(lineAfterHeading(lines, "## 役割")),
    staff: clean(lineAfterHeading(lines, "## 担当")),
  };
}

/**
 * 部署の提案メモ(secretary/notes/department-proposals.md)を読む。
 * 「## 依頼の記録」「## 提案の記録」の `- YYYY-MM-DD HH:MM | 部署フォルダ | 内容` 行。
 */
export function parseProposals(content) {
  const { body } = parseFrontmatter(content);
  const requests = [];
  const proposals = [];
  let section = null;
  for (const line of toLines(body)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      section = h[1].trim();
      continue;
    }
    const m = line.match(/^\s*[-*]\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*\|\s*([^|]+?)\s*\|\s*(.*)$/);
    if (!m) continue;
    const row = { date: m[1], time: m[2], dept: m[3].trim(), text: m[4].trim() };
    if (section === "依頼の記録") requests.push(row);
    else if (section === "提案の記録") {
      let result = null;
      if (/見送り/.test(row.text)) result = "declined";
      else if (/作成/.test(row.text)) result = "created";
      proposals.push({ ...row, result });
    }
  }
  return { requests, proposals };
}

/** 長い文字列を省略する */
export function truncate(text, max = 18) {
  const chars = Array.from(String(text ?? ""));
  return chars.length > max ? chars.slice(0, max - 1).join("") + "…" : chars.join("");
}

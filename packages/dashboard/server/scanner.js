// 組織フォルダ(my-office/)を読み取り、ダッシュボード用のデータを組み立てる。
// 読み取り専用。組織フォルダには一切書き込まない。

import fs from "node:fs";
import path from "node:path";
import {
  KNOWN_DEPARTMENTS,
  KNOWN_BY_ID,
  isActiveStatus,
  isDeliveredStatus,
  isOrgClaudeMd,
  localDateString,
  localTimeString,
  parseDeptClaudeMd,
  parseInbox,
  parseMarkdownFile,
  parseOrgClaudeMd,
  parseProposals,
  parseTodos,
} from "./parser.js";

export const ACTIVE_WINDOW_MS = 10 * 60 * 1000; // 10分以内 = 稼働中
export const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24時間以内 = 最近
export const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

/** 集計と表示から除く名前か(CLAUDE.md、`_` や `.` で始まるもの) */
export function isHiddenName(name) {
  return name === "CLAUDE.md" || name.startsWith("_") || name.startsWith(".");
}

/** パスを `/` 区切りにする */
function toPosix(p) {
  return p.split(path.sep).join("/");
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, "utf-8");
  } catch {
    return null;
  }
}

/**
 * 開始位置から親へたどり、組織フォルダ(`my-office/CLAUDE.md` に「## オーナープロフィール」がある `my-office/`)を探す。
 * @returns {string|null} 見つかった組織フォルダの絶対パス
 */
export function findOrgDir(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, "my-office");
    const claude = readText(path.join(candidate, "CLAUDE.md"));
    if (claude != null && isOrgClaudeMd(claude)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * 組織フォルダ内の相対パスを絶対パスにする。組織フォルダの外を指すときは null。
 * シンボリックリンクで外へ出る場合も null にする。
 */
export function resolveInside(orgDir, relPath) {
  if (typeof relPath !== "string" || relPath === "" || relPath.includes("\0")) return null;
  const root = path.resolve(orgDir);
  const abs = path.resolve(root, relPath);
  const rel = path.relative(root, abs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  try {
    const realRoot = fs.realpathSync(root);
    const realAbs = fs.realpathSync(abs);
    const realRel = path.relative(realRoot, realAbs);
    if (realRel === "" || realRel.startsWith("..") || path.isAbsolute(realRel)) return null;
  } catch {
    // 存在しないファイルは呼び出し側で 404 にする
  }
  return abs;
}

// ------------------------------------------------------------
// ファイルの読み込み(更新時刻が同じなら前回の結果を使う)
// ------------------------------------------------------------

const fileCache = new Map();

function readMarkdownInfo(abs, mtimeMs) {
  const hit = fileCache.get(abs);
  if (hit && hit.mtimeMs === mtimeMs) return hit.info;
  const content = readText(abs) ?? "";
  const parsed = parseMarkdownFile(content);
  const info = {
    status: parsed.status,
    created: parsed.created,
    type: parsed.type,
    movedTo: parsed.movedTo,
    title: parsed.title,
  };
  fileCache.set(abs, { mtimeMs, info });
  return info;
}

/**
 * 組織フォルダ内のファイルをすべて集める(除外対象は含めない)。
 * @returns {Array<{path:string, abs:string, name:string, dept:string|null, sub:string|null, mtimeMs:number, size:number, isMarkdown:boolean, title:string, status:string|null, created:string|null, counted:boolean}>}
 */
export function collectFiles(orgDir) {
  const out = [];
  const walk = (dir, relParts) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (isHiddenName(e.name)) continue;
      const abs = path.join(dir, e.name);
      const parts = [...relParts, e.name];
      if (e.isDirectory()) {
        walk(abs, parts);
        continue;
      }
      if (!e.isFile()) continue;
      let st;
      try {
        st = fs.statSync(abs);
      } catch {
        continue;
      }
      const isMarkdown = e.name.toLowerCase().endsWith(".md");
      const info = isMarkdown ? readMarkdownInfo(abs, st.mtimeMs) : {};
      const status = info.status ?? null;
      out.push({
        path: parts.join("/"),
        abs,
        name: e.name,
        dept: parts.length > 1 ? parts[0] : null,
        sub: parts.length > 2 ? parts[1] : null,
        mtimeMs: st.mtimeMs,
        size: st.size,
        isMarkdown,
        title: info.title || e.name.replace(/\.md$/i, ""),
        status,
        created: info.created ?? null,
        // 件数に数えるのは Markdown で、status: moved でないもの
        counted: isMarkdown && status !== "moved",
      });
    }
  };
  walk(orgDir, []);
  return out;
}

/** 最終更新からの経過で状態を決める */
export function stateFromTime(mtimeMs, nowMs) {
  if (mtimeMs == null) return "idle";
  const diff = nowMs - mtimeMs;
  if (diff <= ACTIVE_WINDOW_MS) return "active";
  if (diff <= RECENT_WINDOW_MS) return "recent";
  return "idle";
}

/** 部署フォルダの一覧(組織フォルダ直下のフォルダ) */
export function listDepartmentIds(orgDir) {
  let entries = [];
  try {
    entries = fs.readdirSync(orgDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const ids = entries.filter((e) => e.isDirectory() && !isHiddenName(e.name)).map((e) => e.name);
  // 秘書室 → 標準部署の順 → それ以外は名前順
  const order = KNOWN_DEPARTMENTS.map((d) => d.id);
  return ids.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
}

/** 部署の CLAUDE.md と既定値から、名前・役割・担当を決める */
export function readDepartmentMeta(orgDir, id) {
  const known = KNOWN_BY_ID[id];
  const claude = readText(path.join(orgDir, id, "CLAUDE.md"));
  const parsed = claude != null ? parseDeptClaudeMd(claude) : { name: null, role: null, staff: null };
  return {
    id,
    name: parsed.name || known?.name || id,
    role: parsed.role || null,
    staff: parsed.staff || known?.staff || "(未定)",
    hasClaudeMd: claude != null,
  };
}

/** `_assets/<folder>.png|jpg|webp` を探す */
export function findAsset(orgDir, folder) {
  if (typeof folder !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(folder)) return null;
  for (const ext of ASSET_EXTENSIONS) {
    const abs = path.join(orgDir, "_assets", folder + ext);
    try {
      if (fs.statSync(abs).isFile()) return abs;
    } catch {
      /* 次の拡張子へ */
    }
  }
  return null;
}

/** 組織 CLAUDE.md のオーナー情報 */
export function readOwner(orgDir) {
  const text = readText(path.join(orgDir, "CLAUDE.md")) ?? "";
  return parseOrgClaudeMd(text);
}

/** 今日の TODO */
export function readTodayTodos(orgDir, now = new Date()) {
  const date = localDateString(now);
  const rel = `secretary/todos/${date}.md`;
  const text = readText(path.join(orgDir, rel));
  if (text == null) return { date, path: null, open: [], done: [], openCount: 0, doneCount: 0 };
  return { date, path: rel, ...parseTodos(text) };
}

/** 今日の Inbox */
export function readTodayInbox(orgDir, now = new Date()) {
  const date = localDateString(now);
  const rel = `secretary/inbox/${date}.md`;
  const text = readText(path.join(orgDir, rel));
  const items = text == null ? [] : parseInbox(text);
  return { date, path: text == null ? null : rel, count: items.length, items };
}

/** 部署の提案メモ */
export function readProposals(orgDir) {
  const text = readText(path.join(orgDir, "secretary", "notes", "department-proposals.md"));
  return text == null ? { requests: [], proposals: [] } : parseProposals(text);
}

/** ファイルの一覧(1件ぶん)を API 用にする */
function fileSummary(f) {
  return {
    path: f.path,
    name: f.name,
    dept: f.dept,
    sub: f.sub,
    title: f.title,
    status: f.status,
    created: f.created,
    mtime: f.mtimeMs,
    size: f.size,
    counted: f.counted,
  };
}

/** 部署内のサブフォルダ(チップ)を作る */
function buildChips(orgDir, id, deptFiles, nowMs) {
  let entries = [];
  try {
    entries = fs.readdirSync(path.join(orgDir, id), { withFileTypes: true });
  } catch {
    /* 空 */
  }
  const subs = entries
    .filter((e) => e.isDirectory() && !isHiddenName(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
  // 秘書室はひな形の順(todos → inbox → notes)にそろえる
  if (id === "secretary") {
    const order = ["todos", "inbox", "notes"];
    subs.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }
  const chip = (label, files, kind) => {
    const last = files.reduce((m, f) => Math.max(m, f.mtimeMs), 0) || null;
    return {
      label,
      kind,
      fileCount: files.filter((f) => f.counted).length,
      lastModified: last,
      state: stateFromTime(last, nowMs),
    };
  };
  const chips = subs.map((s) => chip(`${s}/`, deptFiles.filter((f) => f.sub === s), "folder"));
  if (id === "secretary") {
    const notes = deptFiles.filter((f) => f.sub === "notes");
    chips.push(chip("意思決定ログ", notes.filter((f) => /-decisions\.md$/.test(f.name)), "virtual"));
    chips.push(chip("学び・気づき", notes.filter((f) => /-learnings\.md$/.test(f.name)), "virtual"));
  }
  return chips;
}

/** 1部署ぶんの集計 */
export function summarizeDepartment(orgDir, id, allFiles, nowMs, todos) {
  const meta = readDepartmentMeta(orgDir, id);
  const files = allFiles.filter((f) => f.dept === id);
  const counted = files.filter((f) => f.counted);
  const latest = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
  const statusCounts = {};
  for (const f of counted) {
    const s = f.status || "(なし)";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const delivered = counted
    .filter((f) => isDeliveredStatus(f.status))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  let ratio;
  if (id === "secretary" && todos) {
    ratio = { active: todos.openCount, total: todos.openCount + todos.doneCount, kind: "todo" };
  } else {
    ratio = { active: counted.filter((f) => isActiveStatus(f.status)).length, total: counted.length, kind: "files" };
  }
  const lastModified = latest ? latest.mtimeMs : null;
  return {
    ...meta,
    hasAsset: findAsset(orgDir, id) != null,
    fileCount: counted.length,
    statusCounts,
    ratio,
    lastModified,
    state: stateFromTime(lastModified, nowMs),
    bubble: latest ? latest.title : null,
    bubblePath: latest ? latest.path : null,
    delivered: delivered ? { title: delivered.title, path: delivered.path, status: delivered.status } : null,
    chips: buildChips(orgDir, id, files, nowMs),
  };
}

/** 提案待ちの部署(未作成の標準部署 + 提案メモにだけ出てくる部署) */
export function buildPendingProposals(existingIds, proposalsData) {
  const existing = new Set(existingIds);
  const candidates = new Map();
  for (const d of KNOWN_DEPARTMENTS) {
    if (d.id === "secretary" || existing.has(d.id)) continue;
    candidates.set(d.id, { id: d.id, name: d.name, staff: d.staff, custom: false });
  }
  const mentioned = [...proposalsData.requests, ...proposalsData.proposals].map((r) => r.dept);
  for (const id of mentioned) {
    if (id === "secretary" || existing.has(id) || candidates.has(id)) continue;
    candidates.set(id, { id, name: KNOWN_BY_ID[id]?.name || id, staff: KNOWN_BY_ID[id]?.staff || "(未定)", custom: true });
  }
  const order = KNOWN_DEPARTMENTS.map((d) => d.id);
  const list = [...candidates.values()].map((c) => {
    const reqs = proposalsData.requests.filter((r) => r.dept === c.id);
    const props = proposalsData.proposals.filter((r) => r.dept === c.id);
    const lastReq = reqs[reqs.length - 1] || null;
    const lastProp = props[props.length - 1] || null;
    return {
      ...c,
      requests: reqs.length,
      lastRequest: lastReq ? { date: lastReq.date, time: lastReq.time, text: lastReq.text } : null,
      lastProposal: lastProp ? { date: lastProp.date, time: lastProp.time, result: lastProp.result, text: lastProp.text } : null,
    };
  });
  list.sort((a, b) => {
    if (b.requests !== a.requests) return b.requests - a.requests;
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.id.localeCompare(b.id);
  });
  const lastAny = proposalsData.proposals[proposalsData.proposals.length - 1] || null;
  return {
    pending: list,
    lastProposal: lastAny ? { date: lastAny.date, time: lastAny.time, dept: lastAny.dept, result: lastAny.result } : null,
    requestCount: proposalsData.requests.length,
  };
}

/** 最近の更新(活動ログ) */
export function buildActivity(orgDir, allFiles, limit = 20, metaCache = new Map()) {
  const staffOf = (dept) => {
    if (!dept) return "ショー";
    if (!metaCache.has(dept)) metaCache.set(dept, readDepartmentMeta(orgDir, dept));
    return metaCache.get(dept);
  };
  return [...allFiles]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit)
    .map((f) => {
      const meta = staffOf(f.dept);
      const staff = typeof meta === "string" ? meta : meta.staff;
      const d = new Date(f.mtimeMs);
      const time = localTimeString(d);
      return {
        time,
        date: localDateString(d),
        mtime: f.mtimeMs,
        staff,
        dept: f.dept,
        deptName: typeof meta === "string" ? null : meta.name,
        file: f.name,
        title: f.title,
        path: f.path,
        text: `${time} ${staff} → ${f.name} を更新`,
      };
    });
}

/** 24時間の更新回数(1時間ごと、古い順の24個) */
export function buildHourly(allFiles, now = new Date()) {
  const end = new Date(now);
  end.setMinutes(0, 0, 0); // 今の時間帯の始まり
  const startMs = end.getTime() - 23 * 3600 * 1000;
  const buckets = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(startMs + i * 3600 * 1000);
    buckets.push({ hour: t.getHours(), start: t.getTime(), count: 0 });
  }
  for (const f of allFiles) {
    if (f.mtimeMs < startMs || f.mtimeMs > now.getTime()) continue;
    const idx = Math.floor((f.mtimeMs - startMs) / (3600 * 1000));
    if (idx >= 0 && idx < 24) buckets[idx].count++;
  }
  return buckets;
}

/** 概要(/api/overview) */
export function buildOverview(orgDir, now = new Date()) {
  const nowMs = now.getTime();
  const allFiles = collectFiles(orgDir);
  const counted = allFiles.filter((f) => f.counted);
  const todos = readTodayTodos(orgDir, now);
  const inbox = readTodayInbox(orgDir, now);
  const ids = listDepartmentIds(orgDir);
  const departments = ids.map((id) => summarizeDepartment(orgDir, id, allFiles, nowMs, todos));
  const proposals = buildPendingProposals(ids, readProposals(orgDir));
  const metaCache = new Map(departments.map((d) => [d.id, d]));
  const activity = buildActivity(orgDir, counted, 20, metaCache);
  const hourly = buildHourly(counted, now);
  const lastUpdated = counted.reduce((m, f) => Math.max(m, f.mtimeMs), 0) || null;
  const secretary = departments.find((d) => d.id === "secretary");
  return {
    generatedAt: nowMs,
    today: localDateString(now),
    org: {
      dir: orgDir,
      ...readOwner(orgDir),
      hasOwnerAsset: findAsset(orgDir, "owner") != null,
    },
    secretary: {
      staff: secretary?.staff || "ショー",
      hasAsset: secretary?.hasAsset || false,
      state: secretary?.state || "idle",
    },
    todos: {
      date: todos.date,
      path: todos.path,
      openCount: todos.openCount,
      doneCount: todos.doneCount,
      open: todos.open,
      done: todos.done,
    },
    inbox: { date: inbox.date, path: inbox.path, count: inbox.count, items: inbox.items },
    departments,
    proposals,
    activity,
    hourly,
    stats: {
      activeStaff: departments.filter((d) => d.state === "active").length,
      todoOpen: todos.openCount,
      todoDone: todos.doneCount,
      inbox: inbox.count,
      departmentCount: departments.length,
      lastUpdated,
      updates24h: hourly.reduce((s, h) => s + h.count, 0),
      fileCount: counted.length,
    },
  };
}

/** 部署詳細(/api/department/:id) */
export function buildDepartmentDetail(orgDir, id, now = new Date()) {
  if (!listDepartmentIds(orgDir).includes(id)) return null;
  const allFiles = collectFiles(orgDir);
  const todos = id === "secretary" ? readTodayTodos(orgDir, now) : null;
  const summary = summarizeDepartment(orgDir, id, allFiles, now.getTime(), todos);
  const files = allFiles
    .filter((f) => f.dept === id)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map(fileSummary);
  return { ...summary, files };
}

/** ツリー(/api/tree) */
export function buildTree(orgDir) {
  const walk = (abs, rel) => {
    let entries = [];
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      return [];
    }
    const nodes = [];
    for (const e of entries) {
      if (isHiddenName(e.name)) continue;
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      const childAbs = path.join(abs, e.name);
      if (e.isDirectory()) {
        nodes.push({ type: "dir", name: e.name, path: childRel, children: walk(childAbs, childRel) });
      } else if (e.isFile()) {
        let mtime = null;
        try {
          mtime = fs.statSync(childAbs).mtimeMs;
        } catch {
          /* 無視 */
        }
        nodes.push({ type: "file", name: e.name, path: childRel, mtime });
      }
    }
    // フォルダが先、それぞれ名前順
    nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
    return nodes;
  };
  return { type: "dir", name: path.basename(orgDir), path: "", children: walk(orgDir, "") };
}

/** 全文検索(/api/search) */
export function searchFiles(orgDir, query, limit = 30) {
  const q = String(query ?? "").trim().toLowerCase();
  if (q === "") return [];
  const results = [];
  for (const f of collectFiles(orgDir)) {
    if (!f.isMarkdown) continue;
    const content = readText(f.abs);
    if (content == null) continue;
    const nameHit = f.path.toLowerCase().includes(q);
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    const matches = [];
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      const at = lower.indexOf(q);
      if (at === -1) continue;
      total++;
      if (matches.length < 3) {
        // 一致した位置の前後を抜き出す
        const chars = Array.from(lines[i]);
        const charAt = Array.from(lines[i].slice(0, at)).length;
        const from = Math.max(0, charAt - 30);
        const to = Math.min(chars.length, charAt + Array.from(q).length + 60);
        const excerpt = (from > 0 ? "…" : "") + chars.slice(from, to).join("").trim() + (to < chars.length ? "…" : "");
        matches.push({ line: i + 1, text: excerpt });
      }
    }
    if (!nameHit && total === 0) continue;
    results.push({
      path: f.path,
      name: f.name,
      dept: f.dept,
      title: f.title,
      status: f.status,
      mtime: f.mtimeMs,
      matches,
      matchCount: total,
      score: (nameHit ? 10 : 0) + total,
    });
  }
  results.sort((a, b) => b.score - a.score || b.mtime - a.mtime);
  return results.slice(0, limit);
}

/** ファイル内容(/api/file) */
export function readOrgFile(orgDir, relPath) {
  const abs = resolveInside(orgDir, relPath);
  if (!abs) return { error: "forbidden" };
  let st;
  try {
    st = fs.statSync(abs);
  } catch {
    return { error: "notfound" };
  }
  if (!st.isFile()) return { error: "notfound" };
  const content = readText(abs);
  if (content == null) return { error: "notfound" };
  const isMarkdown = abs.toLowerCase().endsWith(".md");
  const parsed = isMarkdown ? parseMarkdownFile(content) : null;
  return {
    path: toPosix(path.relative(path.resolve(orgDir), abs)),
    name: path.basename(abs),
    mtime: st.mtimeMs,
    size: st.size,
    content,
    isMarkdown,
    frontmatter: parsed ? jsonSafe(parsed.data) : null,
    body: parsed ? parsed.body : content,
    title: parsed?.title || path.basename(abs),
    status: parsed?.status || null,
  };
}

/** YAML の値(Date など)を JSON にできる形にする */
function jsonSafe(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonSafe(v)]));
  }
  return value;
}

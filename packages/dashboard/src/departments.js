// 部署の色と、表示用の小さな関数。

const COLORS = {
  secretary: "#facc15",
  pm: "#4ade80",
  research: "#60a5fa",
  marketing: "#f87171",
  engineering: "#a78bfa",
  finance: "#fb923c",
  sales: "#fbbf24",
  creative: "#f472b6",
  hr: "#c084fc",
};

const AVATAR_BG = {
  secretary: "#2dd4bf",
  pm: "#86efac",
  research: "#7dd3fc",
  marketing: "#fca5a5",
  engineering: "#c4b5fd",
  finance: "#fdba74",
  sales: "#fde68a",
  creative: "#f9a8d4",
  hr: "#d8b4fe",
};

const CUSTOM = ["#38bdf8", "#2dd4bf", "#e879f9", "#a3e635", "#fda4af", "#facc15", "#93c5fd"];

function hash(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

/** 部署の色 */
export function deptColor(id) {
  return COLORS[id] || CUSTOM[hash(id) % CUSTOM.length];
}

/** 担当アイコンの背景色 */
export function avatarColor(id) {
  return AVATAR_BG[id] || deptColor(id);
}

/** 名前の最初の1文字(イニシャル) */
export function initialOf(name) {
  const s = String(name || "").replace(/^[(（]/, "");
  if (!s || s.startsWith("未定")) return "?";
  return Array.from(s)[0];
}

export const STATE_LABEL = { active: "稼働中", recent: "最近", idle: "待機" };
export const STATE_VAR = { active: "var(--st-active)", recent: "var(--st-recent)", idle: "var(--st-idle)" };

/** ミリ秒の時刻を HH:MM に */
export function hhmm(ms) {
  if (!ms) return "--:--";
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** ミリ秒の時刻を「M/D HH:MM」または「HH:MM」(今日なら)に */
export function shortDateTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? hhmm(ms) : `${d.getMonth() + 1}/${d.getDate()} ${hhmm(ms)}`;
}

/** 「3分前」のような相対時刻 */
export function ago(ms, now = Date.now()) {
  if (!ms) return "更新なし";
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return "たった今";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}分前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.round(h / 24)}日前`;
}

/** status の表示用クラス */
export function statusClass(status) {
  if (!status) return "";
  if (status === "moved") return "st-moved";
  if (["completed", "published", "delivered", "paid", "done", "resolved", "closed", "filled", "accepted", "reviewed", "archived"].includes(status)) return "st-done";
  if (["draft", "rejected", "inactive"].includes(status)) return "";
  return "st-active";
}

/** 文字数で省略 */
export function clip(text, max) {
  const chars = Array.from(String(text ?? ""));
  return chars.length > max ? chars.slice(0, Math.max(1, max - 1)).join("") + "…" : chars.join("");
}

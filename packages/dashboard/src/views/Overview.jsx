// 概要画面。見える化モックアップ(Main.dc.html)の配置を再現する。
// 1360×960 の座標で組み、ウィンドウに合わせて縦横に広げる(拡大縮小は縦横同じ倍率なので、文字や丸は歪まない)。

import { useEffect, useMemo, useState } from "react";
import { useJson, useTick } from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Nav from "../components/Nav.jsx";
import { STATE_LABEL, STATE_VAR, avatarColor, clip, deptColor, hhmm, initialOf } from "../departments.js";

const BASE_W = 1360;
const BASE_H = 960;
const PAUSE_KEY = "my-office-dashboard:paused";
const SHORT_NAMES = { marketing: "マーケ" };

function useWindowSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth || BASE_W, h: window.innerHeight || BASE_H }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth || BASE_W, h: window.innerHeight || BASE_H });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function loadPaused() {
  try {
    return localStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 配置を計算する。LW×LH は論理座標(1360×960 以上)。
 * 縦横に余白が増えたぶんは、部署の列幅・右の枠・下の段に配る。
 */
function computeLayout(LW, LH, departments, pendingCount) {
  const M = 14;
  const dy = Math.min(Math.max(0, LH - BASE_H) * 0.25, 70);
  const rightW = 264 + Math.min(56, Math.max(0, (LW - BASE_W) * 0.08));
  const rightX = LW - M - rightW;
  const rightCX = rightX + rightW / 2;
  const orgX = M;
  const orgW = rightX - 24 - M;
  const panelTop = 238 + dy;
  const panelBottom = LH - 70;
  const panelH = panelBottom - panelTop;

  const sho = { w: 200, h: 78, top: panelTop + 54, cx: orgX + orgW / 2 };
  sho.x = sho.cx - sho.w / 2;
  const owner = { w: 222, h: 58, top: 102 + dy * 0.5, cx: (sho.cx + rightCX) / 2 };
  owner.x = owner.cx - owner.w / 2;

  const headTop = sho.top + sho.h + 51 + dy * 0.4;
  const cardTop = headTop + 51;
  const chipTop = cardTop + 90;

  // 部署の列
  const N = Math.max(1, departments.length);
  const gap = 10;
  const innerL = orgX + 16;
  const innerR = orgX + orgW - 16;
  const avail = innerR - innerL;
  const maxCol = N <= 2 ? 236 : 260;
  const colW = Math.max(64, Math.min(maxCol, (avail - gap * (N - 1)) / N));
  const totalW = N * colW + gap * (N - 1);
  const startX = Math.max(innerL, Math.min(sho.cx - totalW / 2, innerR - totalW));
  const chipCols = colW >= 2 * 100 + 20 ? 2 : 1;
  const chipW = chipCols === 2 ? (colW - 16 - 8) / 2 : Math.min(104, colW - 14);
  const maxRows = Math.max(1, Math.floor((panelBottom - 14 - chipTop + 10) / 44));
  const cardW = Math.min(colW - 6, 168);

  const cols = departments.map((d, i) => {
    const x = startX + i * (colW + gap);
    const capacity = maxRows * chipCols;
    let chips = d.chips || [];
    let more = 0;
    if (chips.length > capacity) {
      more = chips.length - (capacity - 1);
      chips = chips.slice(0, capacity - 1);
    }
    const placed = chips.map((c, k) => ({
      ...c,
      left: x + 8 + (chipCols === 2 ? (k % 2) * (chipW + 8) : 0),
      top: chipTop + (chipCols === 2 ? Math.floor(k / 2) : k) * 44,
    }));
    if (more > 0) {
      const k = chips.length;
      placed.push({
        label: `ほか ${more} 件`,
        kind: "more",
        state: "idle",
        left: x + 8 + (chipCols === 2 ? (k % 2) * (chipW + 8) : 0),
        top: chipTop + (chipCols === 2 ? Math.floor(k / 2) : k) * 44,
      });
    }
    return { d, x, w: colW, cx: x + colW / 2, chips: placed };
  });

  // 吹き出し: 24時間以内に動いた部署から、新しい順に最大4つ
  const chosen = cols
    .filter((c) => c.d.bubble && c.d.state !== "idle")
    .sort((a, b) => (b.d.lastModified || 0) - (a.d.lastModified || 0))
    .slice(0, 4)
    .sort((a, b) => a.x - b.x);
  // 吹き出しは見出しの上(放射線の帯)に置き、幅は列に収める(隣と重ならないように)
  const bubbles = chosen.map((c) => {
    const maxW = Math.max(60, Math.min(260, colW + gap - 6));
    const maxChars = Math.max(4, Math.floor((maxW - 22) / 11.5));
    const text = clip(c.d.bubble, maxChars);
    const estW = Math.min(maxW, Array.from(text).length * 11.5 + 22);
    const left = Math.max(orgX + 8, Math.min(c.cx - estW / 2, orgX + orgW - 8 - estW));
    return { id: c.d.id, text, full: c.d.bubble, left, top: headTop - 28, maxW };
  });

  // 右の枠: 提案待ちの並べ方
  const listTop = 150;
  const bottomCardH = 70;
  const listAvail = panelH - listTop - bottomCardH - 30;
  const n = Math.max(1, pendingCount);
  let step = Math.min(78, listAvail / n);
  let shown = pendingCount;
  if (step < 42) {
    shown = Math.max(1, Math.floor(listAvail / 42) - 1);
    step = 42;
  }
  const propCardH = Math.min(62, step - 8);

  return {
    LW,
    LH,
    M,
    org: { x: orgX, y: panelTop, w: orgW, h: panelH },
    right: { x: rightX, y: panelTop, w: rightW, h: panelH, cx: rightCX },
    sho,
    owner,
    headTop,
    cardTop,
    chipTop,
    cardW,
    chipW,
    cols,
    bubbles,
    prop: { listTop, step, shown, cardH: propCardH, compact: propCardH < 56, bottomTop: panelH - bottomCardH - 18, cardW: rightW - 92 },
    mcp: { x: orgX + 24, y: panelTop + 84, w: 96, h: 26 },
    footerTop: LH - 54,
  };
}

/** 24時間の更新の折れ線 */
function Sparkline({ hourly }) {
  const w = 150;
  const h = 30;
  const counts = (hourly || []).map((b) => b.count);
  if (counts.length === 0) return <svg width={w} height={h} aria-hidden="true" />;
  const max = Math.max(1, ...counts);
  const stepX = (w - 6) / Math.max(1, counts.length - 1);
  const pts = counts.map((c, i) => [3 + i * stepX, h - 3 - (c / max) * (h - 8)]);
  const last = pts[pts.length - 1];
  const start = hourly[0]?.hour ?? 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`24時間の更新回数の推移(${start}時から1時間ごと)`}>
      <title>{hourly.map((b) => `${b.hour}時 ${b.count}回`).join(" / ")}</title>
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--sky)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--sky)" />
    </svg>
  );
}

function StateDot({ state, size = 6 }) {
  return (
    <span
      className={state === "active" ? "mo-live" : undefined}
      style={{ width: size, height: size, borderRadius: "50%", background: STATE_VAR[state] || STATE_VAR.idle, display: "inline-block", flex: "none" }}
    />
  );
}

export default function Overview({ go, nav, live }) {
  const tick = useTick(30000); // 「稼働中」などは時間で変わるので、30秒ごとに読み直す
  const { data, error } = useJson("/api/overview", [live.version, tick]);
  const now = useNow();
  const size = useWindowSize();
  const [paused, setPaused] = useState(loadPaused);

  useEffect(() => {
    try {
      localStorage.setItem(PAUSE_KEY, paused ? "1" : "0");
    } catch {
      /* 保存できなくても動く */
    }
  }, [paused]);

  const scale = Math.max(0.3, Math.min(size.w / BASE_W, size.h / BASE_H));
  const LW = Math.max(BASE_W, size.w / scale);
  const LH = Math.max(BASE_H, size.h / scale);
  const departments = data?.departments || [];
  const pending = data?.proposals?.pending || [];
  const L = useMemo(() => computeLayout(LW, LH, departments, pending.length), [LW, LH, departments, pending.length]);

  const pad = (n) => String(n).padStart(2, "0");
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const stats = data?.stats;
  const tiles = [
    { label: "稼働中の担当", value: stats ? String(stats.activeStaff) : "-", color: "var(--text-strong)" },
    { label: "今日のTODO未完了", value: stats ? String(stats.todoOpen) : "-", color: "var(--sky)" },
    { label: "今日のTODO完了", value: stats ? String(stats.todoDone) : "-", color: "var(--st-recent)" },
    { label: "Inbox", value: stats ? String(stats.inbox) : "-", color: "var(--text-strong)" },
    { label: "部署数", value: stats ? String(stats.departmentCount) : "-", color: "var(--text-strong)" },
    { label: "最終更新", value: stats?.lastUpdated ? hhmm(stats.lastUpdated) : "--:--", color: "var(--violet)" },
  ];
  const activity = data?.activity || [];
  const tickerItems = activity.length ? activity.concat(activity) : [];
  const tickerSeconds = Math.max(30, activity.length * 6);
  const secretary = data?.secretary || { staff: "ショー", state: "idle", hasAsset: false };
  const lastProposal = data?.proposals?.lastProposal;
  const tooSmall = size.w / scale < BASE_W - 1 || size.h / scale < BASE_H - 1;

  return (
    <div className="ov-viewport" style={tooSmall ? { overflow: "auto" } : undefined}>
      <div style={{ position: "relative", width: L.LW * scale, height: L.LH * scale }}>
        <div className={`ov-stage${paused ? " mo-paused" : ""}`} style={{ width: L.LW, height: L.LH, transform: `scale(${scale})` }}>
          {/* 線(放射状の接続) */}
          <svg width={L.LW} height={L.LH} viewBox={`0 0 ${L.LW} ${L.LH}`} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} aria-hidden="true">
            <line x1={L.owner.cx} y1={L.owner.top + L.owner.h} x2={L.sho.cx} y2={L.sho.top} stroke="var(--sky)" strokeOpacity=".55" strokeWidth="2" />
            <line x1={L.owner.cx} y1={L.owner.top + L.owner.h} x2={L.sho.cx} y2={L.sho.top} stroke="var(--sky-soft)" strokeWidth="2" className="mo-flow" />
            <line x1={L.owner.cx} y1={L.owner.top + L.owner.h} x2={L.right.cx} y2={L.right.y + 54} stroke="var(--line-soft)" strokeOpacity=".6" strokeWidth="1" />
            <line x1={L.sho.x + L.sho.w} y1={L.sho.top + 38} x2={L.right.x + 22} y2={L.sho.top + 38} stroke="var(--line-soft)" strokeWidth="1" strokeDasharray="4 5" />
            <line x1={L.mcp.x + L.mcp.w + 16} y1={L.mcp.y + 30} x2={L.sho.x} y2={L.sho.top + 32} stroke="var(--amber-border)" strokeWidth="1" />
            <line x1={L.sho.x} y1={L.sho.top + 42} x2={L.mcp.x + L.mcp.w + 16} y2={L.mcp.y + 38} stroke="var(--amber-border)" strokeWidth="1" />
            {L.cols.map((c) => {
              const on = c.d.state !== "idle";
              return (
                <g key={c.d.id}>
                  <line x1={L.sho.cx} y1={L.sho.top + L.sho.h} x2={c.cx} y2={L.headTop} stroke={on ? "var(--accent)" : "var(--line-idle)"} strokeOpacity={on ? 0.9 : 0.8} strokeWidth="1.5" />
                  {c.d.state === "active" && <line x1={L.sho.cx} y1={L.sho.top + L.sho.h} x2={c.cx} y2={L.headTop} stroke="var(--accent)" strokeWidth="1.5" className="mo-flow" />}
                  {c.chips.length > 0 && (
                    <line
                      x1={c.x + 3}
                      y1={L.cardTop + 66}
                      x2={c.x + 3}
                      y2={c.chips[c.chips.length - 1].top + 17}
                      stroke={STATE_VAR[c.d.state]}
                      strokeOpacity=".55"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 上部バー */}
          <header className="ov-abs" style={{ left: L.M, top: 12, width: L.LW - L.M * 2, height: 52, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="mo-live" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--live)", display: "inline-block" }} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--live-text)", letterSpacing: ".1em" }}>
              LIVE
            </span>
            <span className="mono" style={{ fontSize: 26, fontWeight: 700, color: "var(--text-strong)", margin: "0 6px" }}>
              {clock}
            </span>
            <span style={{ fontSize: 11, color: live.connected ? "var(--muted)" : "var(--live-text)", whiteSpace: "nowrap" }} title={live.connected ? "ファイルの変更をすぐ反映します" : "サーバーにつながっていません"}>
              {live.connected ? "データ最新" : "再接続中…"}
            </span>
            <button type="button" className="ov-pill-btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? "▶ 動きを再開" : "Ⅱ 動きを止める"}
            </button>
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {tiles.map((t) => (
                <div key={t.label} className="ov-tile" style={{ minWidth: 74 }}>
                  <div className="ov-tile-label">{t.label}</div>
                  <div className="ov-tile-value mono" style={{ color: t.color }}>
                    {t.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                24時間の更新
                <br />
                <span className="mono" style={{ color: "var(--text)" }}>
                  {stats ? stats.updates24h : "-"} 回
                </span>
              </div>
              <Sparkline hourly={data?.hourly} />
            </div>
            <span style={{ marginLeft: "auto", padding: "4px 10px", border: "1px solid var(--border-strong)", borderRadius: 999, fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }} title={data?.org?.dir || ""}>
              読み取り専用
            </span>
          </header>

          {/* 画面の切り替え */}
          <div className="ov-abs" style={{ right: L.M, top: 72 }}>
            <Nav {...nav} />
          </div>

          {/* オーナー */}
          <div
            className="ov-abs"
            style={{ left: L.owner.x, top: L.owner.top, width: L.owner.w, height: L.owner.h, padding: "8px 14px", border: "1px solid var(--sky)", borderRadius: 8, background: "var(--card-strong)", boxShadow: "0 0 18px var(--glow)" }}
            title={[data?.org?.business && `事業・活動: ${data.org.business}`, data?.org?.goals && `目標・課題: ${data.org.goals}`, data?.org?.created && `作成日: ${data.org.created}`].filter(Boolean).join("\n")}
          >
            <div style={{ fontSize: 10, color: "var(--muted)" }}>オーナー・最終決定</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)" }}>あなた</div>
            <Avatar id="owner" name="あなた" hasAsset={data?.org?.hasOwnerAsset} size={40} bg="var(--owner-avatar-bg)" color="var(--owner-avatar-text)" version={live.version} style={{ position: "absolute", right: -14, top: -14 }} />
          </div>
          {data?.org?.business && (
            <div className="ov-abs ov-ellipsis" style={{ left: L.owner.x, top: L.owner.top + L.owner.h + 4, width: L.owner.w + 40, fontSize: 10, color: "var(--muted)" }} title={data.org.goals || ""}>
              {data.org.business}
            </div>
          )}

          {/* 左の大枠: my-office(ショー) */}
          <section aria-label="my-office の組織" className="ov-abs" style={{ left: L.org.x, top: L.org.y, width: L.org.w, height: L.org.h, border: "1px solid var(--border)", borderRadius: 14, background: "var(--panel)" }}>
            <div style={{ position: "absolute", left: 14, top: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
              </svg>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-head)" }}>my-office</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>(ショー)</span>
            </div>
            <div style={{ position: "absolute", left: 14, top: 56, display: "flex", gap: 5 }} aria-hidden="true">
              {departments.map((d) => (
                <span key={d.id} title={d.name} style={{ width: 18, height: 18, borderRadius: 4, background: deptColor(d.id), display: "inline-block" }} />
              ))}
            </div>
            {departments.length <= 1 && data && (
              <div style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", width: Math.min(460, L.org.w - 40), padding: "10px 16px", border: "1px dashed var(--border-strong)", borderRadius: 10, fontSize: 12, lineHeight: 1.7, color: "var(--muted)", textAlign: "center", background: "var(--card)" }}>
                部署はまだありません。いまは秘書室のショーがぜんぶ受け持っています。
                <br />
                同じ分野の依頼が2回たまると、ショーが部署を提案します(右の「提案待ち」)。
              </div>
            )}
          </section>

          {/* 道具(MCP)の案内 */}
          <div
            className="ov-abs"
            style={{ left: L.mcp.x, top: L.mcp.y, height: L.mcp.h, padding: "4px 12px", border: "1px solid var(--amber-border)", borderRadius: 6, background: "var(--amber-bg)", color: "var(--amber-text)", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}
            title="外部サービス(MCP)をつなぐと、ショーや部署が使える道具が増えます。接続状態は読み取っていません(案内だけ)。設定は Claude Code の /mcp から。"
          >
            道具(MCP)
          </div>
          <div className="ov-abs" style={{ left: L.mcp.x + 2, top: L.mcp.y + 30, fontSize: 9, color: "var(--muted)" }}>
            案内のみ ・ /mcp で設定
          </div>

          {/* 秘書・窓口: ショー */}
          <button
            type="button"
            className="ov-abs ov-card"
            onClick={() => go({ view: "dept", dept: "secretary" })}
            style={{ left: L.sho.x, top: L.sho.top, width: L.sho.w, height: L.sho.h, padding: "10px 14px", border: "1px solid var(--sky)", borderRadius: 8, background: "var(--card-strong)", textAlign: "left", color: "inherit" }}
            aria-label={`秘書室 ${secretary.staff} の詳細を開く`}
          >
            <div style={{ fontSize: 10, color: "var(--muted)" }}>秘書・窓口 /sho</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)" }}>{secretary.staff}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <StateDot state={secretary.state} />
              {STATE_LABEL[secretary.state]}
            </div>
            <Avatar id="secretary" name={secretary.staff} hasAsset={secretary.hasAsset} size={42} color="#042f2e" version={live.version} style={{ position: "absolute", right: -14, top: -14 }} />
          </button>
          <div
            className="ov-abs"
            style={{ left: (L.sho.x + L.sho.w + L.right.x + 22) / 2 - 46, top: L.sho.top + 28, padding: "2px 10px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--indigo-border)", color: "var(--indigo-text)", fontSize: 11, whiteSpace: "nowrap" }}
          >
            ⇄ 提案・連携
          </div>

          {/* 部署の見出し */}
          {L.cols.map((c) => {
            const color = deptColor(c.d.id);
            const name = c.w < 130 && SHORT_NAMES[c.d.id] ? SHORT_NAMES[c.d.id] : c.d.name;
            const ratioTitle = c.d.ratio.kind === "todo" ? "今日の未完了 TODO / 今日の TODO 総数" : "進行中のファイル / ファイル数";
            return (
              <div
                key={`h-${c.d.id}`}
                className="ov-abs"
                style={{ top: L.headTop, left: c.x, width: c.w, height: 34, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, border: "1px solid var(--border)", borderBottom: `2px solid ${color}`, borderRadius: 6, background: "var(--card)" }}
                title={c.d.name}
              >
                <span className="ov-ellipsis" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--text-head)", minWidth: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block", flex: "none" }} />
                  <span className="ov-ellipsis">{name}</span>
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)", position: "relative", top: -9, flex: "none" }} title={ratioTitle}>
                  {c.d.ratio.active}/{c.d.ratio.total}
                </span>
              </div>
            );
          })}

          {/* 担当カード */}
          {L.cols.map((c) => (
            <button
              key={`c-${c.d.id}`}
              type="button"
              className="ov-abs ov-card"
              onClick={() => go({ view: "dept", dept: c.d.id })}
              aria-label={`${c.d.name}(担当 ${c.d.staff})の詳細を開く`}
              title={c.d.role || c.d.name}
              style={{ top: L.cardTop, left: c.x + 2, width: L.cardW, height: 66, padding: "8px 10px", textAlign: "left", color: "inherit", borderRadius: 6, background: "var(--card)", border: `1px solid ${c.d.state === "active" ? "var(--accent-strong)" : "var(--border)"}` }}
            >
              <div className="ov-ellipsis" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", paddingRight: 18 }}>
                {c.d.staff}
              </div>
              <div className="ov-ellipsis" style={{ fontSize: 10, color: "var(--muted)", paddingRight: 8 }}>
                {c.d.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: STATE_VAR[c.d.state] }}>
                  <StateDot state={c.d.state} />
                  {STATE_LABEL[c.d.state]}
                </span>
                <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
                  {c.d.fileCount}件
                </span>
              </div>
              <Avatar id={c.d.id} name={c.d.staff} hasAsset={c.d.hasAsset} size={34} version={live.version} style={{ position: "absolute", right: -10, top: -14 }} />
              {c.d.delivered && (
                <span
                  className="ov-ellipsis"
                  style={{ position: "absolute", left: -1, right: -1, top: 64, padding: "2px 8px", border: "1px solid var(--accent-strong)", borderTop: "none", borderRadius: "0 0 6px 6px", background: "var(--done-bg)", fontSize: 10, color: "var(--done-text)" }}
                  title={`納品: ${c.d.delivered.title}(${c.d.delivered.status})`}
                >
                  ✓ 納品 {c.d.delivered.title}
                </span>
              )}
            </button>
          ))}

          {/* フォルダのチップ */}
          {L.cols.map((c) =>
            c.chips.map((h) => (
              <button
                key={`chip-${c.d.id}-${h.label}`}
                type="button"
                className="ov-abs ov-card"
                onClick={() => go({ view: "dept", dept: c.d.id })}
                title={h.kind === "more" ? "部署の詳細で全部見られます" : `${h.fileCount}件 ・ ${h.lastModified ? `最終更新 ${hhmm(h.lastModified)}` : "更新なし"}`}
                style={{ left: h.left, top: h.top, width: L.chipW, height: 34, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, border: "1px solid var(--border)", borderRadius: 6, background: "var(--card)", color: "inherit" }}
              >
                <span className="ov-ellipsis" style={{ fontSize: 11, color: "var(--text-sub)", lineHeight: 1.2 }}>
                  {h.label}
                </span>
                {h.kind !== "more" && <StateDot state={h.state} size={7} />}
              </button>
            )),
          )}

          {/* 吹き出し */}
          {L.bubbles.map((b) => (
            <div
              key={`b-${b.id}`}
              className="ov-abs"
              title={b.full}
              style={{ left: b.left, top: b.top, padding: "4px 10px", borderRadius: 10, background: "var(--bubble-bg)", color: "var(--bubble-text)", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: b.maxW, boxShadow: "var(--shadow)", pointerEvents: "none" }}
            >
              {b.text}
            </div>
          ))}

          {/* 右の枠: 提案待ちの部署 */}
          <section aria-label="提案待ちの部署" className="ov-abs" style={{ left: L.right.x, top: L.right.y, width: L.right.w, height: L.right.h, border: "1px solid var(--border)", borderRadius: 14, background: "var(--panel)" }}>
            <div style={{ position: "absolute", right: 14, top: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#a78bfa" aria-hidden="true">
                <path d="M12 2l10 10-10 10L2 12z" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-head)" }}>提案待ち</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>(ショー)</span>
            </div>
            <div style={{ position: "absolute", left: 22, top: 54, width: L.right.w - 78, height: 70, padding: "8px 12px", border: "1px solid var(--border-strong)", borderRadius: 8, background: "var(--card)" }}>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>部署の提案係</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>{secretary.staff}</div>
              <div className="ov-ellipsis" style={{ fontSize: 10, color: "var(--muted)" }}>
                ● {lastProposal ? `最後の提案 ${lastProposal.date.slice(5).replace("-", "/")} ${lastProposal.time}` : "提案はまだありません"}
              </div>
              <Avatar id="secretary" name={secretary.staff} hasAsset={secretary.hasAsset} size={38} color="#042f2e" version={live.version} style={{ position: "absolute", right: -14, top: -12 }} />
            </div>
            {pending.length > 0 && (
              <div style={{ position: "absolute", left: 44, top: 124, width: 1, height: Math.max(0, L.prop.listTop - 124 + (Math.min(L.prop.shown, pending.length) - 1) * L.prop.step + L.prop.cardH / 2), background: "var(--border-strong)" }} />
            )}
            {pending.slice(0, L.prop.shown).map((p, i) => {
              const color = deptColor(p.id);
              const declined = p.lastProposal?.result === "declined";
              const note = `依頼 ${p.requests}回${declined ? " ・ 見送り済み" : ""}`;
              const deptLabel = p.custom ? `${p.name}(カスタム部署)` : p.name;
              return (
                <div
                  key={p.id}
                  style={{ position: "absolute", left: 34, top: L.prop.listTop + i * L.prop.step, width: L.prop.cardW, height: L.prop.cardH, padding: L.prop.compact ? "4px 12px" : "7px 12px", border: "1px solid var(--border)", borderLeft: `3px solid ${color}`, borderRadius: 6, background: "var(--card)", overflow: "visible" }}
                  title={p.lastRequest ? `最後の依頼 ${p.lastRequest.date} ${p.lastRequest.time}: ${p.lastRequest.text}` : "まだ依頼はありません"}
                >
                  {L.prop.compact ? (
                    <>
                      <div className="ov-ellipsis" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", paddingRight: 14 }}>
                        {p.staff} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-sub)" }}>{deptLabel}</span>
                      </div>
                      <div className="ov-ellipsis" style={{ fontSize: 10, color: "var(--muted)" }}>
                        {note}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ov-ellipsis" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", paddingRight: 14 }}>
                        {p.staff}
                      </div>
                      <div className="ov-ellipsis" style={{ fontSize: 10, color: "var(--text-sub)" }}>
                        {deptLabel}
                      </div>
                      <div className="ov-ellipsis" style={{ fontSize: 10, color: "var(--muted)" }}>
                        {note}
                      </div>
                    </>
                  )}
                  <span style={{ position: "absolute", right: -12, top: -10, width: 30, height: 30, borderRadius: "50%", border: "2px solid var(--ring)", background: avatarColor(p.id), color: "#0a0f17", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }} aria-hidden="true">
                    {initialOf(p.staff)}
                  </span>
                </div>
              );
            })}
            {pending.length > L.prop.shown && (
              <div style={{ position: "absolute", left: 34, top: L.prop.listTop + L.prop.shown * L.prop.step, fontSize: 11, color: "var(--muted)" }}>ほか {pending.length - L.prop.shown} 部署</div>
            )}
            {data && pending.length === 0 && (
              <div style={{ position: "absolute", left: 22, top: 150, right: 22, fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>提案待ちの部署はありません。ひな形の部署はぜんぶそろっています。</div>
            )}
            <div style={{ position: "absolute", left: 34, top: L.prop.bottomTop, width: L.prop.cardW + 4, height: 70, padding: "7px 12px", border: "1px solid var(--border)", borderLeft: "3px solid #84cc16", borderRadius: 6, background: "var(--card)" }}>
              <div style={{ fontSize: 9, color: "var(--muted)" }}>組織の外・読むだけ</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>ダッシュボード</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>my-office/ を見える化</div>
            </div>
          </section>

          {/* 読み込み中・エラー */}
          {!data && (
            <div className="ov-abs" style={{ left: L.org.x + L.org.w / 2 - 180, top: L.cardTop, width: 360, padding: 16, textAlign: "center", border: `1px solid ${error ? "var(--live)" : "var(--border)"}`, borderRadius: 10, background: "var(--card)", color: error ? "var(--live-text)" : "var(--muted)", fontSize: 13 }}>
              {error ? `読み込めませんでした: ${error.message}` : "読み込み中…"}
            </div>
          )}

          {/* 下の活動ログ */}
          <footer aria-label="最近の更新" className="ov-abs" style={{ left: L.M, top: L.footerTop, width: L.LW - L.M * 2, height: 40, overflow: "hidden", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
            {tickerItems.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>まだ更新はありません。</span>
            ) : (
              <div className="mo-track" style={{ animationDuration: `${tickerSeconds}s` }}>
                {tickerItems.map((t, i) => (
                  <button
                    key={`${t.path}-${i}`}
                    type="button"
                    onClick={() => go({ view: "tree", file: t.path })}
                    title={`${t.date} ${t.time} ${t.path}`}
                    style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--text-sub)", whiteSpace: "nowrap" }}
                    tabIndex={i < activity.length ? 0 : -1}
                    aria-hidden={i >= activity.length ? true : undefined}
                  >
                    <b className="mono" style={{ color: "var(--text-head)", marginRight: 6 }}>
                      {t.time}
                    </b>
                    <b style={{ color: "var(--text)" }}>{t.staff}</b> <span style={{ color: "var(--accent)" }}>→</span> <b style={{ color: "var(--text)" }}>{t.file}</b> を更新
                  </button>
                ))}
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

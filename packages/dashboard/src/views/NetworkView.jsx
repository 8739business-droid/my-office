// ネットワーク図。組織フォルダ → 部署 → サブフォルダを、SVG で放射状に描く(外部ライブラリなし)。
import { useEffect, useMemo, useRef, useState } from "react";
import { useJson } from "../api.js";
import PageShell from "../components/PageShell.jsx";
import { STATE_LABEL, STATE_VAR, clip, deptColor } from "../departments.js";

function countFiles(node) {
  if (node.type === "file") return 1;
  return (node.children || []).reduce((s, c) => s + countFiles(c), 0);
}

function useElementSize(ref) {
  const [size, setSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 600 });
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** 配置を計算する */
function layoutGraph(tree, departments, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const deptNodes = (tree?.children || []).filter((c) => c.type === "dir");
  const info = Object.fromEntries((departments || []).map((d) => [d.id, d]));
  const n = deptNodes.length;
  const minSide = Math.min(w, h);
  const r1 = n <= 1 ? 0 : minSide * 0.25;
  const r2 = Math.max(70, minSide * 0.17);
  const nodes = [{ id: "__org", kind: "org", x: cx, y: cy, r: 34, label: "my-office", sub: `${countFiles(tree || { children: [] })} ファイル` }];
  const edges = [];
  deptNodes.forEach((d, i) => {
    const angle = n <= 1 ? Math.PI / 2 : -Math.PI / 2 + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(angle) * r1;
    const y = cy + Math.sin(angle) * r1;
    const meta = info[d.path];
    const files = countFiles(d);
    const color = deptColor(d.path);
    nodes.push({
      id: d.path,
      kind: "dept",
      x,
      y,
      r: 20 + Math.min(12, Math.sqrt(files) * 3),
      label: meta?.name || d.name,
      sub: meta ? `${meta.staff} ・ ${STATE_LABEL[meta.state]}` : `${files} ファイル`,
      color,
      state: meta?.state || "idle",
      dept: d.path,
    });
    edges.push({ from: [cx, cy], to: [x, y], color, state: meta?.state || "idle" });
    const subs = (d.children || []).filter((c) => c.type === "dir");
    const m = subs.length;
    // サブフォルダは、部署から外向きの扇形に並べる(部署が1つだけなら下向き)
    const spread = Math.min(Math.PI * (n <= 1 ? 1.4 : 0.9), m * 0.5);
    subs.forEach((s, k) => {
      const a = m === 1 ? angle : angle - spread / 2 + (k / (m - 1)) * spread;
      const sx = x + Math.cos(a) * r2;
      const sy = y + Math.sin(a) * r2;
      const sf = countFiles(s);
      nodes.push({ id: s.path, kind: "sub", x: sx, y: sy, r: 9 + Math.min(10, Math.sqrt(sf) * 2.5), label: `${s.name}/`, sub: `${sf} ファイル`, color, dept: d.path });
      edges.push({ from: [x, y], to: [sx, sy], color, state: "sub" });
    });
  });
  return { nodes, edges };
}

export default function NetworkView({ go, nav, live }) {
  const { data: tree, error } = useJson("/api/tree", [live.version]);
  const { data: overview } = useJson("/api/overview", [live.version]);
  const wrapRef = useRef(null);
  const { w, h } = useElementSize(wrapRef);
  const graph = useMemo(() => layoutGraph(tree, overview?.departments, w, h), [tree, overview, w, h]);

  return (
    <PageShell title={<>ネットワーク図</>} nav={nav}>
      <div className="net-wrap" ref={wrapRef}>
        {error && <div className="err">{error.message}</div>}
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="組織フォルダ、部署、サブフォルダのつながり">
          {graph.edges.map((e, i) => (
            <g key={i}>
            {e.state === "active" && <line x1={e.from[0]} y1={e.from[1]} x2={e.to[0]} y2={e.to[1]} stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="2" />}
            <line
              x1={e.from[0]}
              y1={e.from[1]}
              x2={e.to[0]}
              y2={e.to[1]}
              stroke={e.state === "sub" ? e.color : e.state === "idle" ? "var(--line-idle)" : "var(--accent)"}
              strokeOpacity={e.state === "sub" ? 0.45 : 0.85}
              strokeWidth={e.state === "sub" ? 1.2 : 2}
              className={e.state === "active" ? "mo-flow" : undefined}
            />
            </g>
          ))}
          {graph.nodes.map((n) => {
            const clickable = n.kind !== "org";
            const onClick = () => (n.kind === "dept" || n.kind === "sub" ? go({ view: "dept", dept: n.dept }) : null);
            const fill = n.kind === "org" ? "var(--card-strong)" : n.kind === "dept" ? n.color : "var(--card)";
            return (
              <g
                key={n.id}
                className={clickable ? "net-node" : undefined}
                onClick={clickable ? onClick : undefined}
                onKeyDown={clickable ? (ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), onClick()) : undefined}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "button" : undefined}
                aria-label={clickable ? `${n.label} を開く` : undefined}
              >
                <title>{`${n.label}\n${n.sub}`}</title>
                {n.kind === "dept" && n.state === "active" && <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={STATE_VAR.active} strokeWidth="2" className="mo-live" />}
                <circle cx={n.x} cy={n.y} r={n.r} fill={fill} fillOpacity={n.kind === "dept" ? 0.9 : 1} stroke={n.kind === "org" ? "var(--sky)" : n.kind === "sub" ? n.color : "var(--ring)"} strokeWidth={n.kind === "org" ? 2 : 1.5} />
                <text x={n.x} y={n.kind === "sub" ? n.y + n.r + 13 : n.y + n.r + 16} textAnchor="middle" fontSize={n.kind === "sub" ? 11 : 13} fontWeight={n.kind === "sub" ? 400 : 700} fill="var(--text-head)">
                  {clip(n.label, 14)}
                </text>
                {n.kind !== "sub" && (
                  <text x={n.x} y={n.y + n.r + 31} textAnchor="middle" fontSize="11" fill="var(--muted)">
                    {n.sub}
                  </text>
                )}
                {n.kind === "org" && (
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--accent)">
                    ✳
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="net-legend">
          <span>● 円の大きさ = ファイル数</span>
          <span style={{ color: "var(--st-active)" }}>━ 稼働中(10分以内)</span>
          <span style={{ color: "var(--accent)" }}>━ 最近(24時間以内)</span>
          <span>━ 待機</span>
          <span>部署やフォルダを押すと詳細へ</span>
        </div>
      </div>
    </PageShell>
  );
}

// 部署詳細画面。ファイル一覧と、Markdown のプレビュー/生テキスト。
import { useJson } from "../api.js";
import Avatar from "../components/Avatar.jsx";
import FileViewer from "../components/FileViewer.jsx";
import PageShell from "../components/PageShell.jsx";
import { STATE_LABEL, STATE_VAR, ago, deptColor, shortDateTime, statusClass } from "../departments.js";

export default function DepartmentView({ route, go, nav, live }) {
  const { data, error } = useJson(`/api/department/${encodeURIComponent(route.dept)}`, [live.version]);
  const color = deptColor(route.dept);
  const selected = route.file || null;

  const title = (
    <>
      <button type="button" className="ov-pill-btn" onClick={() => go({ view: "overview" })} aria-label="概要へ戻る">
        ← 概要
      </button>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: "inline-block" }} />
      <span className="ov-ellipsis">{data ? data.name : route.dept}</span>
    </>
  );

  if (error) {
    return (
      <PageShell title={title} nav={nav}>
        <div className="err">{error.status === 404 ? `部署「${route.dept}」は見つかりません。` : error.message}</div>
      </PageShell>
    );
  }

  const files = data?.files || [];
  return (
    <PageShell title={title} nav={nav}>
      {data && (
        <div className="dept-head">
          <Avatar id={data.id} name={data.staff} hasAsset={data.hasAsset} size={52} color={data.id === "secretary" ? "#042f2e" : "#0a0f17"} version={live.version} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {data.name} ・ <span className="mono">{data.id}/</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)" }}>{data.staff}</div>
            <div style={{ fontSize: 13, color: "var(--text-sub)" }}>{data.role || "役割はまだ書かれていません(部署の CLAUDE.md の「## 役割」)"}</div>
          </div>
          <div className="dept-stats">
            <div className="ov-tile">
              <div className="ov-tile-label">状態</div>
              <div className="ov-tile-value" style={{ color: STATE_VAR[data.state], fontSize: 15 }}>
                {STATE_LABEL[data.state]}
              </div>
            </div>
            <div className="ov-tile">
              <div className="ov-tile-label">{data.ratio.kind === "todo" ? "今日の TODO(未完了/全体)" : "進行中/ファイル数"}</div>
              <div className="ov-tile-value mono">
                {data.ratio.active}/{data.ratio.total}
              </div>
            </div>
            <div className="ov-tile">
              <div className="ov-tile-label">ファイル数</div>
              <div className="ov-tile-value mono">{data.fileCount}</div>
            </div>
            <div className="ov-tile">
              <div className="ov-tile-label">最終更新</div>
              <div className="ov-tile-value" style={{ fontSize: 15 }}>
                {ago(data.lastModified)}
              </div>
            </div>
          </div>
          {Object.keys(data.statusCounts).length > 0 && (
            <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(data.statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([s, n]) => (
                  <span key={s} className={`badge ${statusClass(s)}`}>
                    {s} {n}件
                  </span>
                ))}
              {data.delivered && <span className="badge st-done">✓ 納品 {data.delivered.title}</span>}
            </div>
          )}
        </div>
      )}
      <div className="split" style={{ height: "calc(100vh - 51px - 32px - 140px)", minHeight: 420 }}>
        <div className="panel">
          <div className="panel-head">ファイル {files.length} 件(新しい順)</div>
          {data && files.length === 0 && <div className="empty">この部署にはまだファイルがありません。</div>}
          <ul className="file-list">
            {files.map((f) => (
              <li key={f.path}>
                <button type="button" className="file-item" aria-current={selected === f.path ? "true" : undefined} onClick={() => go({ view: "dept", dept: route.dept, file: f.path }, true)}>
                  <div className="file-item-title ov-ellipsis">{f.title}</div>
                  <div className="file-item-meta">
                    <span className="mono ov-ellipsis" style={{ maxWidth: "100%" }}>
                      {f.path.slice(route.dept.length + 1)}
                    </span>
                    {f.status && <span className={`badge ${statusClass(f.status)}`}>{f.status}</span>}
                    <span>{shortDateTime(f.mtime)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <FileViewer path={selected} version={live.version} />
        </div>
      </div>
    </PageShell>
  );
}

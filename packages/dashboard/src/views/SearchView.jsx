// 全文検索画面。
import { useEffect, useState } from "react";
import { useJson } from "../api.js";
import PageShell from "../components/PageShell.jsx";
import { deptColor, shortDateTime, statusClass } from "../departments.js";

/** 一致した部分に印を付ける */
function Highlight({ text, q }) {
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out = [];
  let i = 0;
  let k = 0;
  for (;;) {
    const at = lower.indexOf(needle, i);
    if (at === -1) break;
    out.push(text.slice(i, at));
    out.push(<mark key={k++}>{text.slice(at, at + needle.length)}</mark>);
    i = at + needle.length;
  }
  out.push(text.slice(i));
  return out;
}

export default function SearchView({ route, go, nav, live }) {
  const [input, setInput] = useState(route.q || "");
  const q = (route.q || "").trim();

  // 入力が止まってから 250ms で検索する
  useEffect(() => {
    const t = setTimeout(() => {
      if (input.trim() !== q) go({ view: "search", q: input.trim() }, true);
    }, 250);
    return () => clearTimeout(t);
  }, [input, q, go]);

  const { data, error, loading } = useJson(q ? `/api/search?q=${encodeURIComponent(q)}` : null, [live.version]);
  const results = data?.results || [];

  return (
    <PageShell title={<>全文検索</>} nav={nav}>
      <form className="search-box" role="search" onSubmit={(e) => e.preventDefault()}>
        <input type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ファイルの中身や名前で探す(例: 料金、stripe)" aria-label="検索する言葉" autoFocus />
      </form>
      <div style={{ maxWidth: 900, marginTop: 8 }}>
        {error && <div className="err">{error.message}</div>}
        {q && data && (
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {results.length === 0 ? "見つかりませんでした。" : `${results.length} 件${results.length >= 30 ? "(最大30件まで表示)" : ""}`}
            {loading ? " ・ 更新中…" : ""}
          </div>
        )}
        {!q && <div className="empty" style={{ textAlign: "left", paddingLeft: 0 }}>言葉を入れると、組織フォルダの Markdown ファイルをまとめて探します(CLAUDE.md と _ で始まるものは除く)。</div>}
        {results.map((r) => (
          <button key={r.path} type="button" className="search-result" onClick={() => (r.dept ? go({ view: "dept", dept: r.dept, file: r.path }) : go({ view: "tree", file: r.path }))}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {r.dept && <span style={{ width: 10, height: 10, borderRadius: 3, background: deptColor(r.dept), display: "inline-block" }} />}
              <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>
                <Highlight text={r.title} q={q} />
              </span>
              {r.status && <span className={`badge ${statusClass(r.status)}`}>{r.status}</span>}
              <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>
                {shortDateTime(r.mtime)}
              </span>
            </div>
            <div className="mono muted" style={{ fontSize: 11, marginTop: 2 }}>
              <Highlight text={r.path} q={q} />
            </div>
            {r.matches.map((m) => (
              <div key={m.line} className="search-line">
                <span className="ln mono">{m.line}</span>
                <span>
                  <Highlight text={m.text} q={q} />
                </span>
              </div>
            ))}
            {r.matchCount > r.matches.length && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>ほか {r.matchCount - r.matches.length} 行</div>}
          </button>
        ))}
      </div>
    </PageShell>
  );
}

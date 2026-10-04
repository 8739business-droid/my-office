import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useJson } from "../api.js";
import { shortDateTime, statusClass } from "../departments.js";

const MODE_KEY = "my-office-dashboard:viewer-mode";

function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === "raw" ? "raw" : "preview";
  } catch {
    return "preview";
  }
}

// 外部への通信をしないよう、Markdown 内の画像は読み込まずに代わりの文字を出す。リンクは新しいタブで開く。
const MD_COMPONENTS = {
  img: ({ alt, src }) => (
    <span className="badge" title={src}>
      画像: {alt || src}
    </span>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

/** 設定欄の値を表示用の文字列にする */
function fmValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "[]";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * ファイルの中身を、Markdown のプレビューと生テキストで切り替えて見せる(読むだけ)。
 */
export default function FileViewer({ path, version }) {
  const [mode, setMode] = useState(loadMode);
  const { data, error, loading } = useJson(path ? `/api/file?path=${encodeURIComponent(path)}` : null, [version]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* 保存できなくても動く */
    }
  }, [mode]);

  if (!path) return <div className="empty">左の一覧からファイルを選ぶと、ここに中身が出ます。</div>;
  if (error) return <div className="err">{error.message}</div>;
  if (!data) return <div className="empty">{loading ? "読み込み中…" : ""}</div>;

  const fm = data.frontmatter && Object.keys(data.frontmatter).length ? data.frontmatter : null;
  return (
    <div>
      <div className="viewer-toolbar">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ov-ellipsis" style={{ fontWeight: 700, color: "var(--text-strong)", fontSize: 14 }} title={data.title}>
            {data.title}
          </div>
          <div className="mono ov-ellipsis" style={{ fontSize: 11, color: "var(--muted)" }} title={data.path}>
            {data.path} ・ 更新 {shortDateTime(data.mtime)}
          </div>
        </div>
        {data.status && <span className={`badge ${statusClass(data.status)}`}>{data.status}</span>}
        {data.isMarkdown && (
          <div className="seg" role="group" aria-label="表示の切り替え">
            <button type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>
              プレビュー
            </button>
            <button type="button" aria-pressed={mode === "raw"} onClick={() => setMode("raw")}>
              生テキスト
            </button>
          </div>
        )}
      </div>
      {data.isMarkdown && mode === "preview" ? (
        <>
          {fm && (
            <table className="fm-table" aria-label="設定欄">
              <tbody>
                {Object.entries(fm).map(([k, v]) => (
                  <tr key={k}>
                    <th className="mono">{k}</th>
                    <td>{fmValue(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={MD_COMPONENTS}>
              {data.body}
            </ReactMarkdown>
          </div>
        </>
      ) : (
        <pre className="raw mono">{data.content}</pre>
      )}
    </div>
  );
}

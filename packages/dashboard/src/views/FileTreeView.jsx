// ファイルツリー画面。左にツリー、右に中身。
import { useEffect, useState } from "react";
import { useJson } from "../api.js";
import FileViewer from "../components/FileViewer.jsx";
import PageShell from "../components/PageShell.jsx";

const OPEN_KEY = "my-office-dashboard:tree-open";

function loadOpen() {
  try {
    const v = JSON.parse(localStorage.getItem(OPEN_KEY) || "null");
    return Array.isArray(v) ? new Set(v) : null;
  } catch {
    return null;
  }
}

function countFiles(node) {
  if (node.type === "file") return 1;
  return (node.children || []).reduce((s, c) => s + countFiles(c), 0);
}

function TreeNode({ node, open, toggle, selected, onSelect, depth }) {
  if (node.type === "file") {
    return (
      <li>
        <button type="button" className="tree-row" aria-current={selected === node.path ? "true" : undefined} onClick={() => onSelect(node.path)} title={node.path}>
          <span className="tree-icon">・</span>
          <span className="ov-ellipsis">{node.name}</span>
        </button>
      </li>
    );
  }
  const isOpen = open.has(node.path);
  return (
    <li>
      <button type="button" className="tree-row" aria-expanded={isOpen} onClick={() => toggle(node.path)}>
        <span className="tree-icon">{isOpen ? "▾" : "▸"}</span>
        <span className="ov-ellipsis" style={{ fontWeight: depth === 0 ? 700 : 400 }}>
          {node.name}/
        </span>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 11 }}>
          {countFiles(node)}
        </span>
      </button>
      {isOpen && (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.path} node={c} open={open} toggle={toggle} selected={selected} onSelect={onSelect} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function FileTreeView({ route, go, nav, live }) {
  const { data, error } = useJson("/api/tree", [live.version]);
  const [open, setOpen] = useState(() => loadOpen() || new Set());

  // 最初は部署のフォルダまで開いておく。選ばれたファイルの親も開く
  useEffect(() => {
    if (!data) return;
    setOpen((prev) => {
      const next = new Set(prev);
      if (prev.size === 0) for (const c of data.children || []) if (c.type === "dir") next.add(c.path);
      if (route.file) {
        const parts = route.file.split("/");
        for (let i = 1; i < parts.length; i++) next.add(parts.slice(0, i).join("/"));
      }
      return next;
    });
  }, [data, route.file]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify([...open]));
    } catch {
      /* 保存できなくても動く */
    }
  }, [open]);

  const toggle = (p) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  return (
    <PageShell title={<>ファイル</>} nav={nav}>
      <div className="split">
        <div className="panel">
          <div className="panel-head">my-office/ ・ CLAUDE.md と _ で始まるものは出しません</div>
          {error && <div className="err">{error.message}</div>}
          {data && (
            <ul className="tree">
              {data.children.length === 0 && <li className="empty">ファイルはまだありません。</li>}
              {data.children.map((c) => (
                <TreeNode key={c.path} node={c} open={open} toggle={toggle} selected={route.file} onSelect={(p) => go({ view: "tree", file: p }, true)} depth={0} />
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <FileViewer path={route.file} version={live.version} />
        </div>
      </div>
    </PageShell>
  );
}

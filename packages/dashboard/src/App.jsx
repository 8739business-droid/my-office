import { useCallback, useEffect, useState } from "react";
import { useLiveUpdates } from "./api.js";
import Overview from "./views/Overview.jsx";
import FileTreeView from "./views/FileTreeView.jsx";
import NetworkView from "./views/NetworkView.jsx";
import SearchView from "./views/SearchView.jsx";
import DepartmentView from "./views/DepartmentView.jsx";

const THEME_KEY = "my-office-dashboard:theme";

// ルーターは使わず、URL の # 以降で画面を覚える(戻るボタンが効くように)
// 例: #/overview  #/tree?file=…  #/network  #/search?q=…  #/dept/research?file=…
function parseHash(hash) {
  const h = (hash || "").replace(/^#\/?/, "");
  const [p, qs = ""] = h.split("?");
  const params = new URLSearchParams(qs);
  const parts = p.split("/").filter(Boolean).map(decodeURIComponent);
  const view = parts[0] || "overview";
  if (view === "dept" && parts[1]) return { view: "dept", dept: parts[1], file: params.get("file") || null };
  if (view === "tree") return { view, file: params.get("file") || null };
  if (view === "search") return { view, q: params.get("q") || "" };
  if (view === "network") return { view };
  return { view: "overview" };
}

function toHash(route) {
  const params = new URLSearchParams();
  if (route.file) params.set("file", route.file);
  if (route.q) params.set("q", route.q);
  const qs = params.toString() ? `?${params}` : "";
  if (route.view === "dept") return `#/dept/${encodeURIComponent(route.dept)}${qs}`;
  return `#/${route.view || "overview"}${qs}`;
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const [theme, setTheme] = useState(loadTheme);
  const live = useLiveUpdates();

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* 保存できなくても動く */
    }
  }, [theme]);

  /** 画面を切り替える。replace=true なら履歴を増やさない */
  const go = useCallback((next, replace = false) => {
    const hash = toHash(next);
    if (window.location.hash === hash) return;
    if (replace) {
      window.history.replaceState(null, "", hash);
      setRoute(parseHash(hash));
    } else {
      window.location.hash = hash;
    }
  }, []);

  const nav = {
    view: route.view === "dept" ? null : route.view,
    go,
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
  const common = { route, go, nav, live };

  useEffect(() => {
    const titles = { overview: "概要", tree: "ファイル", network: "ネットワーク", search: "検索", dept: "部署" };
    document.title = `${titles[route.view] || "概要"} | my-office ダッシュボード`;
  }, [route.view]);

  switch (route.view) {
    case "tree":
      return <FileTreeView {...common} />;
    case "network":
      return <NetworkView {...common} />;
    case "search":
      return <SearchView {...common} />;
    case "dept":
      return <DepartmentView {...common} />;
    default:
      return <Overview {...common} />;
  }
}

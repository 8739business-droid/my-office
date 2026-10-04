// 画面の切り替えとテーマの切り替え。

const ITEMS = [
  { view: "overview", label: "概要" },
  { view: "tree", label: "ファイル" },
  { view: "network", label: "ネットワーク" },
  { view: "search", label: "検索" },
];

export default function Nav({ view, go, theme, toggleTheme }) {
  return (
    <nav className="nav" aria-label="画面の切り替え">
      {ITEMS.map((it) => (
        <button key={it.view} type="button" aria-current={view === it.view ? "page" : undefined} onClick={() => go({ view: it.view })}>
          {it.label}
        </button>
      ))}
      <button
        type="button"
        className="nav-theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "ライトに切り替え" : "ダークに切り替え"}
        aria-label={theme === "dark" ? "ライトテーマに切り替え" : "ダークテーマに切り替え"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </nav>
  );
}

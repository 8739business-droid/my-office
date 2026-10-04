import Nav from "./Nav.jsx";

/** 概要以外の画面の枠(上のバー + 本文) */
export default function PageShell({ title, nav, children, right }) {
  return (
    <div className="page">
      <header className="page-bar">
        <div className="page-title">{title}</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {right}
          <Nav {...nav} />
        </div>
      </header>
      <main className="page-body">{children}</main>
    </div>
  );
}

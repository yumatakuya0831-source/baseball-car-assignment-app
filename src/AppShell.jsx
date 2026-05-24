import "./setting/style.css";

export default function AppShell({ title, subtitle, children }) {
  return (
    <div className="app">
      <div className="phone-frame">
        <header className="app-header">
          <div className="team-title">{title}</div>
          <div className="team-subtitle">{subtitle}</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

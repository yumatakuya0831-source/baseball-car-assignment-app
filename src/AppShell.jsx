import "./setting/style.css";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function AppShell({ title, subtitle, children }) {
  const user = auth.currentUser;

  const handleLogout = async () => {
    const ok = window.confirm("ログアウトしますか？");
    if (!ok) return;

    try {
      await signOut(auth);
    } catch (error) {
      console.error("logout error:", error);
      alert("ログアウトに失敗しました。");
    }
  };

  return (
    <div className="app">
      <div className="phone-frame">
        <header className="app-header">
          <div className="team-title">{title}</div>
          <div className="team-subtitle">{subtitle}</div>
          <div className="user-bar">
            <span className="user-name">{user?.displayName ?? user?.email}</span>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

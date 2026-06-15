import AppShell from "../AppShell.jsx";
import { navigateTo, routes } from "../routes";

export default function SettingHome() {
  return (
    <AppShell title="野球配車アプリ" subtitle="設定">
      <section className="menu-section">
        <button
          type="button"
          className="menu-button import-menu-button"
          onClick={() => navigateTo(routes.importChouseisan)}
        >
          <span className="menu-button-title">調整さん取込</span>
          <span className="menu-button-text">遠征ごとの参加選手と配車可能車両を自動登録</span>
        </button>

        <button
          type="button"
          className="menu-button assignment-menu-button"
          onClick={() => navigateTo(routes.expeditions)}
        >
          <span className="menu-button-title">配車作成</span>
          <span className="menu-button-text">試合ごとの参加者・道具を車両へ手動配車</span>
        </button>

        <button
          type="button"
          className="menu-button history-menu-button"
          onClick={() => navigateTo(routes.assignmentHistory)}
        >
          <span className="menu-button-title">配車履歴</span>
          <span className="menu-button-text">過去の配車結果をLINE用にコピー</span>
        </button>
      </section>
    </AppShell>
  );
}

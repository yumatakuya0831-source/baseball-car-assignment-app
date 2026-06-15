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
          className="menu-button player-menu-button"
          onClick={() => navigateTo(routes.players)}
        >
          <span className="menu-button-title">選手登録</span>
          <span className="menu-button-text">選手名の追加・編集・削除</span>
        </button>

        <button
          type="button"
          className="menu-button car-menu-button"
          onClick={() => navigateTo(routes.cars)}
        >
          <span className="menu-button-title">配車登録</span>
          <span className="menu-button-text">車両・運転者・定員の追加・編集・削除</span>
        </button>
      </section>
    </AppShell>
  );
}

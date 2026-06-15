import { useEffect, useState } from "react";
import AppShell from "../AppShell.jsx";
import { assignmentPath, navigateTo, routes } from "../routes";
import { subscribeExpeditions } from "./expeditionService";

export default function ExpeditionList() {
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeExpeditions(
      (items) => {
        setExpeditions(items);
        setLoading(false);
      },
      (error) => {
        console.error("expeditions read error:", error);
        alert("遠征データの取得に失敗しました。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AppShell title="遠征一覧" subtitle="配車作成">
      <section className="list-section no-top-margin">
        {loading ? (
          <div className="card empty-card">読み込み中です...</div>
        ) : expeditions.length === 0 ? (
          <div className="card empty-card">
            調整さん取込から遠征データを登録してください。
          </div>
        ) : (
          expeditions.map((expedition) => (
            <button
              type="button"
              className="card expedition-card"
              key={expedition.id}
              onClick={() => navigateTo(assignmentPath(expedition.id))}
            >
              <span className="list-card-title">{expedition.title}</span>
              <span className="list-card-meta">
                選手 {expedition.playerCount ?? 0}名 / 父 {expedition.fatherCount ?? 0}名 / 母{" "}
                {expedition.motherCount ?? 0}名 / 兄弟 {expedition.siblingCount ?? 0}名 / 車{" "}
                {expedition.carCount ?? 0}台
              </span>
            </button>
          ))
        )}
      </section>

      <button type="button" className="back-button" onClick={() => navigateTo(routes.setting)}>
        設定に戻る
      </button>
    </AppShell>
  );
}

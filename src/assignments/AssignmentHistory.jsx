import { useEffect, useState } from "react";
import AppShell from "../AppShell.jsx";
import { assignmentPath, assignmentResultPath, navigateTo, routes } from "../routes";
import { subscribeExpeditions } from "../expeditions/expeditionService";

export default function AssignmentHistory() {
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeExpeditions(
      (items) => {
        setExpeditions(items);
        setLoading(false);
      },
      (error) => {
        console.error("assignment history read error:", error);
        alert("配車履歴の取得に失敗しました。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AppShell title="配車履歴" subtitle="LINE用コピー">
      <section className="list-section no-top-margin">
        {loading ? (
          <div className="card empty-card">読み込み中です...</div>
        ) : expeditions.length === 0 ? (
          <div className="card empty-card">配車履歴がありません。</div>
        ) : (
          expeditions.map((expedition) => {
            const hasAssignment = Boolean(expedition.assignmentUpdatedAt);

            return (
              <div className="card history-card" key={expedition.id}>
                <div className="history-card-main">
                  <div className="list-card-title">{expedition.title}</div>
                  <div className="list-card-meta">
                    選手 {expedition.playerCount ?? 0}名 / 車 {expedition.carCount ?? 0}台
                  </div>
                  <div className={`history-status ${hasAssignment ? "done" : "pending"}`}>
                    {hasAssignment ? "配車保存済み" : "配車未保存"}
                  </div>
                </div>

                <div className="history-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => navigateTo(assignmentResultPath(expedition.id))}
                    disabled={!hasAssignment}
                  >
                    コピー
                  </button>
                  {!hasAssignment && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => navigateTo(assignmentPath(expedition.id))}
                    >
                      作成
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <button type="button" className="back-button" onClick={() => navigateTo(routes.setting)}>
        設定に戻る
      </button>
    </AppShell>
  );
}

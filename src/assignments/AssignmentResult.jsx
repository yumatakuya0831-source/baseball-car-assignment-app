import { useEffect, useMemo, useState } from "react";
import AppShell from "../AppShell.jsx";
import { assignmentPath, navigateTo, routes } from "../routes";
import { loadAssignmentData } from "./assignmentService";
import {
  buildAssignmentItems,
  calculateUsedSeats,
  getAssignedItemIds,
} from "./assignmentLogic";

export default function AssignmentResult({ expeditionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const loadedData = await loadAssignmentData(expeditionId);
        setData(loadedData);
      } catch (error) {
        console.error("assignment result load error:", error);
        alert("配車結果の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [expeditionId]);

  const items = useMemo(() => {
    if (!data) return [];
    return buildAssignmentItems(data);
  }, [data]);

  const itemsById = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item])),
    [items]
  );

  const assignmentsByCarId = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      data.assignments.map((assignment) => [
        assignment.carId,
        {
          passengerIds: assignment.passengerIds ?? [],
          toolIds: assignment.toolIds ?? [],
        },
      ])
    );
  }, [data]);

  const assignedItemIds = new Set(getAssignedItemIds(assignmentsByCarId));
  const unassignedItems = items.filter((item) => !assignedItemIds.has(item.id));

  if (loading) {
    return (
      <AppShell title="配車結果" subtitle="読み込み">
        <div className="card empty-card">読み込み中です...</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="配車結果" subtitle="エラー">
        <div className="card empty-card">配車結果を表示できません。</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="配車結果" subtitle={data.expedition.title}>
      <section className="assignment-cars result-cars">
        {data.cars.map((car) => {
          const assignment = assignmentsByCarId[car.id] ?? { passengerIds: [], toolIds: [] };
          const assignedItems = [...assignment.passengerIds, ...assignment.toolIds]
            .map((itemId) => itemsById[itemId])
            .filter(Boolean);
          const usedSeats = calculateUsedSeats(car, assignedItems);
          const capacity = Number(car.capacity);
          const isOverCapacity = capacity > 0 && usedSeats > capacity;

          return (
            <div className={`card result-card ${isOverCapacity ? "over-capacity" : ""}`} key={car.id}>
              <div className="assignment-zone-header">
                <div>
                  <h2 className="section-title">{car.carName}</h2>
                  <div className="list-card-meta">運転者：{car.driverName}</div>
                </div>
                <span className="count-badge">
                  {capacity > 0 ? `${usedSeats}/${capacity}` : `${usedSeats}/未設定`}
                </span>
              </div>

              <div className="result-list">
                {assignedItems.length === 0 ? (
                  <div className="empty-assignment">対象なし</div>
                ) : (
                  assignedItems.map((item) => (
                    <div className="result-row" key={item.id}>
                      <span className="item-label">{item.label}</span>
                      <span>{item.name}</span>
                      <span className="item-seat">{item.seatCost}名分</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>

      {unassignedItems.length > 0 && (
        <section className="card drop-zone unassigned-zone">
          <div className="assignment-zone-header">
            <h2 className="section-title">未配車</h2>
            <span className="count-badge">{unassignedItems.length}</span>
          </div>
          <div className="result-list">
            {unassignedItems.map((item) => (
              <div className="result-row" key={item.id}>
                <span className="item-label">{item.label}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="action-row">
        <button
          type="button"
          className="secondary-btn wide-btn"
          onClick={() => navigateTo(assignmentPath(expeditionId))}
        >
          編集
        </button>
        <button type="button" className="back-button inline-back" onClick={() => navigateTo(routes.expeditions)}>
          遠征一覧
        </button>
      </div>
    </AppShell>
  );
}

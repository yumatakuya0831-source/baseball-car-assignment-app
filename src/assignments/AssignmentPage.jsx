import { useEffect, useMemo, useState } from "react";
import AppShell from "../AppShell.jsx";
import { assignmentResultPath, navigateTo, routes } from "../routes";
import {
  addTool,
  deleteTool,
  ensureDefaultTool,
  loadAssignmentData,
  saveAssignments,
  updateCarCapacity,
} from "./assignmentService";
import {
  buildAssignmentItems,
  calculateUsedSeats,
  getAssignedItemIds,
  moveAssignmentItem,
} from "./assignmentLogic";

export default function AssignmentPage({ expeditionId }) {
  const [data, setData] = useState(null);
  const [assignmentsByCarId, setAssignmentsByCarId] = useState({});
  const [toolName, setToolName] = useState("");
  const [draggingItemId, setDraggingItemId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadAssignmentData(expeditionId)
      .then((loadedData) => {
        if (!isMounted) return;
        return ensureDefaultTool(expeditionId, loadedData.tools).then((result) =>
          result.added ? { ...loadedData, tools: result.tools } : loadedData
        );
      })
      .then((loadedData) => {
        if (!isMounted || !loadedData) return;
        setData(loadedData);
        setAssignmentsByCarId(buildInitialAssignments(loadedData));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("assignment load error:", error);
        alert(error.message || "配車データの取得に失敗しました。");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [expeditionId]);

  const items = useMemo(() => {
    if (!data) return [];
    return buildAssignmentItems(data);
  }, [data]);

  const itemsById = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item])),
    [items]
  );

  const assignedItemIds = useMemo(
    () => new Set(getAssignedItemIds(assignmentsByCarId)),
    [assignmentsByCarId]
  );

  const unassignedItems = items.filter((item) => !assignedItemIds.has(item.id));
  const selectedItem = selectedItemId ? itemsById[selectedItemId] : null;

  const handleDrop = (targetCarId) => {
    if (!draggingItemId) return;
    setAssignmentsByCarId((current) =>
      moveAssignmentItem(current, draggingItemId, targetCarId)
    );
    setDraggingItemId("");
  };

  const handleMoveSelectedItem = (targetCarId) => {
    if (!selectedItemId) return;
    setAssignmentsByCarId((current) =>
      moveAssignmentItem(current, selectedItemId, targetCarId)
    );
    setSelectedItemId("");
  };

  const handleAddTool = async (event) => {
    event.preventDefault();
    try {
      const newTool = await addTool(expeditionId, toolName);
      setToolName("");
      setData((current) =>
        current ? { ...current, tools: [...current.tools, newTool] } : current
      );
    } catch (error) {
      alert(error.message || "道具の登録に失敗しました。");
    }
  };

  const handleDeleteTool = async (item) => {
    const ok = window.confirm(`${item.name} を削除しますか？`);
    if (!ok) return;

    try {
      await deleteTool(expeditionId, item.sourceId);
      setAssignmentsByCarId((current) => moveAssignmentItem(current, item.id, null));
      setSelectedItemId((current) => (current === item.id ? "" : current));
      setData((current) =>
        current
          ? {
              ...current,
              tools: current.tools.filter((tool) => tool.id !== item.sourceId),
            }
          : current
      );
    } catch (error) {
      console.error("tool delete error:", error);
      alert("道具の削除に失敗しました。");
    }
  };

  const handleCapacityBlur = async (car, value) => {
    if (String(car.capacity ?? "") === value) return;
    if (!value) return;

    try {
      await updateCarCapacity(expeditionId, car.id, value);
      setData((current) =>
        current
          ? {
              ...current,
              cars: current.cars.map((currentCar) =>
                currentCar.id === car.id
                  ? { ...currentCar, capacity: Number(value) }
                  : currentCar
              ),
            }
          : current
      );
    } catch (error) {
      alert(error.message || "定員の更新に失敗しました。");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    const overCapacityCars = data.cars.filter((car) => {
      const assignedItems = getItemsForCar(car.id, assignmentsByCarId, itemsById);
      return Number(car.capacity) > 0 && calculateUsedSeats(car, assignedItems) > car.capacity;
    });

    if (overCapacityCars.length > 0) {
      const ok = window.confirm("定員を超えている車があります。このまま保存しますか？");
      if (!ok) return;
    }

    setSaving(true);
    try {
      await saveAssignments(expeditionId, data.cars, assignmentsByCarId, itemsById);
      navigateTo(assignmentResultPath(expeditionId));
    } catch (error) {
      console.error("assignment save error:", error);
      alert("配車の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="配車作成" subtitle="読み込み">
        <div className="card empty-card">読み込み中です...</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="配車作成" subtitle="エラー">
        <div className="card empty-card">配車データを表示できません。</div>
        <button type="button" className="back-button" onClick={() => navigateTo(routes.expeditions)}>
          遠征一覧に戻る
        </button>
      </AppShell>
    );
  }

  return (
    <AppShell title="配車作成" subtitle={data.expedition.title}>
      <section className="card form-card">
        <h2 className="section-title">道具</h2>
        <form className="tool-form" onSubmit={handleAddTool}>
          <input
            type="text"
            value={toolName}
            onChange={(event) => setToolName(event.target.value)}
            placeholder="例：ヘルメット一式"
          />
          <button type="submit" className="primary-btn">
            追加
          </button>
        </form>
        <p className="helper-text tool-note">道具は1個につき2名分として計算します。</p>
      </section>

      <section
        className="card drop-zone unassigned-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleDrop(null)}
      >
        <div className="assignment-zone-header">
          <h2 className="section-title">未配車</h2>
          <span className="count-badge">{unassignedItems.length}</span>
        </div>
        <ItemList
          items={unassignedItems}
          onDragStart={setDraggingItemId}
          onSelect={setSelectedItemId}
          onDeleteTool={handleDeleteTool}
          selectedItemId={selectedItemId}
        />
      </section>

      <section className="assignment-cars">
        {data.cars.map((car) => {
          const assignedItems = getItemsForCar(car.id, assignmentsByCarId, itemsById);
          const usedSeats = calculateUsedSeats(car, assignedItems);
          const capacity = Number(car.capacity);
          const isOverCapacity = capacity > 0 && usedSeats > capacity;
          const capacityLabel = capacity > 0 ? `${usedSeats}/${capacity}` : `${usedSeats}/未設定`;

          return (
            <div
              className={`card drop-zone car-assignment-card ${
                isOverCapacity ? "over-capacity" : ""
              }`}
              key={car.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(car.id)}
            >
              <div className="assignment-zone-header">
                <div>
                  <h2 className="section-title">{car.carName}</h2>
                  <div className="list-card-meta">運転者：{car.driverName}</div>
                </div>
                <span className="count-badge">{capacityLabel}</span>
              </div>

              <label className="capacity-field">
                定員
                <input
                  type="number"
                  min="1"
                  defaultValue={car.capacity ?? ""}
                  placeholder="未設定"
                  onBlur={(event) => handleCapacityBlur(car, event.target.value)}
                />
              </label>

              {isOverCapacity && (
                <div className="inline-warning">定員を超えています。</div>
              )}

              <ItemList
                items={assignedItems}
                onDragStart={setDraggingItemId}
                onSelect={setSelectedItemId}
                onRemove={(itemId) =>
                  setAssignmentsByCarId((current) => moveAssignmentItem(current, itemId, null))
                }
                onDeleteTool={handleDeleteTool}
                selectedItemId={selectedItemId}
              />
            </div>
          );
        })}
      </section>

      {selectedItem && (
        <MovePanel
          cars={data.cars}
          selectedItem={selectedItem}
          assignmentsByCarId={assignmentsByCarId}
          itemsById={itemsById}
          onMove={handleMoveSelectedItem}
          onCancel={() => setSelectedItemId("")}
        />
      )}

      <div className="action-row">
        <button type="button" className="secondary-btn wide-btn" onClick={() => navigateTo(routes.expeditions)}>
          戻る
        </button>
        <button type="button" className="primary-btn" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存して結果へ"}
        </button>
      </div>
    </AppShell>
  );
}

function ItemList({ items, onDragStart, onSelect, onRemove, onDeleteTool, selectedItemId }) {
  if (items.length === 0) {
    return <div className="empty-assignment">対象なし</div>;
  }

  return (
    <div className="assignment-items">
      {items.map((item) => (
        <div
          className={`assignment-item ${
            item.kind === "tool" || item.kind === "manager" ? "tool-item" : ""
          } ${selectedItemId === item.id ? "selected-assignment-item" : ""}`}
          draggable
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(item.id)}
          onDragStart={() => onDragStart(item.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(item.id);
            }
          }}
        >
          <span className="item-label">{item.label}</span>
          <span className="item-name">{item.name}</span>
          <span className="item-seat">{item.seatCost}名分</span>
          {onRemove && (
            <button
              type="button"
              className="mini-btn"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item.id);
              }}
            >
              外す
            </button>
          )}
          {(item.kind === "tool" || item.kind === "manager") && (
            <button
              type="button"
              className="mini-btn danger"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteTool(item);
              }}
            >
              削除
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function MovePanel({
  cars,
  selectedItem,
  assignmentsByCarId,
  itemsById,
  onMove,
  onCancel,
}) {
  return (
    <section className="card move-panel">
      <div className="assignment-zone-header">
        <div>
          <h2 className="section-title">移動先を選択</h2>
          <div className="list-card-meta">
            {selectedItem.label}：{selectedItem.name}
          </div>
        </div>
        <button type="button" className="mini-btn" onClick={onCancel}>
          閉じる
        </button>
      </div>

      <div className="move-destination-list">
        {cars.map((car) => {
          const assignedItems = getItemsForCar(car.id, assignmentsByCarId, itemsById).filter(
            (item) => item.id !== selectedItem.id
          );
          const nextUsedSeats = calculateUsedSeats(car, [...assignedItems, selectedItem]);
          const capacity = Number(car.capacity);
          const isOverCapacity = capacity > 0 && nextUsedSeats > capacity;

          return (
            <button
              type="button"
              className={`move-destination-btn ${isOverCapacity ? "over-capacity-btn" : ""}`}
              key={car.id}
              onClick={() => onMove(car.id)}
            >
              <span className="move-destination-title">{car.carName}</span>
              <span className="move-destination-meta">運転者：{car.driverName}</span>
              <span className="move-destination-meta">
                {capacity > 0 ? `${nextUsedSeats}/${capacity}名` : `${nextUsedSeats}/未設定`}
                {isOverCapacity ? "・定員超過" : ""}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          className="move-destination-btn unassign-btn"
          onClick={() => onMove(null)}
        >
          <span className="move-destination-title">未配車に戻す</span>
          <span className="move-destination-meta">どの車にも入れない状態にします</span>
        </button>
      </div>
    </section>
  );
}

function buildInitialAssignments(data) {
  const assignments = Object.fromEntries(
    data.cars.map((car) => [car.id, { passengerIds: [], toolIds: [] }])
  );

  if (data.assignments.length === 0) {
    const fixedItems = buildAssignmentItems(data).filter((item) => item.fixedCarId);

    fixedItems.forEach((item) => {
      if (!assignments[item.fixedCarId]) return;
      assignments[item.fixedCarId].passengerIds.push(item.id);
    });

    return assignments;
  }

  data.assignments.forEach((assignment) => {
    assignments[assignment.carId] = {
      passengerIds: assignment.passengerIds ?? [],
      toolIds: assignment.toolIds ?? [],
    };
  });

  return assignments;
}

function getItemsForCar(carId, assignmentsByCarId, itemsById) {
  const assignment = assignmentsByCarId[carId] ?? { passengerIds: [], toolIds: [] };
  return [...assignment.passengerIds, ...assignment.toolIds]
    .map((itemId) => itemsById[itemId])
    .filter(Boolean);
}

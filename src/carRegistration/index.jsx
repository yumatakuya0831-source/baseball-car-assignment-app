import { useEffect, useState } from "react";
import AppShell from "../AppShell.jsx";
import { db } from "../../lib/firebase";
import { navigateTo, routes } from "../routes";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function CarRegistration() {
  const [cars, setCars] = useState([]);
  const [carName, setCarName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingCarId, setEditingCarId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("carName", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const carsData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setCars(carsData);
        setLoading(false);
      },
      (error) => {
        console.error("cars read error:", error);
        alert("配車データの取得に失敗しました。Firestoreの設定を確認してください。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetCarForm = () => {
    setCarName("");
    setDriverName("");
    setCapacity("");
    setEditingCarId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedCarName = carName.trim();
    const trimmedDriverName = driverName.trim();
    const numberCapacity = Number(capacity);

    if (!trimmedCarName || !trimmedDriverName || capacity === "") {
      alert("車両名・運転者名・定員を入力してください。");
      return;
    }

    if (!Number.isInteger(numberCapacity) || numberCapacity <= 0) {
      alert("定員は1以上の整数で入力してください。");
      return;
    }

    const isDuplicateCar = cars.some(
      (car) => car.carName === trimmedCarName && car.id !== editingCarId
    );

    if (isDuplicateCar) {
      alert("同じ車両名がすでに登録されています。");
      return;
    }

    try {
      if (editingCarId) {
        await updateDoc(doc(db, "cars", editingCarId), {
          carName: trimmedCarName,
          driverName: trimmedDriverName,
          capacity: numberCapacity,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "cars"), {
          carName: trimmedCarName,
          driverName: trimmedDriverName,
          capacity: numberCapacity,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetCarForm();
    } catch (error) {
      console.error("cars save error:", error);
      alert("配車データの保存に失敗しました。");
    }
  };

  const handleEdit = (car) => {
    setCarName(car.carName);
    setDriverName(car.driverName);
    setCapacity(String(car.capacity));
    setEditingCarId(car.id);
  };

  const handleDelete = async (id) => {
    const target = cars.find((car) => car.id === id);
    if (!target) return;

    const ok = window.confirm(`${target.carName} を削除しますか？`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "cars", id));

      if (editingCarId === id) {
        resetCarForm();
      }
    } catch (error) {
      console.error("cars delete error:", error);
      alert("配車データの削除に失敗しました。");
    }
  };

  return (
    <AppShell title="配車登録" subtitle="設定">
      <section className="card form-card">
        <h2 className="section-title">配車情報</h2>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="carName">車両名</label>
            <input
              id="carName"
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="例：山田車"
            />
          </div>

          <div className="form-group">
            <label htmlFor="driverName">運転者名</label>
            <input
              id="driverName"
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="例：山田父"
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacity">定員</label>
            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="例：4"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="primary-btn">
              {editingCarId ? "更新" : "登録"}
            </button>
            <button type="button" className="secondary-btn" onClick={resetCarForm}>
              クリア
            </button>
          </div>
        </form>
      </section>

      <section className="summary-grid">
        <div className="card summary-card">
          <div className="summary-label">登録車両数</div>
          <div className="summary-value">{cars.length}台</div>
        </div>
      </section>

      <section className="list-section">
        <div className="list-title">配車一覧</div>

        {loading ? (
          <div className="card empty-card">読み込み中です...</div>
        ) : cars.length === 0 ? (
          <div className="card empty-card">登録車両がありません。</div>
        ) : (
          cars.map((car) => (
            <div className="card list-card" key={car.id}>
              <div className="list-card-bar"></div>
              <div className="list-card-body">
                <div>
                  <div className="list-card-title">{car.carName}</div>
                  <div className="list-card-meta">運転者：{car.driverName}</div>
                  <div className="list-card-meta">定員：{car.capacity}名</div>
                </div>

                <div className="list-card-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => handleEdit(car)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(car.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <button type="button" className="back-button" onClick={() => navigateTo(routes.setting)}>
        設定に戻る
      </button>
    </AppShell>
  );
}

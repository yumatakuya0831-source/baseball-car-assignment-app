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

export default function PlayerRegistration() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setPlayers(playersData);
        setLoading(false);
      },
      (error) => {
        console.error("players read error:", error);
        alert("選手データの取得に失敗しました。Firestoreの設定を確認してください。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("名前を入力してください。");
      return;
    }

    const isDuplicate = players.some(
      (player) => player.name === trimmedName && player.id !== editingId
    );

    if (isDuplicate) {
      alert("同じ名前がすでに登録されています。");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "players", editingId), {
          name: trimmedName,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "players"), {
          name: trimmedName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error) {
      console.error("players save error:", error);
      alert("選手データの保存に失敗しました。");
    }
  };

  const handleEdit = (player) => {
    setName(player.name);
    setEditingId(player.id);
  };

  const handleDelete = async (id) => {
    const target = players.find((player) => player.id === id);
    if (!target) return;

    const ok = window.confirm(`${target.name} を削除しますか？`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "players", id));

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error("players delete error:", error);
      alert("選手データの削除に失敗しました。");
    }
  };

  return (
    <AppShell title="選手登録" subtitle="設定">
      <section className="card form-card">
        <h2 className="section-title">選手情報</h2>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name">選手名</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：山田 太郎"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="primary-btn">
              {editingId ? "更新" : "登録"}
            </button>
            <button type="button" className="secondary-btn" onClick={resetForm}>
              クリア
            </button>
          </div>
        </form>
      </section>

      <section className="summary-grid">
        <div className="card summary-card">
          <div className="summary-label">登録選手数</div>
          <div className="summary-value">{players.length}名</div>
        </div>
      </section>

      <section className="list-section">
        <div className="list-title">選手一覧</div>

        {loading ? (
          <div className="card empty-card">読み込み中です...</div>
        ) : players.length === 0 ? (
          <div className="card empty-card">登録データがありません。</div>
        ) : (
          players.map((player) => (
            <div className="card list-card" key={player.id}>
              <div className="list-card-bar"></div>
              <div className="list-card-body">
                <div className="list-card-title">{player.name}</div>

                <div className="list-card-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => handleEdit(player)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(player.id)}
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

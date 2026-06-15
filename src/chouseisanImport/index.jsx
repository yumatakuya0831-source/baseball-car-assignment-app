import { useMemo, useState } from "react";
import AppShell from "../AppShell.jsx";
import { db } from "../../lib/firebase";
import { navigateTo, routes } from "../routes";
import { parseChouseisanEvent } from "./chouseisan";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const sampleUrl = "https://chouseisan.com/s?h=720f5919c60c4ac29361a5b2158d6c4f";

export default function ChouseisanImport() {
  const [url, setUrl] = useState(sampleUrl);
  const [eventData, setEventData] = useState(null);
  const [htmlText, setHtmlText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSave = useMemo(() => Boolean(eventData && !isLoading), [eventData, isLoading]);

  const handleFetch = async () => {
    setError("");
    setStatus("調整さんを読み込んでいます...");
    setIsLoading(true);

    try {
      const response = await fetch(getFetchUrl(url));
      if (!response.ok) {
        throw new Error(`ページ取得に失敗しました。HTTP ${response.status}`);
      }

      const pageHtml = await response.text();
      const parsed = parseChouseisanEvent(pageHtml);
      setEventData({ ...parsed, sourceUrl: url });
      setStatus("読み込みました。内容を確認して保存してください。");
    } catch (fetchError) {
      console.error("chouseisan fetch error:", fetchError);
      setStatus("");
      setError(
        "URLから直接取得できませんでした。ブラウザの制限が出る場合は、調整さんページをHTML保存してアップロードしてください。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setStatus("HTMLファイルを読み込んでいます...");
    setIsLoading(true);

    try {
      const pageHtml = await file.text();
      const parsed = parseChouseisanEvent(pageHtml);
      setEventData({ ...parsed, sourceUrl: url });
      setStatus("読み込みました。内容を確認して保存してください。");
    } catch (fileError) {
      console.error("chouseisan file parse error:", fileError);
      setStatus("");
      setError(fileError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteImport = async () => {
    const trimmedHtml = htmlText.trim();
    if (!trimmedHtml) {
      setError("HTMLを貼り付けてください。");
      return;
    }

    setError("");
    setStatus("貼り付け内容を読み込んでいます...");
    setIsLoading(true);

    try {
      const parsed = parseChouseisanEvent(trimmedHtml);
      setEventData({ ...parsed, sourceUrl: url });
      setStatus("読み込みました。内容を確認して保存してください。");
    } catch (pasteError) {
      console.error("chouseisan pasted html parse error:", pasteError);
      setStatus("");
      setError(pasteError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventData) return;

    setError("");
    setStatus("Firebaseに保存しています...");
    setIsLoading(true);

    try {
      await saveExpedition(eventData);
      setStatus("保存しました。遠征ごとの参加者と配車可能車両を登録済みです。");
    } catch (saveError) {
      console.error("chouseisan save error:", saveError);
      setStatus("");
      setError("Firebaseへの保存に失敗しました。接続設定やFirestoreルールを確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell title="調整さん取込" subtitle="遠征データ登録">
      <section className="card form-card">
        <h2 className="section-title">URLから取込</h2>

        <div className="registration-form">
          <div className="form-group">
            <label htmlFor="chouseisanUrl">調整さんURL</label>
            <input
              id="chouseisanUrl"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://chouseisan.com/s?h=..."
            />
          </div>

          <button
            type="button"
            className="primary-btn full-width-btn"
            onClick={handleFetch}
            disabled={isLoading}
          >
            URLを読み込む
          </button>
        </div>
      </section>

      <section className="card form-card import-fallback-card">
        <h2 className="section-title">HTMLファイルから取込</h2>
        <p className="helper-text">
          URL取込が制限された場合は、調整さんページをHTMLとして保存して選択してください。
        </p>
        <input
          className="file-input"
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleFileChange}
        />
      </section>

      <section className="card form-card import-fallback-card">
        <h2 className="section-title">HTML貼り付け取込</h2>
        <p className="helper-text">
          スマホでファイル選択できない場合は、調整さんページのHTMLを貼り付けてください。
        </p>
        <div className="registration-form">
          <div className="form-group">
            <label htmlFor="chouseisanHtml">HTML</label>
            <textarea
              id="chouseisanHtml"
              className="html-paste-area"
              value={htmlText}
              onChange={(event) => setHtmlText(event.target.value)}
              placeholder="<html>..."
            />
          </div>
          <button
            type="button"
            className="primary-btn full-width-btn"
            onClick={handlePasteImport}
            disabled={isLoading}
          >
            貼り付け内容を読み込む
          </button>
        </div>
      </section>

      {eventData && (
        <>
          <section className="summary-grid">
            <div className="card summary-card">
              <div className="summary-label">遠征名</div>
              <div className="summary-title">{eventData.title}</div>
            </div>
            <div className="card summary-card">
              <div className="summary-label">参加選手</div>
              <div className="summary-value">{eventData.players.length}名</div>
            </div>
            <div className="card summary-card">
              <div className="summary-label">父</div>
              <div className="summary-value">
                {eventData.guardians.filter((guardian) => guardian.type === "father").length}名
              </div>
            </div>
            <div className="card summary-card">
              <div className="summary-label">母</div>
              <div className="summary-value">
                {eventData.guardians.filter((guardian) => guardian.type === "mother").length}名
              </div>
            </div>
            <div className="card summary-card">
              <div className="summary-label">兄弟</div>
              <div className="summary-value">{eventData.siblings.length}名</div>
            </div>
            <div className="card summary-card">
              <div className="summary-label">配車可能車両</div>
              <div className="summary-value">{eventData.cars.length}台</div>
            </div>
          </section>

          <section className="list-section">
            <div className="list-title">配車可能車両</div>
            {eventData.cars.length === 0 ? (
              <div className="card empty-card">配車可能な車両がありません。</div>
            ) : (
              eventData.cars.map((car) => (
                <div className="card list-card" key={car.id}>
                  <div className="list-card-bar"></div>
                  <div className="list-card-body">
                    <div>
                      <div className="list-card-title">{car.carName}</div>
                      <div className="list-card-meta">定員：{car.capacity ?? "未設定"}名</div>
                      {car.comment && <div className="list-card-meta">{car.comment}</div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="list-section">
            <div className="list-title">参加選手</div>
            {eventData.players.map((player) => (
              <div className="card list-card" key={player.id}>
                <div className="list-card-bar"></div>
                <div className="list-card-body">
                  <div>
                    <div className="list-card-title">{player.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="list-section">
            <div className="list-title">父・母</div>
            {eventData.guardians.length === 0 ? (
              <div className="card empty-card">参加する父・母はいません。</div>
            ) : (
              eventData.guardians.map((guardian) => (
                <div className="card list-card" key={guardian.id}>
                  <div className="list-card-bar"></div>
                  <div className="list-card-body">
                    <div>
                      <div className="list-card-title">{guardian.name}</div>
                      <div className="list-card-meta">回答者：{guardian.ownerName}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="list-section">
            <div className="list-title">兄弟</div>
            {eventData.siblings.length === 0 ? (
              <div className="card empty-card">参加する兄弟はいません。</div>
            ) : (
              eventData.siblings.map((sibling) => (
                <div className="card list-card" key={sibling.id}>
                  <div className="list-card-bar"></div>
                  <div className="list-card-body">
                    <div>
                      <div className="list-card-title">{sibling.name}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          <button
            type="button"
            className="primary-btn full-width-btn"
            onClick={handleSave}
            disabled={!canSave}
          >
            Firebaseに保存
          </button>
        </>
      )}

      {status && <div className="card notice-card">{status}</div>}
      {error && <div className="card error-card">{error}</div>}

      <button type="button" className="back-button" onClick={() => navigateTo(routes.setting)}>
        設定に戻る
      </button>
    </AppShell>
  );
}

async function saveExpedition(eventData) {
  const expeditionRef = doc(db, "expeditions", eventData.id);

  await clearCollection(collection(expeditionRef, "players"));
  await clearCollection(collection(expeditionRef, "guardians"));
  await clearCollection(collection(expeditionRef, "siblings"));
  await clearCollection(collection(expeditionRef, "cars"));
  await clearCollection(collection(expeditionRef, "members"));

  const batch = writeBatch(db);

  batch.set(
    expeditionRef,
    {
      chouseisanId: eventData.id,
      chouseisanUrl: eventData.sourceUrl,
      title: eventData.title,
      detail: eventData.detail,
      choices: eventData.choices,
      playerCount: eventData.players.length,
      fatherCount: eventData.guardians.filter((guardian) => guardian.type === "father").length,
      motherCount: eventData.guardians.filter((guardian) => guardian.type === "mother").length,
      siblingCount: eventData.siblings.length,
      carCount: eventData.cars.length,
      importedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  eventData.members.forEach((member) => {
    batch.set(doc(collection(expeditionRef, "members"), String(member.id)), {
      chouseisanMemberId: member.id,
      name: member.name,
      comment: member.comment ?? "",
      answers: member.kouho ?? [],
    });
  });

  eventData.players.forEach((player) => {
    batch.set(doc(collection(expeditionRef, "players"), player.id), player);
  });

  eventData.guardians.forEach((guardian) => {
    batch.set(doc(collection(expeditionRef, "guardians"), guardian.id), guardian);
  });

  eventData.siblings.forEach((sibling) => {
    batch.set(doc(collection(expeditionRef, "siblings"), sibling.id), sibling);
  });

  eventData.cars.forEach((car) => {
    batch.set(doc(collection(expeditionRef, "cars"), car.id), car);
  });

  await batch.commit();
}

function getFetchUrl(inputUrl) {
  const parsedUrl = new URL(inputUrl);
  if (parsedUrl.hostname === "chouseisan.com") {
    return `/chouseisan-proxy${parsedUrl.pathname}${parsedUrl.search}`;
  }

  return inputUrl;
}

async function clearCollection(collectionRef) {
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((documentSnapshot) => {
    batch.delete(documentSnapshot.ref);
  });
  await batch.commit();
}

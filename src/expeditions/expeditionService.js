import { db } from "../../lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function subscribeExpeditions(onNext, onError) {
  const expeditionsQuery = query(collection(db, "expeditions"), orderBy("updatedAt", "desc"));

  return onSnapshot(
    expeditionsQuery,
    (snapshot) => {
      onNext(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    onError
  );
}

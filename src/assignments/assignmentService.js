import { db } from "../../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export async function loadAssignmentData(expeditionId) {
  const expeditionRef = doc(db, "expeditions", expeditionId);
  const expeditionSnapshot = await getDoc(expeditionRef);

  if (!expeditionSnapshot.exists()) {
    throw new Error("遠征データが見つかりません。");
  }

  const [players, guardians, siblings, cars, tools, assignments] = await Promise.all([
    getCollectionItems(collection(expeditionRef, "players")),
    getCollectionItems(collection(expeditionRef, "guardians")),
    getCollectionItems(collection(expeditionRef, "siblings")),
    getCollectionItems(collection(expeditionRef, "cars")),
    getCollectionItems(collection(expeditionRef, "tools")),
    getCollectionItems(collection(expeditionRef, "assignments")),
  ]);

  return {
    expedition: { id: expeditionSnapshot.id, ...expeditionSnapshot.data() },
    players,
    guardians,
    siblings,
    cars,
    tools,
    assignments,
  };
}

export async function ensureDefaultTool(expeditionId, existingTools) {
  const expeditionRef = doc(db, "expeditions", expeditionId);
  const tools = existingTools ?? await getCollectionItems(collection(expeditionRef, "tools"));
  const toolsToAdd = [];

  const hasDefaultTool = tools.some((tool) => tool.isDefault && tool.name === "道具");
  const hasDefaultManager = tools.some(
    (tool) => tool.type === "manager" || tool.name === "監督"
  );

  if (!hasDefaultTool) {
    toolsToAdd.push({
      id: "default-tool",
      name: "道具",
      type: "tool",
      seatCost: 2,
      isDefault: true,
    });
  }

  if (!hasDefaultManager) {
    toolsToAdd.push({
      id: "default-manager",
      name: "監督",
      type: "manager",
      seatCost: 1,
      isDefault: true,
    });
  }

  await Promise.all(
    toolsToAdd.map((tool) =>
      setDoc(
        doc(collection(expeditionRef, "tools"), tool.id),
        {
          name: tool.name,
          type: tool.type,
          seatCost: tool.seatCost,
          isDefault: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );

  return {
    added: toolsToAdd.length > 0,
    tools: [...tools, ...toolsToAdd],
  };
}

export async function addTool(expeditionId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("道具名を入力してください。");
  }

  const expeditionRef = doc(db, "expeditions", expeditionId);
  const documentRef = await addDoc(collection(expeditionRef, "tools"), {
    name: trimmedName,
    type: "tool",
    seatCost: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: documentRef.id,
    name: trimmedName,
    type: "tool",
    seatCost: 2,
  };
}

export async function deleteTool(expeditionId, toolId) {
  const expeditionRef = doc(db, "expeditions", expeditionId);
  await deleteDoc(doc(collection(expeditionRef, "tools"), toolId));
}

export async function updateCarCapacity(expeditionId, carId, capacity) {
  const numberCapacity = Number(capacity);
  if (!Number.isInteger(numberCapacity) || numberCapacity <= 0) {
    throw new Error("定員は1以上の整数で入力してください。");
  }

  const expeditionRef = doc(db, "expeditions", expeditionId);
  await updateDoc(doc(collection(expeditionRef, "cars"), carId), {
    capacity: numberCapacity,
    updatedAt: serverTimestamp(),
  });
}

export async function saveAssignments(expeditionId, cars, assignmentsByCarId, itemsById) {
  const expeditionRef = doc(db, "expeditions", expeditionId);
  const batch = writeBatch(db);

  cars.forEach((car) => {
    const assignment = assignmentsByCarId[car.id] ?? { passengerIds: [], toolIds: [] };
    const assignedItems = [...assignment.passengerIds, ...assignment.toolIds]
      .map((itemId) => itemsById[itemId])
      .filter(Boolean);
    const usedSeats =
      1 + assignedItems.reduce((total, item) => total + Number(item.seatCost || 0), 0);

    batch.set(
      doc(collection(expeditionRef, "assignments"), car.id),
      {
        carId: car.id,
        passengerIds: assignment.passengerIds,
        toolIds: assignment.toolIds,
        usedSeats,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  batch.set(
    expeditionRef,
    {
      assignmentUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

async function getCollectionItems(collectionRef) {
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

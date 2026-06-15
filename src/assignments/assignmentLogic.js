export function buildAssignmentItems(data) {
  const { players, guardians, siblings, tools, cars = [] } = data;
  const driverGuardianIds = getDriverGuardianIds(guardians, cars);
  const normalizedTools = normalizeDefaultTools(tools);

  return [
    ...players.map((player) => ({
      id: `player:${player.id}`,
      sourceId: player.id,
      kind: "player",
      label: "選手",
      name: player.name,
      seatCost: 1,
      fixedCarId: resolveFixedCarId(player, cars),
    })),
    ...guardians
      .filter((guardian) => !driverGuardianIds.has(guardian.id))
      .map((guardian) => ({
        id: `guardian:${guardian.id}`,
        sourceId: guardian.id,
        kind: "guardian",
        label: guardian.type === "father" ? "父" : "母",
        name: guardian.name,
        seatCost: 1,
        fixedCarId: resolveFixedCarId(guardian, cars),
      })),
    ...siblings.map((sibling) => ({
      id: `sibling:${sibling.id}`,
      sourceId: sibling.id,
      kind: "sibling",
      label: "兄弟",
      name: sibling.name,
      seatCost: 1,
      fixedCarId: resolveFixedCarId(sibling, cars),
    })),
    ...normalizedTools.map((tool) => ({
      id: `tool:${tool.id}`,
      sourceId: tool.id,
      kind: tool.type === "manager" ? "manager" : "tool",
      label: tool.type === "manager" ? "監督" : "道具",
      name: tool.name,
      seatCost: Number(tool.seatCost) || (tool.type === "manager" ? 1 : 2),
    })),
  ];
}

function normalizeDefaultTools(tools) {
  const result = [];
  let hasDefaultTool = false;
  let hasDefaultManager = false;

  tools.forEach((tool) => {
    const isDefaultTool = tool.isDefault && tool.name === "道具";
    const isDefaultManager = tool.type === "manager" || tool.name === "監督";

    if (isDefaultTool) {
      if (hasDefaultTool) return;
      hasDefaultTool = true;
    }

    if (isDefaultManager) {
      if (hasDefaultManager) return;
      hasDefaultManager = true;
    }

    result.push(tool);
  });

  return result;
}

function resolveFixedCarId(item, cars) {
  if (item.fixedCarId) {
    return item.fixedCarId;
  }

  const householdId = String(item.householdId ?? item.chouseisanMemberId ?? "");
  const householdCar = cars.find(
    (car) => String(car.householdId ?? car.chouseisanMemberId ?? car.id) === householdId
  );

  return householdCar?.id ?? null;
}

function getDriverGuardianIds(guardians, cars) {
  const driverGuardianIds = new Set();

  cars.forEach((car) => {
    const householdId = String(car.householdId ?? car.chouseisanMemberId ?? car.id);
    const householdGuardians = guardians.filter(
      (guardian) =>
        String(guardian.householdId ?? guardian.chouseisanMemberId) === householdId
    );
    const father = householdGuardians.find((guardian) => guardian.type === "father");
    const mother = householdGuardians.find((guardian) => guardian.type === "mother");
    const driver = father ?? mother;

    if (driver) {
      driverGuardianIds.add(driver.id);
    }
  });

  return driverGuardianIds;
}

export function calculateUsedSeats(car, assignedItems) {
  if (!car) return 0;
  return 1 + assignedItems.reduce((total, item) => total + item.seatCost, 0);
}

export function splitAssignmentItemIds(itemIds) {
  return itemIds.reduce(
    (result, itemId) => {
      if (itemId.startsWith("tool:")) {
        result.toolIds.push(itemId);
      } else {
        result.passengerIds.push(itemId);
      }
      return result;
    },
    { passengerIds: [], toolIds: [] }
  );
}

export function getAssignedItemIds(assignmentsByCarId) {
  return Object.values(assignmentsByCarId).flatMap((assignment) => [
    ...(assignment.passengerIds ?? []),
    ...(assignment.toolIds ?? []),
  ]);
}

export function moveAssignmentItem(assignmentsByCarId, itemId, targetCarId) {
  const nextAssignments = Object.fromEntries(
    Object.entries(assignmentsByCarId).map(([carId, assignment]) => [
      carId,
      {
        passengerIds: (assignment.passengerIds ?? []).filter((id) => id !== itemId),
        toolIds: (assignment.toolIds ?? []).filter((id) => id !== itemId),
      },
    ])
  );

  if (!targetCarId) {
    return nextAssignments;
  }

  const target = nextAssignments[targetCarId] ?? { passengerIds: [], toolIds: [] };
  const key = itemId.startsWith("tool:") ? "toolIds" : "passengerIds";

  if (!target[key].includes(itemId)) {
    target[key] = [...target[key], itemId];
  }

  nextAssignments[targetCarId] = target;
  return nextAssignments;
}

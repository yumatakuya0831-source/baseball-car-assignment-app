export function buildLineShareText({
  expeditionTitle,
  placeName,
  comment,
  cars,
  assignmentsByCarId,
  itemsById,
}) {
  const lines = [`【${expeditionTitle || "練習試合"}】`];
  const trimmedPlaceName = placeName.trim();
  const trimmedComment = comment.trim();

  if (trimmedPlaceName) {
    lines.push(`＠${trimmedPlaceName}`);
  }

  cars.forEach((car) => {
    const assignment = assignmentsByCarId[car.id] ?? { passengerIds: [], toolIds: [] };
    const assignedItems = [...assignment.passengerIds, ...assignment.toolIds]
      .map((itemId) => itemsById[itemId])
      .filter(Boolean);

    if (assignedItems.length === 0) {
      return;
    }

    lines.push("", `${car.carName}（${car.driverName}）`);
    assignedItems.forEach((item) => {
      lines.push(item.name);
    });
  });

  lines.push("", "※幼児はチャイルドシートの着用をお願い致します");

  if (trimmedComment) {
    lines.push(`※${trimmedComment}`);
  }

  return lines.join("\n");
}

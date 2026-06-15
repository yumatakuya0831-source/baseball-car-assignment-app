export function parseChouseisanEvent(html) {
  const eventMatch = html.match(/"event"\s*:\s*(\{[\s\S]*?\})\s*,\s*"added_member"/);

  if (!eventMatch) {
    throw new Error("調整さんのイベントデータを読み取れませんでした。");
  }

  const event = JSON.parse(eventMatch[1]);
  const choices = Array.isArray(event.choices) ? event.choices : [];
  const members = Array.isArray(event.members) ? event.members : [];
  const playerIndex = findChoiceIndex(choices, "選手");
  const fatherIndex = findChoiceIndex(choices, "父");
  const motherIndex = findChoiceIndex(choices, "母");
  const siblingIndex = findChoiceIndex(choices, "兄弟");
  const carIndex = findChoiceIndex(choices, "配車");

  const missingLabels = [
    ["選手", playerIndex],
    ["父", fatherIndex],
    ["母", motherIndex],
    ["兄弟", siblingIndex],
    ["配車", carIndex],
  ]
    .filter(([, index]) => index < 0)
    .map(([label]) => label);

  if (missingLabels.length > 0) {
    throw new Error(`候補に「${missingLabels.join("」「")}」がありません。選手・父・母・兄弟・配車がある調整さんページを指定してください。`);
  }

  const players = members
    .filter((member) => isAvailable(member.kouho?.[playerIndex]))
    .map((member) => buildPlayer(member, choices, carIndex));

  const guardians = [
    ...members
      .filter((member) => isAvailable(member.kouho?.[fatherIndex]))
      .map((member) => buildGuardian(member, choices, "father", "父", carIndex)),
    ...members
      .filter((member) => isAvailable(member.kouho?.[motherIndex]))
      .map((member) => buildGuardian(member, choices, "mother", "母", carIndex)),
  ];

  const siblings = members
    .filter((member) => isAvailable(member.kouho?.[siblingIndex]))
    .flatMap((member) => buildSiblings(member, choices, carIndex));

  const cars = members
    .filter((member) => isAvailable(member.kouho?.[carIndex]) || hasSeparateCarComment(member))
    .map((member) => buildCar(member, choices, fatherIndex, motherIndex));

  return {
    id: event.id,
    title: event.name,
    detail: event.detail ?? "",
    choices,
    members,
    players,
    guardians,
    siblings,
    cars,
  };
}

function findChoiceIndex(choices, label) {
  return choices.findIndex((choice) => choice.choice === label);
}

function isAvailable(value) {
  return Number(value) === 1;
}

function buildPlayer(member, choices, carIndex) {
  const fixedCarId = getHouseholdCarId(member, carIndex);

  return {
    id: String(member.id),
    name: member.name,
    type: "player",
    householdId: String(member.id),
    fixedCarId,
    answers: buildAnswers(member, choices),
    chouseisanMemberId: member.id,
  };
}

function buildGuardian(member, choices, type, label, carIndex) {
  const fixedCarId = getHouseholdCarId(member, carIndex);

  return {
    id: `${member.id}-${type}`,
    name: `${member.name}${label}`,
    type,
    householdId: String(member.id),
    fixedCarId,
    ownerName: member.name,
    answers: buildAnswers(member, choices),
    chouseisanMemberId: member.id,
  };
}

function buildSiblings(member, choices, carIndex) {
  const comment = member.comment ?? "";
  const relationships = inferSiblingRelationships(comment);
  const fixedCarId = getHouseholdCarId(member, carIndex);

  return relationships.map((relationship, index) => ({
    id: `${member.id}-${index + 1}`,
    name: `${member.name}${relationship}`,
    type: "sibling",
    householdId: String(member.id),
    fixedCarId,
    ownerName: member.name,
    relationship,
    answers: buildAnswers(member, choices),
    chouseisanMemberId: member.id,
  }));
}

function buildCar(member, choices, fatherIndex, motherIndex) {
  const comment = member.comment ?? "";
  const capacity = inferCapacity(comment);
  const familyName = inferFamilyName(member.name);
  const driverName = inferDriverName(member, fatherIndex, motherIndex);

  return {
    id: String(member.id),
    carName: `${familyName}車`,
    driverName,
    ownerName: member.name,
    householdId: String(member.id),
    separateCar: hasSeparateCarComment(member),
    capacity,
    comment,
    answers: buildAnswers(member, choices),
    chouseisanMemberId: member.id,
  };
}

function inferDriverName(member, fatherIndex, motherIndex) {
  if (isAvailable(member.kouho?.[fatherIndex])) {
    return `${member.name}父`;
  }

  if (isAvailable(member.kouho?.[motherIndex])) {
    return `${member.name}母`;
  }

  return member.name;
}

function hasSeparateCarComment(member) {
  return String(member.comment ?? "").includes("別車");
}

function getHouseholdCarId(member, carIndex) {
  if (isAvailable(member.kouho?.[carIndex]) || hasSeparateCarComment(member)) {
    return String(member.id);
  }

  return null;
}

function inferFamilyName(name) {
  const normalized = String(name ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "未設定";
  }

  const [firstToken] = normalized.split(/[ \u3000]+/);
  return firstToken || normalized;
}

function buildAnswers(member, choices) {
  return choices.reduce((answers, choice, index) => {
    answers[choice.choice] = markFromValue(member.kouho?.[index]);
    return answers;
  }, {});
}

function markFromValue(value) {
  if (Number(value) === 1) return "○";
  if (Number(value) === 2) return "△";
  if (Number(value) === 3) return "×";
  return "";
}

function inferCapacity(comment) {
  const normalized = comment.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
  const match = normalized.match(/([1-9][0-9]?)\s*人\s*乗/);
  return match ? Number(match[1]) : null;
}

function inferSiblingRelationships(comment) {
  const normalized = comment.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
  const relationships = [];
  const relationshipPattern = /(?:兄弟|きょうだい|姉弟|兄妹)?\s*([兄姉弟妹])\s*([1-9][0-9]?|一|二|三|四|五)?\s*人?/g;
  let match = relationshipPattern.exec(normalized);

  while (match) {
    const relationship = match[1];
    const count = japaneseNumberToNumber(match[2]) ?? 1;
    for (let index = 0; index < count; index += 1) {
      relationships.push(relationship);
    }
    match = relationshipPattern.exec(normalized);
  }

  if (relationships.length > 0) {
    return relationships;
  }

  const genericMatch = normalized.match(/(?:兄弟|きょうだい|姉弟|兄妹)\s*([1-9][0-9]?|一|二|三|四|五)?\s*人?/);
  const genericCount = japaneseNumberToNumber(genericMatch?.[1]) ?? 1;

  return Array.from({ length: genericCount }, () => "兄弟");
}

function japaneseNumberToNumber(value) {
  if (!value) return null;
  const number = Number(value);
  if (Number.isInteger(number)) return number;

  const map = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
  };

  return map[value] ?? null;
}

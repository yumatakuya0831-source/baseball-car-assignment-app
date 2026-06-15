export const routes = {
  setting: "/setting",
  importChouseisan: "/setting/import",
  players: "/setting/players",
  cars: "/setting/cars",
  expeditions: "/expeditions",
};

export function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

export function assignmentPath(expeditionId) {
  return `/expeditions/${expeditionId}/assignments`;
}

export function assignmentResultPath(expeditionId) {
  return `/expeditions/${expeditionId}/result`;
}

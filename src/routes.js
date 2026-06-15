export const routes = {
  setting: "/setting",
  importChouseisan: "/setting/import",
  expeditions: "/expeditions",
  assignmentHistory: "/assignment-history",
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

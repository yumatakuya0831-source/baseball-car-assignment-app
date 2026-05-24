export const routes = {
  setting: "/setting",
  players: "/setting/players",
  cars: "/setting/cars",
};

export function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

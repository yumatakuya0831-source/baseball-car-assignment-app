import SettingHome from "./setting/SettingHome.jsx";
import PlayerRegistration from "./playerRegistration/index.jsx";
import CarRegistration from "./carRegistration/index.jsx";
import { routes } from "./routes";
import usePathname from "./usePathname";

export default function AppRouter() {
  const pathname = usePathname();

  if (pathname === routes.players) {
    return <PlayerRegistration />;
  }

  if (pathname === routes.cars) {
    return <CarRegistration />;
  }

  return <SettingHome />;
}

import SettingHome from "./setting/SettingHome.jsx";
import ChouseisanImport from "./chouseisanImport/index.jsx";
import ExpeditionList from "./expeditions/ExpeditionList.jsx";
import AssignmentHistory from "./assignments/AssignmentHistory.jsx";
import AssignmentPage from "./assignments/AssignmentPage.jsx";
import AssignmentResult from "./assignments/AssignmentResult.jsx";
import { routes } from "./routes";
import usePathname from "./usePathname";

export default function AppRouter() {
  const pathname = usePathname();

  if (pathname === routes.importChouseisan) {
    return <ChouseisanImport />;
  }

  if (pathname === routes.expeditions) {
    return <ExpeditionList />;
  }

  if (pathname === routes.assignmentHistory) {
    return <AssignmentHistory />;
  }

  const assignmentMatch = pathname.match(/^\/expeditions\/([^/]+)\/assignments$/);
  if (assignmentMatch) {
    return <AssignmentPage expeditionId={assignmentMatch[1]} />;
  }

  const resultMatch = pathname.match(/^\/expeditions\/([^/]+)\/result$/);
  if (resultMatch) {
    return <AssignmentResult expeditionId={resultMatch[1]} />;
  }

  return <SettingHome />;
}

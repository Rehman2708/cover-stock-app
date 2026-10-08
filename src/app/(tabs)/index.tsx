import { DashboardView } from "../../features/dashboard/DashboardView";
import { useDashboardViewModel } from "../../features/dashboard/useDashboardViewModel";

export default function DashboardRoute() {
  return <DashboardView {...useDashboardViewModel()} />;
}

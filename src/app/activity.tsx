import { ActivityView } from "../features/activity/ActivityView";
import { useActivityViewModel } from "../features/activity/useActivityViewModel";

export default function ActivityRoute() {
  return <ActivityView {...useActivityViewModel()} />;
}

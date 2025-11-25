import Tabs from "../ui/Tabs";
import ActivityChart from "./ActivityChart";
import WeeklyPerformanceChart from "./WeeklyPerformanceChart";

export default function Charts({ weeklyData = [], hourlyData = [], isLoading = false }) {
  return (
    <Tabs
      tabs={[
        { key: "weekly", label: "Weekly Performance", content: <WeeklyPerformanceChart data={weeklyData} isLoading={isLoading} /> },
        { key: "activity", label: "Activity", content: <ActivityChart data={hourlyData} isLoading={isLoading} /> },
      ]}
    />
  );
}

import React from 'react'
import PieChart from '../ui/PieChart';
import AnalyticsChart from './AnalyticsChart';
import { Phone } from 'lucide-react';
const Charts = () => {
     const data = [
    { time: "09:00", answered: 30, missed: 10 },
    { time: "10:00", answered: 40, missed: 5 },
    { time: "11:00", answered: 35, missed: 15 },
    { time: "12:00", answered: 50, missed: 20 },
    { time: "13:00", answered: 45, missed: 10 },
    { time: "14:00", answered: 60, missed: 5 },
  ];
  const callTypeData = [
  { type: "Appointments", count: 187, percentage: 45, color: "#3b82f6" },
  { type: "General Info", count: 124, percentage: 30, color: "#10b981" },
  { type: "Cancellations", count: 62, percentage: 15, color: "#f59e0b" },
  { type: "Emergencies", count: 41, percentage: 10, color: "#ef4444" },
];
  return (
    // <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="">
        <AnalyticsChart data={data} />
        <PieChart
          title="Call Categories"
          subtitle="Distribution of call types this week"
          icon={Phone}
          data={callTypeData}
          innerRadius={60}
          outerRadius={90}
          height={220}
        />
    </div>
  )
}

export default Charts
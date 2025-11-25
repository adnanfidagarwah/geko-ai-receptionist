import { Phone, CheckCircle, Clock, Star } from "lucide-react";
import StatCard from "../ui/StatCard";

export default function KPICards() {
  const data = [
    {
      title: "Total Calls",
      value: "47",
      footer: "+24% vs yesterday",
      icon: Phone,
      variant: "default",
    },
    {
      title: "Answer Rate",
      value: "96.8%",
      footer: "+2.3% improvement",
      icon: CheckCircle,
      variant: "success",
    },
     {
      title: "Missed Calls",
      value: "4",
      footer: "-2% of total",
      icon: Star,
      variant: "error",
    },
    // {
    //   title: "Avg Response",
    //   value: "1.2s",
    //   footer: "-0.4s faster",
    //   icon: Clock,
    //   variant: "primary",
    // },
   
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}

import { Phone, CheckCircle, Clock, Star } from "lucide-react";
import StatCard from "../ui/StatCard";

export default function KPICards({ cards = [], isLoading = false, tone = "solid", accentColor }) {
  const fallback = [
    { title: "Calls Today", value: "—", footer: "", icon: Phone, variant: "default" },
    { title: "Answer Rate", value: "—", footer: "", icon: CheckCircle, variant: "success" },
    { title: "Avg Duration", value: "—", footer: "", icon: Clock, variant: "primary" },
    { title: "Sentiment", value: "—", footer: "", icon: Star, variant: "warning" },
  ];

  const data = cards.length ? cards : fallback;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((card, i) => (
        <StatCard
          key={i}
          {...card}
          tone={tone}
          accentColor={accentColor}
          value={isLoading ? <span className="text-sm text-muted">Loading…</span> : card.value}
        />
      ))}
    </div>
  );
}

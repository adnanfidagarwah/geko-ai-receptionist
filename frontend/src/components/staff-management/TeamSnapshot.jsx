import React from "react";
import { Users, UserCheck, UserPlus, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "Total Staff",
    value: "32",
    description: "8 departments covered",
    icon: Users,
  },
  {
    title: "On Duty Today",
    value: "18",
    description: "92% shift coverage",
    icon: UserCheck,
    progress: 92,
  },
  {
    title: "In Training",
    value: "4",
    description: "Orientation finishes Friday",
    icon: ShieldCheck,
    progress: 60,
  },
  {
    title: "Hiring Pipeline",
    value: "3",
    description: "Interviews scheduled this week",
    icon: UserPlus,
  },
];

export default function TeamSnapshot() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span>{card.title}</span>
            <card.icon className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-3 text-xl font-semibold text-primary-dark sm:text-2xl">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-textcolor-secondary">
            {card.description}
          </p>
          {card.progress !== undefined && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background-hover">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

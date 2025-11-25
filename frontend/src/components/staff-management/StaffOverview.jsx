import React from "react";
import clsx from "clsx";
import {
  CalendarPlus,
  CalendarClock,
  Clock,
  Sparkles,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../ui/Badge";

const upcomingShifts = [
  {
    id: 1,
    name: "Noah Bennett",
    role: "Clinic Support",
    time: "Today • 14:00 – 20:00",
    status: "Shift swap confirmed",
  },
  {
    id: 2,
    name: "Priya Shah",
    role: "Training",
    time: "Today • 16:00 – 18:00",
    status: "Onboarding workshop",
  },
  {
    id: 3,
    name: "Miguel Alvarez",
    role: "Night Supervisor",
    time: "Tonight • 22:00 – 06:00",
    status: "Night coverage",
  },
];

const coverage = [
  { id: 1, label: "Front Desk Coverage", value: 92, theme: "from-sky-500 to-blue-500" },
  { id: 2, label: "Training Completion", value: 68, theme: "from-violet-500 to-fuchsia-500" },
  { id: 3, label: "AI Script Adoption", value: 84, theme: "from-emerald-500 to-teal-500" },
];

const newHires = [
  {
    id: 1,
    name: "Isabella Moore",
    role: "Evening Receptionist",
    start: "Starts Sep 22",
  },
  {
    id: 2,
    name: "Liam Chen",
    role: "Weekends",
    start: "Paperwork pending",
  },
];

export default function StaffOverview() {
  const cardClass =
    "rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-6";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h3 className="text-base font-semibold text-textcolor">
              Team Actions
            </h3>
            <p className="text-xs text-textcolor-secondary">
              Keep your workforce aligned with one click
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button className="btn-primary flex items-center justify-center gap-2 shadow">
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 shadow">
            <CalendarPlus className="h-4 w-4" />
            Publish New Schedule
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-white/50 bg-white/70 px-4 py-3 text-xs text-textcolor-secondary backdrop-blur-sm">
          <span className="font-medium text-textcolor">Tip:</span> sync new
          staff with your AI receptionist prompts to keep tone and responses
          consistent.
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-textcolor">
              Upcoming Shifts
            </h3>
            <p className="text-xs text-textcolor-secondary">
              Next 12 hours across reception and support
            </p>
          </div>
          <CalendarClock className="h-5 w-5 text-accent" />
        </div>
        <div className="mt-5 space-y-4">
          {upcomingShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-start justify-between rounded-xl border border-white/60 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
            >
              <div>
                <p className="text-sm font-semibold text-textcolor">
                  {shift.name}
                </p>
                <p className="text-xs text-textcolor-secondary">{shift.role}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-textcolor-secondary">
                  {shift.time}
                </p>
                <Badge variant="info" className="mt-1 bg-accent/20">
                  {shift.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div>
            <h3 className="text-base font-semibold text-textcolor">
              Coverage & Alignment
            </h3>
            <p className="text-xs text-textcolor-secondary">
              Training, coverage and AI workflow adoption
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-5">
          {coverage.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium text-textcolor">{item.label}</p>
                <span className="text-textcolor-secondary">{item.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background-hover/70">
                <div
                  className={clsx(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    item.theme
                  )}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-textcolor">
              New & Pending Hires
            </h3>
            <p className="text-xs text-textcolor-secondary">
              Smooth onboarding keeps your AI receptionist informed
            </p>
          </div>
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <div className="mt-5 space-y-4">
          {newHires.map((hire) => (
            <div
              key={hire.id}
              className="flex items-center justify-between rounded-xl border border-dashed border-white/60 bg-white/70 px-4 py-3 backdrop-blur-sm"
            >
              <div>
                <p className="text-sm font-semibold text-textcolor">
                  {hire.name}
                </p>
                <p className="text-xs text-textcolor-secondary">{hire.role}</p>
              </div>
              <span className="text-xs font-medium text-textcolor-secondary">
                {hire.start}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

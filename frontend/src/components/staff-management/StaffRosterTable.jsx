import React from "react";
import clsx from "clsx";
import { Eye, MessageCircle, CalendarClock } from "lucide-react";
import Table from "../ui/Table";
import { Badge } from "../ui/Badge";

const statusVariants = {
  Active: "success",
  "On Leave": "warning",
  Training: "info",
};

const columns = [
  {
    key: "name",
    label: "Team Member",
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "h-10 w-10 rounded-full bg-gradient-to-br text-white text-sm font-semibold flex items-center justify-center shadow-sm",
            row.avatarGradient
          )}
        >
          {row.initials}
        </div>
        <div>
          <p className="font-medium text-textcolor">{value}</p>
          <p className="text-xs text-textcolor-secondary">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role & Department",
    render: (value, row) => (
      <div>
        <p className="text-sm font-medium text-textcolor">{value}</p>
        <p className="text-xs text-textcolor-secondary">{row.department}</p>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge variant={statusVariants[value] ?? "default"}>{value}</Badge>
    ),
  },
  {
    key: "shift",
    label: "Next Shift",
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="text-sm text-textcolor">{value}</span>
        <span className="text-xs text-textcolor-secondary">
          {row.shiftLabel}
        </span>
      </div>
    ),
  },
  { key: "lastActive", label: "Last Active" },
];

const staff = [
  {
    name: "Samantha Lee",
    initials: "SL",
    avatarGradient: "from-sky-500 to-blue-500",
    role: "Front Desk Lead",
    department: "Reception",
    status: "Active",
    shift: "Today • 08:00 – 16:00",
    shiftLabel: "Front Desk A",
    lastActive: "Online now",
    email: "samantha@rosewoodclinic.com",
  },
  {
    name: "Miguel Alvarez",
    initials: "MA",
    avatarGradient: "from-emerald-500 to-teal-500",
    role: "Night Supervisor",
    department: "Reception",
    status: "Active",
    shift: "Tonight • 22:00 – 06:00",
    shiftLabel: "Night Watch",
    lastActive: "Updated shift 12m ago",
    email: "miguel@rosewoodclinic.com",
  },
  {
    name: "Priya Shah",
    initials: "PS",
    avatarGradient: "from-violet-500 to-fuchsia-500",
    role: "Training Coordinator",
    department: "People Operations",
    status: "Training",
    shift: "Today • 10:00 – 18:00",
    shiftLabel: "Onboarding Session",
    lastActive: "In training room",
    email: "priya@rosewoodclinic.com",
  },
  {
    name: "Noah Bennett",
    initials: "NB",
    avatarGradient: "from-orange-500 to-rose-500",
    role: "Receptionist",
    department: "Clinic Support",
    status: "Active",
    shift: "Tomorrow • 07:00 – 15:00",
    shiftLabel: "Surgery Wing",
    lastActive: "Checked schedules 1h ago",
    email: "noah@rosewoodclinic.com",
  },
  {
    name: "Amina Yusuf",
    initials: "AY",
    avatarGradient: "from-cyan-500 to-sky-400",
    role: "Receptionist",
    department: "Reception",
    status: "On Leave",
    shift: "Back Monday",
    shiftLabel: "PTO",
    lastActive: "Approved leave yesterday",
    email: "amina@rosewoodclinic.com",
  },
  {
    name: "Daniel Brooks",
    initials: "DB",
    avatarGradient: "from-indigo-500 to-purple-500",
    role: "Clinical Liaison",
    department: "Clinical Ops",
    status: "Active",
    shift: "Today • 12:00 – 20:00",
    shiftLabel: "Lab Wing",
    lastActive: "Synced with AI intake 25m ago",
    email: "daniel@rosewoodclinic.com",
  },
  {
    name: "Hannah Kim",
    initials: "HK",
    avatarGradient: "from-rose-500 to-red-500",
    role: "Practice Manager",
    department: "Operations",
    status: "Active",
    shift: "Today • 09:00 – 17:00",
    shiftLabel: "Admin Office",
    lastActive: "Reviewed metrics 4m ago",
    email: "hannah@rosewoodclinic.com",
  },
  {
    name: "Ethan Wright",
    initials: "EW",
    avatarGradient: "from-lime-500 to-emerald-500",
    role: "Receptionist",
    department: "Reception",
    status: "Training",
    shift: "Today • 11:00 – 19:00",
    shiftLabel: "Shadowing • Front Desk",
    lastActive: "Shadowing Samantha",
    email: "ethan@rosewoodclinic.com",
  },
];

const actions = [
  () => (
    <button className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:border-primary hover:text-primary">
      <Eye className="h-4 w-4" />
    </button>
  ),
  () => (
    <button className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:border-primary hover:text-primary">
      <MessageCircle className="h-4 w-4" />
    </button>
  ),
  () => (
    <button className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:border-primary hover:text-primary">
      <CalendarClock className="h-4 w-4" />
    </button>
  ),
];

export default function StaffRosterTable() {
  return (
    <Table
      title="Staff Roster"
      subtitle="Live overview of your reception team and support staff"
      columns={columns}
      data={staff}
      actions={actions}
      searchable
      filterOptions={{
        role: ["Front Desk Lead", "Night Supervisor", "Training Coordinator", "Receptionist", "Clinical Liaison", "Practice Manager"],
        status: ["Active", "On Leave", "Training"],
        department: ["Reception", "People Operations", "Clinic Support", "Clinical Ops", "Operations"],
      }}
      pageSizeOptions={[5, 10, 20]}
      defaultPageSize={5}
      containerClassName="border border-white/60 bg-white/90 backdrop-blur shadow-lg"
    />
  );
}

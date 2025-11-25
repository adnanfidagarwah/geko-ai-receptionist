import React from "react";
import { Sparkles, Plus, CalendarPlus } from "lucide-react";
import TeamSnapshot from "../components/staff-management/TeamSnapshot";
import StaffRosterTable from "../components/staff-management/StaffRosterTable";
import StaffOverview from "../components/staff-management/StaffOverview";
import StaffPlaybook from "../components/staff-management/StaffPlaybook";

export default function StaffManagement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background.DEFAULT via-white to-background-hover/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:gap-10">
        <section className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/85 p-5 shadow-xl backdrop-blur sm:rounded-3xl sm:p-8">
          <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-dark">
                  <Sparkles className="h-4 w-4" />
                  Team Ops Hub
                </span>
                <h2 className="text-2xl font-semibold text-primary-dark sm:text-3xl">
                  Orchestrate your reception crew with AI precision
                </h2>
                <p className="text-sm text-textcolor-secondary">
                  Align staffing, training, and schedules so your AI receptionist
                  and human specialists always speak in one voice.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button className="btn-secondary flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto">
                  <CalendarPlus className="h-4 w-4" />
                  Manage Schedules
                </button>
                <button className="btn-primary flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Team Member
                </button>
              </div>
            </div>

            <TeamSnapshot />
          </div>
        </section>

        <div className="grid gap-6 lg:gap-8 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <StaffRosterTable />
            <StaffPlaybook />
          </div>
          <div className="xl:col-span-5">
            <StaffOverview />
          </div>
        </div>
      </div>
    </div>
  );
}

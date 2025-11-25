import React, { useMemo } from "react";
import { Loader2, PhoneCall, PhoneIncoming, PhoneMissed, Clock3 } from "lucide-react";
import Hero from "../components/dashboard/Hero";
import { useGetCallsQuery } from "../features/api/appApi";
import CallHistoryTable from "../components/calls-history/CallHistoryTable";

const CallsHistory = () => {
  const { data, isLoading, isFetching } = useGetCallsQuery({ page: 1, pageSize: 200 });

  const calls = data?.calls ?? data?.data?.calls ?? [];
  const total = data?.pagination?.total ?? calls.length;

  const metrics = useMemo(() => {
    if (!calls.length) {
      return { answered: 0, missed: 0, inProgress: 0, avgDuration: 0 };
    }
    const answered = calls.filter((call) => Number(call.duration_ms || 0) > 0).length;
    const missed = calls.filter((call) => Number(call.duration_ms || 0) === 0).length;
    const inProgress = calls.filter((call) => !call.end_timestamp).length;
    const totalDuration = calls.reduce((sum, call) => sum + Number(call.duration_ms || 0), 0);
    const avgDuration = answered ? totalDuration / answered / 1000 : 0;
    return { answered, missed, inProgress, avgDuration };
  }, [calls]);

  const answerRate = total ? ((metrics.answered / Math.max(total, 1)) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 p-6">
      <Hero
        title="Call History & Analytics"
        subtitle="Live feed of conversations handled by your AI receptionist"
        icon={PhoneCall}
        badges={[
          { text: "AI Powered", className: "bg-success/20 text-white border-success/20" },
          { text: isFetching ? "Refreshing" : "Realtime", className: "bg-white/20 text-white border-white/20" },
        ]}
        stats={[
          { label: "Total Calls", value: total.toString() },
          { label: "Answer Rate", value: `${answerRate}%` },
          { label: "Avg Duration", value: `${metrics.avgDuration.toFixed(1)}s` },
          { label: "In Progress", value: metrics.inProgress.toString() },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Answered</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-emerald-600">
            <PhoneIncoming className="h-6 w-6" /> {metrics.answered}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Missed</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-rose-600">
            <PhoneMissed className="h-6 w-6" /> {metrics.missed}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Avg Duration</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Clock3 className="h-6 w-6" /> {metrics.avgDuration.toFixed(1)}s
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Status</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-textcolor-secondary">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
              </>
            ) : (
              <span>{isFetching ? "Refreshing data" : "Live"}</span>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
        <CallHistoryTable />
      </div>
    </div>
  );
};

export default CallsHistory;

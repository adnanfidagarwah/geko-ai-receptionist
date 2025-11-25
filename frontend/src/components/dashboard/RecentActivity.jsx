import React from "react";
import clsx from "clsx";
import { Volume2, Star, Play, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "../ui/Badge";

export default function RecentActivity({ calls = [], isLoading = false, isRefreshing = false, onRefresh }) {
  const statusStyles = {
    Completed: { dotClass: "bg-emerald-500", badgeVariant: "success" },
    Missed: { dotClass: "bg-rose-500", badgeVariant: "error" },
    Pending: { dotClass: "bg-amber-500", badgeVariant: "warning" },
    "In Progress": { dotClass: "bg-amber-500", badgeVariant: "warning" },
    Unknown: { dotClass: "bg-slate-300", badgeVariant: "secondary" },
  };

  const resolveStatus = (status) =>
    statusStyles[status] ?? statusStyles.Unknown ?? statusStyles.Completed;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-emerald-500" />
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-textcolor-secondary">
              Latest calls and interactions
            </p>
          </div>
        </div>
        <button
          className="btn btn-sm btn-outline flex items-center gap-2"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
          {!isRefreshing && <RefreshCw className="h-4 w-4" />}
          Live Updates
        </button>
      </div>

      <div className="card-body space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading recent calls…
          </div>
        ) : calls.length === 0 ? (
          <div className="text-muted">No calls yet. Live data will appear here as soon as calls come in.</div>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className="flex flex-col gap-4 rounded-2xl border border-background-hover/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 sm:items-center">
                <div
                  className={clsx(
                    "mt-1 h-3 w-3 rounded-full sm:mt-0",
                    resolveStatus(call.status).dotClass
                  )}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-textcolor-default">
                      {call.caller}
                    </p>
                    <Badge
                      variant={resolveStatus(call.status).badgeVariant}
                      className="uppercase tracking-wide"
                    >
                      {call.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted sm:text-sm">
                    {call.time} • {call.duration}
                  </p>
                  <p className="text-sm text-textcolor-secondary">
                    {call.outcome}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end sm:text-right">
                {call.sentiment && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-500 capitalize">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">{call.sentiment}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm p-1 hover:bg-white/70">
                    <Play className="h-4 w-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm p-1 hover:bg-white/70">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <button className="btn btn-outline w-full">
          View All Activity
        </button>
      </div>
    </div>
  );
}

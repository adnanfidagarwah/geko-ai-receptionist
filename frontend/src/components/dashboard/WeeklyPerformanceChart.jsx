import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Calendar, Star, Crown, Loader2 } from "lucide-react";
import { Badge } from "../ui/Badge";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <p>calls: {data.calls}</p>
        <p>bookings: {data.bookings}</p>
        {data.satisfaction != null && (
          <p className="text-amber-600 flex items-center gap-1">
            Satisfaction: {data.satisfaction}
            <Star className="h-3 w-3 fill-current text-amber-400" />
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function WeeklyPerformanceChart({ data = [], isLoading = false }) {
  const topDay = data.find((entry) => entry.highlight) ?? data[0] ?? null;
  const hasData = data.some((entry) => entry.calls || entry.bookings);

  return (
    <div className="card">
      <div className="card-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" /> Weekly Performance Summary
          </h2>
          <p className="text-sm text-muted">
            Comprehensive view of this week's metrics
          </p>
        </div>
        {topDay && topDay.calls > 0 && (
          <Badge variant="info" className="flex items-center gap-1 px-3 py-1">
            <Crown className="h-3 w-3" />
            Best day: {topDay.day}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center text-muted">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading weekly performance…
        </div>
      ) : hasData ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="calls" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={`calls-cell-${idx}`}
                  fill={
                    entry.highlight
                      ? "url(#callsHighlightGradient)"
                      : "url(#callsGradient)"
                  }
                />
              ))}
            </Bar>
            <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={`bookings-cell-${idx}`}
                  fill={
                    entry.highlight
                      ? "url(#bookingsHighlightGradient)"
                      : "url(#bookingsGradient)"
                  }
                />
              ))}
            </Bar>

            <defs>
            <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B140" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#00B140" stopOpacity={0.18} />
            </linearGradient>
            <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient
              id="callsHighlightGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#009638" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#009638" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient
              id="bookingsHighlightGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
            </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[350px] flex items-center justify-center text-muted">
          No weekly call data yet.
        </div>
      )}
    </div>
  );
}

import { Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export default function ActivityChart({ data = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading activity…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted">
        No call activity yet for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00B140" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#00B140" stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="time" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="calls" stroke="#00B140" fill="url(#callsGradient)" strokeWidth={3} />
        <Area type="monotone" dataKey="bookings" stroke="#38BDF8" fill="url(#bookingsGradient)" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

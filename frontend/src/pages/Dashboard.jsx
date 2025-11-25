import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  Zap,
  CheckCircle,
  Phone,
  Activity,
  Clock3,
  AlertTriangle,
  CalendarCheck2,
  Users,
  ShoppingBag,
  Wallet,
  Truck,
} from "lucide-react";
import Hero from "../components/dashboard/Hero";
import Charts from "../components/dashboard/Charts";
import KPICards from "../components/dashboard/KPICards";
import PieChart from "../components/ui/PieChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/ui/StatCard";
import {
  useGetCallsQuery,
  useGetClinicAppointmentsQuery,
  useGetClinicPatientsQuery,
  useGetRestaurantOrdersQuery,
  useGetRestaurantCustomersQuery,
  useGetRestaurantUpsellsQuery,
} from "../features/api/appApi";
import { selectAuth } from "../features/auth/authSlice";

const RANGE_PRESETS = {
  today: "today",
  last7: "last7",
  last30: "last30",
};

const formatDuration = (ms) => {
  if (!ms || Number.isNaN(ms)) return "—";
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
};

const formatPhone = (value = "") => {
  if (!value) return "Unknown";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return value;
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "$0";
  if (Math.abs(amount) >= 1000) {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `$${amount.toFixed(2)}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const isSameDay = (a, b) => a?.toDateString && b?.toDateString && a.toDateString() === b.toDateString();
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const resolveStatus = (call) => {
  if (!call) return "Unknown";
  if (!call.end_timestamp && !call.duration_ms) return "In Progress";
  if (call.duration_ms === 0) return "Missed";
  return "Completed";
};

const formatHour = (hour) => {
  const h = hour % 12 || 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
};

const sentimentScore = (sentiment) => {
  const s = (sentiment || "").toLowerCase();
  if (s.includes("pos")) return 5;
  if (s.includes("neg")) return 1;
  return 3;
};

const useDashboardStats = (calls) =>
  useMemo(() => {
    const totals = {
      total: calls.length,
      answered: 0,
      missed: 0,
      inProgress: 0,
      durationMs: 0,
      callsToday: 0,
      answeredToday: 0,
      missedToday: 0,
    };
    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0, bookings: 0 }));
    const weekly = Array.from({ length: 7 }, (_, idx) => ({
      idx,
      calls: 0,
      bookings: 0,
      sentimentScore: 0,
      samples: 0,
    }));
    const todayKey = new Date().toDateString();

    calls.forEach((call) => {
      const status = resolveStatus(call);
      if (status === "Completed") {
        totals.answered += 1;
        totals.durationMs += Number(call.duration_ms || 0);
      } else if (status === "Missed") {
        totals.missed += 1;
      } else if (status === "In Progress") {
        totals.inProgress += 1;
      }

      const sentiment = (call.sentiment || "").toLowerCase();
      if (sentiment.includes("pos")) sentiments.positive += 1;
      else if (sentiment.includes("neg")) sentiments.negative += 1;
      else if (sentiment) sentiments.neutral += 1;

      const start = call.start_timestamp ? new Date(call.start_timestamp) : null;
      if (start && !Number.isNaN(start.getTime())) {
        const hour = start.getHours();
        const dayIdx = start.getDay();
        const isBooked = Boolean(call.linked_appointment);

        hourly[hour].calls += 1;
        if (isBooked) hourly[hour].bookings += 1;

        weekly[dayIdx].calls += 1;
        if (isBooked) weekly[dayIdx].bookings += 1;
        weekly[dayIdx].sentimentScore += sentimentScore(call.sentiment);
        weekly[dayIdx].samples += 1;

        if (start.toDateString() === todayKey) {
          totals.callsToday += 1;
          if (status === "Completed") totals.answeredToday += 1;
          if (status === "Missed") totals.missedToday += 1;
        }
      }
    });

    const statusTotal = totals.answered + totals.missed + totals.inProgress;
    const answerRate = totals.total ? Number(((totals.answered / totals.total) * 100).toFixed(1)) : 0;
    const avgDurationMs = totals.answered ? totals.durationMs / totals.answered : 0;
    const sentimentTotal = sentiments.positive + sentiments.negative + sentiments.neutral;
    const positiveSentiment = sentimentTotal ? Math.round((sentiments.positive / sentimentTotal) * 100) : null;

    const statusDistribution = statusTotal
      ? [
          { type: "Completed", count: totals.answered, color: "#10b981" },
          { type: "Missed", count: totals.missed, color: "#ef4444" },
          { type: "In Progress", count: totals.inProgress, color: "#f59e0b" },
        ].map((item) => ({
          ...item,
          percentage: Math.round((item.count / statusTotal) * 100),
        }))
      : [];

    const firstHourIdx = hourly.findIndex((h) => h.calls || h.bookings);
    const lastHourIdx = (() => {
      for (let i = hourly.length - 1; i >= 0; i -= 1) {
        if (hourly[i].calls || hourly[i].bookings) return i;
      }
      return -1;
    })();
    const hourlyData =
      firstHourIdx === -1
        ? []
        : hourly.slice(firstHourIdx, lastHourIdx + 1).map((bucket) => ({
            time: formatHour(bucket.hour),
            calls: bucket.calls,
            bookings: bucket.bookings,
          }));

    const weeklyData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, idx) => {
      const bucket = weekly[idx];
      const satisfaction = bucket.samples ? Number((bucket.sentimentScore / bucket.samples).toFixed(1)) : null;
      return { day: label, calls: bucket.calls, bookings: bucket.bookings, satisfaction };
    });

    const topDayIdx = weeklyData.reduce(
      (bestIdx, entry, idx) => (entry.calls > (weeklyData[bestIdx]?.calls ?? -1) ? idx : bestIdx),
      0,
    );
    const weeklyWithHighlight = weeklyData.map((entry, idx) => ({
      ...entry,
      highlight: entry.calls > 0 && idx === topDayIdx,
    }));

    const recentCalls = calls.slice(0, 5).map((call) => ({
      id: call.call_id ?? call.start_timestamp ?? `${call.from_number ?? ""}-${call.to_number ?? ""}-${Math.random()}`,
      caller: formatPhone(call.direction === "inbound" ? call.from_number : call.to_number),
      time: formatTime(call.start_timestamp),
      duration: formatDuration(call.duration_ms),
      outcome: call.call_summary || "Awaiting summary",
      status: resolveStatus(call),
      sentiment: call.sentiment || null,
    }));

    return {
      ...totals,
      answerRate,
      avgDurationMs,
      positiveSentiment,
      statusDistribution,
      hourlyData,
      weeklyData: weeklyWithHighlight,
      recentCalls,
    };
  }, [calls]);

export default function Dashboard() {
  const { token } = useSelector(selectAuth);
  const [rangeKey, setRangeKey] = useState(RANGE_PRESETS.last7);
  const [statusFilter, setStatusFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");

  const range = useMemo(() => {
    const today = new Date();
    if (rangeKey === RANGE_PRESETS.today) {
      return {
        label: "Today",
        from: startOfDay(today),
        to: endOfDay(today),
      };
    }
    if (rangeKey === RANGE_PRESETS.last30) {
      const from = startOfDay(new Date());
      from.setDate(from.getDate() - 29);
      return { label: "Last 30 days", from, to: endOfDay(today) };
    }
    const from = startOfDay(new Date());
    from.setDate(from.getDate() - 6);
    return { label: "Last 7 days", from, to: endOfDay(today) };
  }, [rangeKey]);

  const orgScope = useMemo(() => {
    if (!token) return { type: null, clinicId: null, restaurantId: null };
    try {
      const decoded = jwtDecode(token);
      const rawModel = (decoded?.orgModel || decoded?.org_type || decoded?.org || "").toLowerCase();
      const clinicId = decoded?.clinic_id ?? (rawModel === "clinic" ? decoded?.orgId : null) ?? null;
      const restaurantId = decoded?.restaurant_id ?? (rawModel === "restaurant" ? decoded?.orgId : null) ?? null;

      let type = null;
      if (rawModel.includes("clinic")) type = "clinic";
      else if (rawModel.includes("restaurant")) type = "restaurant";
      else if (clinicId && !restaurantId) type = "clinic";
      else if (restaurantId && !clinicId) type = "restaurant";

      return { type, clinicId, restaurantId };
    } catch (error) {
      console.error("Failed to decode token for org scope", error);
      return { type: null, clinicId: null, restaurantId: null };
    }
  }, [token]);

  const clinicId = orgScope.type === "clinic" ? orgScope.clinicId : null;
  const restaurantId = orgScope.type === "restaurant" ? orgScope.restaurantId : null;

  const {
    data: clinicAppointments = [],
    isFetching: appointmentsFetching,
  } = useGetClinicAppointmentsQuery(clinicId, { skip: !clinicId });
  const {
    data: clinicPatients = [],
    isFetching: patientsFetching,
  } = useGetClinicPatientsQuery(clinicId, { skip: !clinicId });

  const {
    data: restaurantOrders = [],
    isFetching: ordersFetching,
  } = useGetRestaurantOrdersQuery(restaurantId, { skip: !restaurantId });
  const {
    data: restaurantCustomers = [],
    isFetching: customersFetching,
  } = useGetRestaurantCustomersQuery(restaurantId, { skip: !restaurantId });
  const {
    data: restaurantUpsells = [],
    isFetching: upsellsFetching,
  } = useGetRestaurantUpsellsQuery(restaurantId, { skip: !restaurantId });

  const { data, isLoading, isFetching, isError, refetch } = useGetCallsQuery(
    {
      page: 1,
      pageSize: 500,
      from: range.from?.toISOString(),
      to: range.to?.toISOString(),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(directionFilter ? { direction: directionFilter } : {}),
    },
    { pollingInterval: 15000, refetchOnFocus: true, refetchOnReconnect: true },
  );

  const calls = data?.data?.calls ?? data?.calls ?? [];
  const stats = useDashboardStats(calls);
  const clinicSnapshot = useMemo(() => {
    const appointments = Array.isArray(clinicAppointments) ? clinicAppointments : [];
    const patients = Array.isArray(clinicPatients) ? clinicPatients : [];
    const now = new Date();
    const todayKey = now.toDateString();

    const appointmentsWithTime = appointments.map((appt) => ({
      start: parseDate(appt.confirmed_time || appt.requested_time),
      status: (appt.status || "").toLowerCase(),
      viaCall: Boolean(appt.via_call_id),
    }));

    const today = appointmentsWithTime.filter(
      (appt) => appt.start && isSameDay(appt.start, now),
    ).length;
    const upcoming = appointmentsWithTime.filter(
      (appt) => appt.start && appt.start > now,
    ).length;
    const confirmed = appointmentsWithTime.filter(
      (appt) => appt.status === "confirmed",
    ).length;
    const aiBooked = appointmentsWithTime.filter((appt) => appt.viaCall).length;
    const total = appointmentsWithTime.length;
    const confirmedRate = total ? Math.round((confirmed / total) * 100) : 0;

    const patientsSeenToday = patients.filter((patient) => {
      const lastSeen = parseDate(patient.last_seen_at);
      return lastSeen && lastSeen.toDateString() === todayKey;
    }).length;

    return {
      appointments: total,
      today,
      upcoming,
      confirmed,
      confirmedRate,
      aiBooked,
      patients: patients.length,
      patientsSeenToday,
    };
  }, [clinicAppointments, clinicPatients]);

  const restaurantSnapshot = useMemo(() => {
    const orders = Array.isArray(restaurantOrders) ? restaurantOrders : [];
    const customers = Array.isArray(restaurantCustomers) ? restaurantCustomers : [];
    const upsells = Array.isArray(restaurantUpsells) ? restaurantUpsells : [];
    const today = new Date();

    let revenue = 0;
    let todayOrders = 0;
    let pendingOrders = 0;
    let deliveryOrders = 0;

    orders.forEach((order) => {
      const amount = Number(order.total_amount || 0);
      if (!Number.isNaN(amount)) revenue += amount;

      const created = parseDate(order.created_at);
      if (created && isSameDay(created, today)) todayOrders += 1;

      const status = (order.status || "").toLowerCase();
      if (status === "pending") pendingOrders += 1;

      const mode = (order.delivery_or_pickup || "").toLowerCase();
      if (mode === "delivery") deliveryOrders += 1;
    });

    const avgOrderValue = orders.length ? revenue / orders.length : 0;
    const upsellAccepted = upsells.filter((u) => (u.status || "").toLowerCase() === "accepted").length;

    return {
      orders: orders.length,
      revenue,
      avgOrderValue,
      todayOrders,
      pendingOrders,
      customers: customers.length,
      deliveryOrders,
      upsellAccepted,
    };
  }, [restaurantOrders, restaurantCustomers, restaurantUpsells]);

  const clinicSnapshotLoading = orgScope.type === "clinic" && (appointmentsFetching || patientsFetching);
  const restaurantSnapshotLoading =
    orgScope.type === "restaurant" && (ordersFetching || customersFetching || upsellsFetching);

  const heroBadges = [
    { text: isFetching ? "Syncing" : "Live", icon: Zap, className: "bg-success/10 text-success border-success/20" },
  ];
  if (isError) {
    heroBadges.push({ text: "Data issue", icon: AlertTriangle, className: "bg-red-50 text-red-600 border-red-100" });
  } else {
    heroBadges.push({ text: "All Systems Good", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-100" });
  }

  const heroStats = [
    { label: "Calls (7d)", value: stats.total.toString() },
    { label: "Answer Rate", value: `${stats.answerRate.toFixed(1)}%` },
    { label: "Avg Duration", value: formatDuration(stats.avgDurationMs) },
    { label: "Positive Sentiment", value: stats.positiveSentiment != null ? `${stats.positiveSentiment}%` : "—" },
  ];

  const kpiCards = [
    {
      title: "Calls Today",
      value: stats.callsToday.toString(),
      footer: `${stats.answeredToday} answered • ${stats.missedToday} missed`,
      icon: Phone,
      variant: "default",
    },
    {
      title: "Completed (7d)",
      value: stats.answered.toString(),
      footer: `${stats.total} total`,
      icon: CheckCircle,
      variant: "success",
    },
    {
      title: "Avg Duration",
      value: formatDuration(stats.avgDurationMs),
      footer: "Completed calls",
      icon: Clock3,
      variant: "primary",
    },
    {
      title: "In Progress",
      value: stats.inProgress.toString(),
      footer: isFetching ? "Updating…" : "Active sessions",
      icon: Activity,
      variant: stats.inProgress ? "warning" : "default",
    },
  ];

  return (
    <div className="space-y-8">
      <Hero
        title="AI Receptionist Dashboard"
        subtitle={`Realtime view • ${range.label}`}
        badges={heroBadges}
        stats={heroStats}
        variant="minimal"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: RANGE_PRESETS.today, label: "Today" },
            { key: RANGE_PRESETS.last7, label: "Last 7d" },
            { key: RANGE_PRESETS.last30, label: "Last 30d" },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => setRangeKey(preset.key)}
              className={`rounded-full px-3 py-1.5 text-sm border transition ${
                rangeKey === preset.key
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-background-hover text-textcolor-secondary hover:border-muted"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-background-hover bg-white px-3 py-2 text-sm text-textcolor-secondary focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Status: All</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="in_progress">In Progress</option>
          </select>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="rounded-lg border border-background-hover bg-white px-3 py-2 text-sm text-textcolor-secondary focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Direction: All</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter("");
              setDirectionFilter("");
            }}
            className="rounded-lg border border-background-hover bg-white px-3 py-2 text-sm text-textcolor-secondary hover:border-muted"
          >
            Clear
          </button>
        </div>
      </div>
      <KPICards cards={kpiCards} isLoading={isLoading && !calls.length} tone="flat" accentColor="#00B140" />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-textcolor-default">Business Snapshot</h3>
          {orgScope.type ? (
            <span className="text-sm text-muted capitalize">{orgScope.type}</span>
          ) : (
            <span className="text-sm text-muted">Connect org to see totals</span>
          )}
        </div>

        {orgScope.type === "clinic" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Appointments"
              value={clinicSnapshotLoading ? "…" : clinicSnapshot.appointments.toString()}
              footer={
                clinicSnapshotLoading
                  ? ""
                  : `${clinicSnapshot.today} today • ${clinicSnapshot.upcoming} upcoming`
              }
              icon={CalendarCheck2}
              variant="primary"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="Confirmed Rate"
              value={clinicSnapshotLoading ? "…" : `${clinicSnapshot.confirmedRate}%`}
              footer={clinicSnapshotLoading ? "" : `${clinicSnapshot.confirmed} confirmed`}
              icon={CheckCircle}
              variant="success"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="AI Booked"
              value={clinicSnapshotLoading ? "…" : clinicSnapshot.aiBooked.toString()}
              footer={clinicSnapshotLoading ? "" : `${clinicSnapshot.patientsSeenToday} seen today`}
              icon={Phone}
              variant="warning"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="Patients"
              value={clinicSnapshotLoading ? "…" : clinicSnapshot.patients.toString()}
              footer={clinicSnapshotLoading ? "" : "Unique patients on file"}
              icon={Users}
              variant="default"
              tone="flat"
              accentColor="#00B140"
            />
          </div>
        ) : orgScope.type === "restaurant" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Revenue"
              value={
                restaurantSnapshotLoading ? "…" : formatCurrency(restaurantSnapshot.revenue)
              }
              footer={
                restaurantSnapshotLoading
                  ? ""
                  : `Avg ${formatCurrency(restaurantSnapshot.avgOrderValue)} / order`
              }
              icon={Wallet}
              variant="primary"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="Orders"
              value={restaurantSnapshotLoading ? "…" : restaurantSnapshot.orders.toString()}
              footer={
                restaurantSnapshotLoading
                  ? ""
                  : `${restaurantSnapshot.todayOrders} today • ${restaurantSnapshot.pendingOrders} pending`
              }
              icon={ShoppingBag}
              variant="success"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="Customers"
              value={restaurantSnapshotLoading ? "…" : restaurantSnapshot.customers.toString()}
              footer={restaurantSnapshotLoading ? "" : "Across this restaurant"}
              icon={Users}
              variant="default"
              tone="flat"
              accentColor="#00B140"
            />
            <StatCard
              title="Delivery"
              value={restaurantSnapshotLoading ? "…" : restaurantSnapshot.deliveryOrders.toString()}
              footer={
                restaurantSnapshotLoading ? "" : `${restaurantSnapshot.upsellAccepted} upsells accepted`
              }
              icon={Truck}
              variant="warning"
              tone="flat"
              accentColor="#00B140"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-background-hover bg-white p-5 text-muted">
            Organization scope missing. Sign in or switch to a clinic/restaurant to see revenue and booking totals.
          </div>
        )}
      </section>
      <Charts
        weeklyData={stats.weeklyData}
        hourlyData={stats.hourlyData}
        isLoading={isLoading && !calls.length}
      />
      {/* <KPICards /> */}
      <Charts />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PieChart
          title="Call Categories"
          subtitle="Distribution of call types this week"
          icon={Phone}
          data={stats.statusDistribution}
          innerRadius={60}
          outerRadius={90}
          height={220}
          isLoading={isLoading && !calls.length}
        />
        <RecentActivity
          calls={stats.recentCalls}
          isLoading={isLoading && !calls.length}
          isRefreshing={isFetching}
          onRefresh={refetch}
        />
      </div>
    </div>
  );
}

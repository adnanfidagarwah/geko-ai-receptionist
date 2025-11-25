import {
  SettingsIcon,
  Sparkles,
  UserCheck,
  CalendarClock,
  PhoneCall,
  Clock3,
  Star,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import Tabs from "../components/ui/Tabs";
import BusinessInformation from "../components/settings/BusinessInformation";
import BusinessHours from "../components/settings/BusinessHours";
import { Badge } from "../components/ui/Badge";

const performanceMetrics = [
  {
    label: "Answer Rate",
    value: "98.2%",
    change: "+2.3% vs last week",
    icon: PhoneCall,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    label: "Avg Response Time",
    value: "1.4s",
    change: "-0.4s faster",
    icon: CalendarClock,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
  {
    label: "Avg Call Duration",
    value: "2.1m",
    change: "+0.3m today",
    icon: Clock3,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    label: "Customer Rating",
    value: "4.7 / 5",
    change: "94% positive",
    icon: Star,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
];

const heroHighlights = [
  {
    label: "Plan",
    value: "Pro Clinic",
    icon: ShieldCheck,
  },
  {
    label: "Seats used",
    value: "3 of 5 teammates",
    icon: UserCheck,
  },
  {
    label: "Renews on",
    value: "Oct 23, 2024",
    icon: CalendarClock,
  },
];

const planDetails = {
  name: "Pro Clinic",
  amount: "$129 / mo",
  seats: "3 of 5 seats used",
  renewal: "Renews Oct 23, 2024",
};

const securityChecklist = [
  {
    title: "Multi-factor authentication",
    description: "All admins require MFA at sign-in.",
    status: "Good",
    icon: ShieldCheck,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    title: "Call recording retention",
    description: "Auto-delete enabled after 90 days.",
    status: "Good",
    icon: ShieldCheck,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    title: "Team alerts",
    description: "Weekly performance digest not scheduled.",
    status: "Action needed",
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
];

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background.DEFAULT via-white to-background-hover/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-accent p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-white/20 blur-3xl opacity-70" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-60 w-60 rounded-full bg-accent/30 blur-3xl opacity-60" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  <Sparkles className="h-4 w-4" />
                  Control Center
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <SettingsIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold leading-tight">
                      Account & Business Settings
                    </h1>
                    <p className="text-sm text-white/80">
                      Keep your reception assistant on-brand, secure, and up to date.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary flex items-center gap-2 whitespace-nowrap bg-white/15 px-4 py-2 font-medium text-white backdrop-blur transition hover:bg-white/25">
                  <CreditCard className="h-4 w-4" />
                  Manage billing
                </button>
                <button className="btn-secondary flex items-center gap-2 whitespace-nowrap bg-white text-primary px-4 py-2 font-medium shadow transition hover:bg-white/90">
                  <UserCheck className="h-4 w-4" />
                  Invite teammate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {heroHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/70">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {/* Metrics */}
            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-md backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-dark">
                    Call performance snapshot
                  </h2>
                  <p className="text-sm text-textcolor-secondary">
                    Realtime metrics from your AI receptionist.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {performanceMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-background-hover/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconBg}`}
                        >
                          <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                        </div>
                      </div>
                      <p className="mt-5 text-2xl font-semibold text-primary-dark">
                        {metric.value}
                      </p>
                      <p className="text-sm text-textcolor-secondary">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-xs font-medium text-primary">
                        {metric.change}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs for forms */}
            <Tabs
              tabs={[
                {
                  key: "business",
                  label: "Business Information",
                  content: <BusinessInformation />,
                },
                {
                  key: "hours",
                  label: "Business Hours",
                  content: <BusinessHours />,
                },
              ]}
            />
          </div>

          <div className="space-y-6">
            {/* Plan card */}
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-md backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-dark">
                    Subscription overview
                  </h3>
                  <p className="text-sm text-textcolor-secondary">
                    Stay ahead of billing and seat usage.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm text-textcolor-secondary">
                <div className="flex items-center justify-between">
                  <span>Current plan</span>
                  <span className="font-medium text-primary-dark">
                    {planDetails.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly cost</span>
                  <span className="font-medium text-primary-dark">
                    {planDetails.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Seats in use</span>
                  <span className="font-medium text-primary-dark">
                    {planDetails.seats}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next renewal</span>
                  <span className="font-medium text-primary-dark">
                    {planDetails.renewal}
                  </span>
                </div>
              </div>
              {/* <div className="mt-6 flex flex-col gap-3">
                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Update payment method
                </button>
                <button className="btn-secondary w-full flex items-center justify-center gap-2">
                  View invoices
                </button>
              </div> */}
            </div>

            {/* Security checklist */}
            {/* <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-md backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary-dark">
                    Security center
                  </h3>
                  <p className="text-sm text-textcolor-secondary">
                    Recommended actions to keep your data protected.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {securityChecklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-background-hover/60 bg-white p-4"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}
                        >
                          <Icon className={`h-5 w-5 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary-dark">
                            {item.title}
                          </p>
                          <p className="text-xs text-textcolor-secondary">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.status === "Good" ? "success" : "warning"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <button className="btn-secondary mt-6 w-full">
                Review security settings
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

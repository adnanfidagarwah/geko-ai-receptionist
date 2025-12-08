import {
  SettingsIcon,
  Sparkles,
  UserCheck,
  CalendarClock,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Tabs from "../components/ui/Tabs";
import BusinessInformation from "../components/settings/BusinessInformation";
import BusinessHours from "../components/settings/BusinessHours";
import AccountSettings from "../components/settings/AccountSettings";

const heroHighlights = [
  {
    label: "Plan",
    value: "Pro Clinic",
    icon: ShieldCheck,
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
  renewal: "Renews Oct 23, 2024",
};


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
                {
                  key: "account",
                  label: "Account Settings",
                  content: <AccountSettings />,
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
                  <span>Next renewal</span>
                  <span className="font-medium text-primary-dark">
                    {planDetails.renewal}
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

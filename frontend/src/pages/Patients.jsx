import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  Users,
  UserPlus,
  Activity,
  Clock3,
  Eye,
  Loader2,
} from "lucide-react";
import Table from "../components/ui/Table";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import { selectAuth } from "../features/auth/authSlice";
import { useGetClinicPatientsQuery } from "../features/api/appApi";

const columns = [
  { key: "name", label: "Patient" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "created", label: "Added" },
];

const formatPhone = (value) => {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
};

const formatDate = (value, fallback = "—") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function PatientsPage() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { token } = useSelector(selectAuth);

  const clinicId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded?.clinic_id ?? decoded?.orgId ?? null;
    } catch (error) {
      console.error("Failed to decode auth token", error);
      return null;
    }
  }, [token]);

  const {
    data: patients = [],
    isLoading,
    isFetching,
    isError,
  } = useGetClinicPatientsQuery(clinicId, { skip: !clinicId });

  const stats = useMemo(() => {
    const total = patients.length;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newThisMonth = patients.filter((patient) => {
      if (!patient?.created_at) return false;
      const created = new Date(patient.created_at);
      return !Number.isNaN(created.getTime()) && created >= thirtyDaysAgo;
    }).length;

    const active = patients.filter((patient) => {
      if (!patient?.last_seen_at) return false;
      const seen = new Date(patient.last_seen_at);
      return !Number.isNaN(seen.getTime()) && seen >= thirtyDaysAgo;
    }).length;

    const avgResponse = (() => {
      const diffs = patients
        .map((patient) => {
          if (!patient?.created_at || !patient?.last_seen_at) return null;
          const created = new Date(patient.created_at);
          const lastSeen = new Date(patient.last_seen_at);
          if (Number.isNaN(created.getTime()) || Number.isNaN(lastSeen.getTime())) return null;
          const diff = Math.max(lastSeen.getTime() - created.getTime(), 0);
          return diff / (1000 * 60 * 60 * 24);
        })
        .filter((days) => typeof days === "number" && Number.isFinite(days));
      if (!diffs.length) return "N/A";
      const avgDays = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
      return `${avgDays.toFixed(1)} days`;
    })();

    return [
      {
        label: "Total Patients",
        value: total.toString(),
        icon: Users,
        accent: "from-primary to-accent",
      },
      {
        label: "Active (30d)",
        value: active.toString(),
        icon: Activity,
        accent: "from-green-500 to-emerald-500",
      },
      {
        label: "New This Month",
        value: newThisMonth.toString(),
        icon: UserPlus,
        accent: "from-blue-500 to-indigo-500",
      },
      {
        label: "Avg Follow-up",
        value: avgResponse,
        icon: Clock3,
        accent: "from-amber-500 to-orange-500",
      },
    ];
  }, [patients]);

  const rows = useMemo(
    () =>
      patients.map((patient) => ({
        id: patient.id,
        name: patient.name || "Unknown",
        phone: formatPhone(patient.phone),
        email: patient.email || "Not Provided",
        created: formatDate(patient.created_at),
        raw: patient,
      })),
    [patients],
  );

  if (!clinicId) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">Clinic not selected</h2>
          <p className="mt-2 text-sm">
            Patients are scoped per clinic. Please select or create a clinic to view patient records.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !patients.length) {
    return (
      <div className="flex h-96 items-center justify-center text-neutral-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading patients…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">Unable to load patients</h2>
          <p className="mt-2 text-sm">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  const actions = [
    ({ row }) => (
      <button
        type="button"
        className="inline-flex items-center rounded-md p-1.5 text-primary-500 transition hover:bg-primary-50"
        onClick={() => setSelectedPatient(row.raw)}
        title="View patient details"
      >
        <Eye className="h-4 w-4" />
      </button>
    ),
  ];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/90 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 sm:text-xl">
              Patient Directory
            </h1>
            <p className="text-sm text-neutral-500">
              Track patient interactions, follow-up opportunities, and engagement trends.
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold text-neutral-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        {rows.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-neutral-500">
            <Users className="mb-3 h-8 w-8" />
            <p className="text-sm font-medium">No patients found</p>
            <p className="mt-1 text-xs text-neutral-400">
              Once your receptionist interacts with callers they will appear here.
            </p>
          </div>
        ) : (
          <Table
            title="Patients"
            subtitle="Complete list of callers and registered patients"
            columns={columns}
            data={rows}
            actions={actions}
            searchable
            searchPlaceholder="Search patients by name, email, or phone..."
            pageSizeOptions={[5, 10, 25, 50]}
            defaultPageSize={10}
            isLoading={isFetching}
          />
        )}
      </section>

      <PatientDetailsModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}

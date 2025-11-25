import {
  X,
  Phone,
  Mail,
  CalendarDays,
  Clock,
  User,
} from "lucide-react";

const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const options = withTime
    ? {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    : {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
  return date.toLocaleString(undefined, options);
};

const infoRow = (Icon, label, value) => (
  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
    <Icon className="mt-0.5 h-4 w-4 text-primary-500" />
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-800 break-all">{value || "—"}</p>
    </div>
  </div>
);

export default function PatientDetailsModal({ patient, onClose }) {
  if (!patient) return null;

  const raw = patient.rawCall ?? patient.raw ?? patient;

  const {
    full_name,
    phone,
    email,
    dob,
    last_seen_at,
    created_at,
    updated_at,
  } = raw || {};

  const safeName = patient.caller ?? patient.name ?? full_name ?? "Unlisted patient";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-200 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <User className="h-4 w-4 text-primary-500" />
              Patient Profile
            </div>
            <h3 className="mt-1 text-xl font-semibold text-neutral-900">
              {safeName}
            </h3>
            <p className="text-xs text-neutral-400">
              Last updated {formatDate(updated_at || created_at, true)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close patient details"
            className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] space-y-5 overflow-y-auto p-5">
          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Contact Information
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {infoRow(Phone, "Phone", phone || patient.phone)}
              {infoRow(Mail, "Email", email || patient.email)}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Timeline
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {infoRow(CalendarDays, "First Seen", formatDate(created_at, true))}
              {infoRow(CalendarDays, "Last Seen", formatDate(last_seen_at, true))}
              {infoRow(CalendarDays, "Date of Birth", formatDate(dob))}
              {infoRow(Clock, "Profile Updated", formatDate(updated_at, true))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

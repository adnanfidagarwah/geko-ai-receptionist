import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Phone, Mail, Calendar as CalendarIcon, Clock, User, Bot } from "lucide-react";

const formatLine = (value) => value && value !== "—" ? value : null;

const formatDateRange = (event) => {
  if (!event?.dateLabel || !event?.timeLabel) return null;
  return `${event.dateLabel} • ${event.timeLabel}`;
};

export default function AppointmentPopover({ event, anchor, onClose }) {
  useEffect(() => {
    if (!event) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [event, onClose]);

  const layout = useMemo(() => {
    if (!anchor) {
      return { top: 0, left: 0, width: Math.min(340, window.innerWidth - 16), hidden: true };
    }
    const width = Math.min(340, window.innerWidth - 16);
    const viewportHeight = window.innerHeight;
    const padding = 12;

    const spaceBelow = viewportHeight - anchor.bottom;
    const spaceAbove = anchor.top;
    const shouldFlipUp = spaceBelow < 240 && spaceAbove > spaceBelow;

    const top = shouldFlipUp
      ? Math.max(padding, anchor.top - 220)
      : Math.min(viewportHeight - 220 - padding, anchor.bottom + 12);

    const left = Math.min(
      window.innerWidth - width - padding,
      Math.max(padding, anchor.left + anchor.width / 2 - width / 2),
    );

    return { top, left, width, flip: shouldFlipUp, hidden: false };
  }, [anchor]);

  if (!event || !anchor || layout.hidden) return null;

  const entries = [
    {
      icon: CalendarIcon,
      label: "When",
      value: formatDateRange(event),
    },
    {
      icon: User,
      label: "Patient",
      value: formatLine(event.patient),
    },
    {
      icon: Phone,
      label: "Phone",
      value: formatLine(event.phone),
    },
    {
      icon: Mail,
      label: "Email",
      value: formatLine(event.email),
    },
    {
      icon: Clock,
      label: "Duration",
      value: formatLine(event.duration),
    },
  ].filter((item) => item.value);

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl bg-white shadow-2xl border border-neutral-200"
        style={{ top: layout.top, left: layout.left, width: layout.width }}
      >
        <div className="flex items-start justify-between border-b border-neutral-200 p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Appointment</p>
            <h3 className="text-lg font-semibold text-neutral-900">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: event.backgroundColor || "#2563EB" }}
                />
                {event.status}
              </span>
              {event.bookedBy && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
                  <Bot className="h-3.5 w-3.5" />
                  {event.bookedBy}
                </span>
              )}
            </div>
          </div>
          <button
            className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {entries.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 text-sm text-neutral-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-primary-500">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
                <p className="mt-0.5 font-medium">{value}</p>
              </div>
            </div>
          ))}

          {event.notes && event.notes.trim() && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

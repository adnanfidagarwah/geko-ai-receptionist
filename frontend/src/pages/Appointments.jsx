import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Clock,
  Plus,
  Edit as EditIcon,
  Trash as TrashIcon,
  Phone,
  ArrowsUpFromLine,
  ChartColumnDecreasing,
  CalendarCheck2,
  User,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { selectAuth } from "../features/auth/authSlice";
import { useGetClinicAppointmentsQuery } from "../features/api/appApi";
import MiniStat from "../components/ui/MiniStatCard";
import AddAppointmentModal from "../components/appointments/AppointmentModal";
import AppointmentPopover from "../components/appointments/AppointmentPopover";

const DEFAULT_DURATION_MINUTES = 30;

const statusColors = {
  confirmed: { chip: "bg-green-100 text-green-700", calendar: "#22C55E" },
  pending: { chip: "bg-yellow-100 text-yellow-700", calendar: "#FACC15" },
  cancelled: { chip: "bg-red-100 text-red-700", calendar: "#EF4444" },
};

const formatDateLabel = (date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTimeLabel = (date) =>
  date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const toTitleCase = (value) => {
  if (!value) return "Unknown";
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export default function AppointmentsPage() {
  const [view, setView] = useState("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popover, setPopover] = useState({ event: null, anchor: null });

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
    data: appointments = [],
    isLoading: appointmentsLoading,
    isFetching: appointmentsFetching,
  } = useGetClinicAppointmentsQuery(clinicId, { skip: !clinicId });

  const events = useMemo(() => {
    if (!appointments?.length) return [];

    return appointments
      .map((appt) => {
        const startISO = appt.confirmed_time || appt.requested_time;
        if (!startISO) return null;

        const startDate = new Date(startISO);
        if (Number.isNaN(startDate.getTime())) return null;

        const durationMinutes = appt.duration_minutes || DEFAULT_DURATION_MINUTES;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        const statusKey = (appt.status || "confirmed").toLowerCase();
        const statusMeta = statusColors[statusKey] || statusColors.confirmed;

        const baseEvent = {
          id: appt.id,
          title: appt.patient_name || appt.service_name || "Appointment",
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          patient: appt.patient_name || "Unknown patient",
          service: appt.service_name || "General consultation",
          duration: `${durationMinutes} min`,
          phone: appt.patient_phone || "—",
          email: appt.patient_email || "—",
          notes: appt.notes || "",
          status: toTitleCase(appt.status || "confirmed"),
          statusKey,
          bookedBy: appt.via_call_id ? "AI Receptionist" : "Staff",
          backgroundColor: statusMeta.calendar,
          dateLabel: formatDateLabel(startDate),
          timeLabel: formatTimeLabel(startDate),
        };

        return {
          ...baseEvent,
          extendedProps: { ...baseEvent },
        };
      })
      .filter(Boolean);
  }, [appointments]);

  const isLoading = appointmentsLoading || appointmentsFetching;

  useEffect(() => {
    setPopover({ event: null, anchor: null });
  }, [view, appointments]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todaysAppointments = events.filter((event) => {
    const date = new Date(event.start);
    return date >= startOfToday && date < endOfToday;
  }).length;

  const weeksAppointments = events.filter((event) => {
    const date = new Date(event.start);
    return date >= startOfWeek && date < endOfWeek;
  }).length;

  const aiBookings = appointments.filter((appt) => Boolean(appt.via_call_id)).length;
  const confirmedCount = appointments.filter(
    (appt) => (appt.status || "").toLowerCase() === "confirmed"
  ).length;
  const bookingRate = appointments.length
    ? Math.round((confirmedCount / appointments.length) * 100)
    : 0;

  return (
    <>
      <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-gray-200 px-4 sm:px-5 py-4 shadow-sm mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/90 to-accent/90 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500">Manage and track your bookings</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full sm:w-auto">
          <div className="flex justify-between sm:justify-start items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setView("calendar")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                view === "calendar"
                  ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <CalendarIcon size={16} />
              Calendar
            </button>

            <button
              onClick={() => setView("list")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                view === "list"
                  ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <ListIcon size={16} />
              List
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-sm font-medium shadow hover:opacity-90 transition w-full sm:w-auto"
          >
            <Plus size={16} />
            New Appointment
          </button>

          {isModalOpen && <AddAppointmentModal onClose={() => setIsModalOpen(false)} />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat title="Today's Appointments" value={todaysAppointments.toString()} icon={CalendarCheck2} color="blue" />
        <MiniStat title="This Week" value={weeksAppointments.toString()} color="green" icon={ArrowsUpFromLine} />
        <MiniStat title="AI Bookings" value={aiBookings.toString()} icon={Phone} color="gray" />
        <MiniStat title="Booking Rate" value={`${bookingRate}%`} color="orange" icon={ChartColumnDecreasing} />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm font-medium">Loading appointments…</span>
          </div>
        ) : view === "calendar" ? (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            height="750px"
            events={events}
            dayMaxEvents={true}
            eventDisplay="block"
            eventClassNames="rounded-md text-xs font-medium text-white px-2 py-1"
            eventClick={(info) => {
              const bounds = info.el.getBoundingClientRect();
              const data = {
                ...info.event.extendedProps,
                title: info.event.title,
              };
              setPopover({ event: data, anchor: bounds });
            }}
            eventContent={(eventInfo) => (
              <div
                className="truncate px-2 py-1 rounded-md text-xs font-medium shadow-sm"
                style={{
                  backgroundColor: eventInfo.event.extendedProps.backgroundColor,
                }}
              >
                {eventInfo.timeText} {eventInfo.event.title}
              </div>
            )}
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-textcolor mb-2">Appointments List</h2>
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No appointments found. Once calls are booked you’ll see them here.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
                  onClick={(e) => {
                    const bounds = e.currentTarget.getBoundingClientRect();
                    setPopover({ event, anchor: bounds });
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <p className="flex items-center gap-1 font-semibold text-gray-900">
                        <CalendarIcon size={16} className="text-gray-500" />
                        {event.dateLabel}
                      </p>
                      <p className="flex items-center gap-1 text-gray-700">
                        <Clock size={16} className="text-gray-500" />
                        {event.timeLabel}
                      </p>
                      <p className="flex items-center gap-1 font-medium text-gray-900">
                        <User size={16} className="text-gray-500" />
                        {event.patient}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[event.statusKey]?.chip || statusColors.confirmed.chip
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Service</span>
                      <br />
                      {event.service}
                    </p>
                    <p>
                      <span className="font-medium">Duration</span>
                      <br />
                      {event.duration}
                    </p>
                    <p>
                      <span className="font-medium">Phone</span>
                      <br />
                      {event.phone}
                    </p>
                    <p>
                      <span className="font-medium">Booked by</span>
                      <br />
                      {event.bookedBy}
                    </p>
                  </div>

                  {event.notes && (
                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {event.notes}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-3">
                    <button className="text-gray-500 hover:text-primary">
                      <EditIcon size={16} />
                    </button>
                    <button className="text-red-500 hover:text-red-700">
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </div>
      <AppointmentPopover
        event={popover.event}
        anchor={popover.anchor}
        onClose={() => setPopover({ event: null, anchor: null })}
      />
    </>
  );
}

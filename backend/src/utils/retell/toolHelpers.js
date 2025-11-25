import { supabase } from "../../config/supabase.js";
import { createEvent } from "../google/calendar.js";
import {
  buildWindows,
  filterSlotsAgainstAppointments,
  generateSlotsForWindows,
  toWeekday,
  hhmmToMinutes,
} from "../../utils/appointmentsHelper.js";

const DEFAULT_SLOT_MINUTES = 30;
const MAX_PROPOSED_SLOTS = 12;
const DEFAULT_TIMEZONE = "America/Chicago";

const parseISODate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizePhone = (phone = "") => phone.replace(/[^0-9+]/g, "");

const isMissingColumn = (err, columnName) =>
  err?.code === "42703" ||
  new RegExp(`column .*${columnName}.* does not exist`, "i").test(err?.message || "");

const isTableMissing = (err, tableName) =>
  err?.code === "42P01" || new RegExp(`relation "${tableName}"`, "i").test(err?.message || "");

const isRLSPermDenied = (err) =>
  err?.code === "42501" || /permission denied/i.test(err?.message || "");

const isUniqueViolation = (err) =>
  err?.code === "23505" || /duplicate key value violates unique constraint/i.test(err?.message || "");

const fetchPrimaryLocation = async (clinicId) => {
  const { data, error } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }
  return data || null;
};

const getTimezone = (location) => location?.timezone || DEFAULT_TIMEZONE;

const weekdayNameForDate = (date, timezone) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(date);

const buildWindowsFromLocationHours = (location, date) => {
  if (!location?.hours) return [];
  const timezone = getTimezone(location);
  const dayName = weekdayNameForDate(date, timezone);
  const entry = location.hours?.[dayName];
  if (!entry || entry.closed) return [];

  const open = entry.open || "09:00";
  const close = entry.close || "17:00";
  const start = hhmmToMinutes(open);
  const end = hhmmToMinutes(close);
  return end > start ? [{ start, end }] : [];
};

const fetchServiceDurationsMap = async (clinicId) => {
  const result = {};
  const { data, error } = await supabase
    .from("clinic_services")
    .select("name,duration_minutes")
    .eq("clinic_id", clinicId);
  if (error) throw new Error(error.message);

  (data || []).forEach((svc) => {
    if (!svc.name) return;
    result[svc.name] = Number(svc.duration_minutes || DEFAULT_SLOT_MINUTES);
  });
  return result;
};

const loadClinicCalendarConfig = async (clinicId) => {
  const { data, error } = await supabase
    .from("clinics")
    .select("id,name,google_calendar_id,google_refresh_token")
    .eq("id", clinicId)
    .maybeSingle();

  if (error) {
    if (
      isMissingColumn(error, "google_refresh_token") ||
      isMissingColumn(error, "google_calendar_id")
    ) {
      return null;
    }
    if (error.code !== "PGRST116") {
      throw new Error(error.message);
    }
    return null;
  }

  if (!data?.google_refresh_token) return null;

  return {
    clinicName: data.name || "Clinic",
    refreshToken: data.google_refresh_token,
    calendarId: data.google_calendar_id || "primary",
  };
};

const maybeSyncAppointmentToGoogle = async ({
  clinicId,
  service,
  patient,
  startISO,
  endISO,
  notes,
  appointmentId,
}) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return;

  let calendarConfig;
  try {
    calendarConfig = await loadClinicCalendarConfig(clinicId);
  } catch (error) {
    console.error("loadClinicCalendarConfig error:", error);
    return;
  }
  if (!calendarConfig) return;

  let location = null;
  try {
    location = await fetchPrimaryLocation(clinicId);
  } catch (error) {
    console.error("fetchPrimaryLocation error:", error);
  }

  const tz = getTimezone(location);
  const locationLabel =
    [location?.label, location?.address].filter(Boolean).join(" - ") ||
    location?.label ||
    location?.address ||
    "";
  const patientName = patient.full_name || patient.name || "Patient";
  const summary = `${service || "Appointment"} – ${patientName}`;
  const noteLines = [
    notes,
    patient?.phone ? `Phone: ${patient.phone}` : null,
    patient?.email ? `Email: ${patient.email}` : null,
  ].filter(Boolean);
  const description = noteLines.length ? noteLines.join("\n") : "";

  try {
    const event = await createEvent({
      oauth: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: calendarConfig.refreshToken,
      },
      calendarId: calendarConfig.calendarId,
      appt: {
        title: summary,
        patientName: patient.full_name,
        patientEmail: patient.email || null,
        startISO,
        endISO,
        tz,
        notes: description,
        location: locationLabel,
      },
    });
    const eventId = event?.id;
    if (eventId && appointmentId) {
      const { error } = await supabase
        .from("appointments")
        .update({ google_event_id: eventId })
        .eq("id", appointmentId);
      if (error && !isMissingColumn(error, "google_event_id")) {
        console.error("Failed to store Google event id:", error);
      }
    }
  } catch (error) {
    console.error("Google Calendar event creation failed:", error);
  }
};

const selectPatientByPhone = async ({ clinicId, phone }) => {
  let query = supabase
    .from("patients")
    .select("id")
    .or(`phone.eq.${phone},phone_number.eq.${phone}`)
    .limit(1)
    .maybeSingle();
  if (clinicId) query = query.eq("clinic_id", clinicId);
  return query;
};

const queryPatientByPhone = async ({ clinicId, phone }) => {
  if (!phone) return { data: null, error: null };

  let query = supabase
    .from("patients")
    .select("*")
    .or(`phone.eq.${phone},phone_number.eq.${phone}`)
    .limit(1)
    .maybeSingle();
  if (clinicId) query = query.eq("clinic_id", clinicId);

  let result = await query;
  if (result.error && typeof result.error?.message === "string" && result.error.message.includes("patients.clinic_id")) {
    result = await supabase.from("patients").select("*").eq("phone", phone).limit(1).maybeSingle();
  }
  if (result.error && typeof result.error?.message === "string" && result.error.message.includes('relation "patients"')) {
    return { data: null, error: null };
  }
  return result;
};

const ensurePatientRecord = async (clinicId, patient) => {
  if (!clinicId) throw new Error("clinic_id is required for patient");
  const rawPhone = patient?.phone || "";
  const phone = normalizePhone(rawPhone) || rawPhone;
  if (!phone) throw new Error("phone is required for patient");

  const existing = await selectPatientByPhone({ clinicId, phone });
  if (!existing.error && existing.data?.id) return existing.data.id;
  if (existing.error && isTableMissing(existing.error, "patients")) return null;
  if (existing.error && existing.error.code !== "PGRST116") throw new Error(existing.error.message);

  const payload = {
    clinic_id: clinicId,
    name: patient.full_name || patient.name || phone || "Patient",
    phone,
    phone_number: phone,
    email: patient.email ?? null,
  };

  const tryInsert = async (data) =>
    supabase.from("patients").insert([data]).select("id").single();

  let insertResult = await tryInsert(payload);

  if (insertResult.error && isMissingColumn(insertResult.error, "clinic_id")) {
    const { clinic_id, ...withoutClinic } = payload;
    insertResult = await tryInsert(withoutClinic);
  }
  if (insertResult.error && isMissingColumn(insertResult.error, "phone")) {
    const { phone: phoneField, ...withoutPhone } = payload;
    insertResult = await tryInsert(withoutPhone);
  }
  if (insertResult.error && isMissingColumn(insertResult.error, "phone_number")) {
    const { phone_number, ...withoutPhoneNumber } = payload;
    insertResult = await tryInsert(withoutPhoneNumber);
  }
  if (insertResult.error && isUniqueViolation(insertResult.error)) {
    const again = await selectPatientByPhone({ clinicId, phone });
    if (!again.error && again.data?.id) return again.data.id;
  }
  if (insertResult.error && isRLSPermDenied(insertResult.error)) {
    throw new Error("RLS blocked insert on patients. Grant insert for service key or disable RLS.");
  }
  if (insertResult.error) {
    console.error("ensurePatientRecord insert error:", insertResult.error);
    throw new Error(insertResult.error.message);
  }

  return insertResult.data?.id || null;
};

export {
  DEFAULT_SLOT_MINUTES,
  MAX_PROPOSED_SLOTS,
  DEFAULT_TIMEZONE,
  parseISODate,
  normalizePhone,
  fetchPrimaryLocation,
  getTimezone,
  buildWindows,
  generateSlotsForWindows,
  filterSlotsAgainstAppointments,
  toWeekday,
  buildWindowsFromLocationHours,
  fetchServiceDurationsMap,
  loadClinicCalendarConfig,
  maybeSyncAppointmentToGoogle,
  queryPatientByPhone,
  ensurePatientRecord,
};

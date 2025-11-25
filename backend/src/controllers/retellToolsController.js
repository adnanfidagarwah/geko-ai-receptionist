import { supabase } from "../config/supabase.js";
import { extractParameters, normalizeRequestBody } from "../utils/requestHelpers.js";
import { resolveClinicContext } from "../utils/clinicResolver.js";
import {
  DEFAULT_SLOT_MINUTES,
  MAX_PROPOSED_SLOTS,
  parseISODate,
  normalizePhone,
  fetchServiceDurationsMap,
  fetchPrimaryLocation,
  buildWindowsFromLocationHours,
  maybeSyncAppointmentToGoogle,
  queryPatientByPhone,
  ensurePatientRecord,
  buildWindows,
  generateSlotsForWindows,
  filterSlotsAgainstAppointments,
  toWeekday,
} from "../utils/retell/toolHelpers.js";

const respondError = (res, message, code = "BAD_REQUEST") =>
  res.json({ success: false, error_code: code, message });

export async function toolGetPatientByPhone(req, res) {
  try {
    const parameters = extractParameters(req);
    const { clinic_id: providedClinicId, caller_phone: callerPhone } = parameters;
    if (!callerPhone) return respondError(res, "caller_phone is required");

    const { clinicId } = await resolveClinicContext(req, providedClinicId);
    if (!clinicId) {
      return respondError(res, "clinic_id could not be resolved from request context", "BAD_REQUEST");
    }

    const normalized = normalizePhone(callerPhone);

    let patientRow = null;
    const directQuery = await queryPatientByPhone({ clinicId, phone: callerPhone });
    if (directQuery.error && directQuery.error.code !== "PGRST116") {
      throw new Error(directQuery.error.message);
    }
    patientRow = directQuery.data;

    if (!patientRow && normalized && normalized !== callerPhone) {
      const normalizedQuery = await queryPatientByPhone({ clinicId, phone: normalized });
      if (normalizedQuery.error && normalizedQuery.error.code !== "PGRST116") {
        throw new Error(normalizedQuery.error.message);
      }
      patientRow = normalizedQuery.data;
    }

    if (patientRow) {
      return res.json({
        success: true,
        patient: {
          id: patientRow.id || null,
          full_name: patientRow.full_name || patientRow.name || null,
          phone: patientRow.phone || callerPhone,
          email: patientRow.email || null,
          dob: patientRow.dob || null,
          last_seen_at: patientRow.updated_at || patientRow.last_seen_at || null,
        },
      });
    }

    const appointmentMatch = await supabase
      .from("appointments")
      .select("patient_name, patient_phone, patient_email, confirmed_time")
      .eq("clinic_id", clinicId)
      .eq("patient_phone", callerPhone)
      .order("confirmed_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (appointmentMatch.error && appointmentMatch.error.code !== "PGRST116") {
      throw new Error(appointmentMatch.error.message);
    }
    if (appointmentMatch.data) {
      return res.json({
        success: true,
        patient: {
          full_name: appointmentMatch.data.patient_name,
          phone: appointmentMatch.data.patient_phone,
          email: appointmentMatch.data.patient_email,
          last_seen_at: appointmentMatch.data.confirmed_time,
        },
      });
    }

    const normalizedAppointment = await supabase
      .from("appointments")
      .select("patient_name, patient_phone, patient_email, confirmed_time")
      .eq("clinic_id", clinicId)
      .like("patient_phone", `%${normalized}`)
      .order("confirmed_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (normalizedAppointment.error && normalizedAppointment.error.code !== "PGRST116") {
      throw new Error(normalizedAppointment.error.message);
    }
    if (normalizedAppointment.data) {
      return res.json({
        success: true,
        patient: {
          full_name: normalizedAppointment.data.patient_name,
          phone: normalizedAppointment.data.patient_phone,
          email: normalizedAppointment.data.patient_email,
          last_seen_at: normalizedAppointment.data.confirmed_time,
        },
      });
    }

    return respondError(res, "Patient not found", "NOT_FOUND");
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolGetServices(req, res) {
  try {
    const parameters = extractParameters(req);
    const { clinicId } = await resolveClinicContext(req, parameters.clinic_id);
    if (!clinicId) {
      return respondError(
        res,
        "clinic_id could not be resolved from request context",
        "BAD_REQUEST",
      );
    }

    const [{ data: services, error: servicesError }, { data: addOns, error: addOnsError }] =
      await Promise.all([
        supabase
          .from("clinic_services")
          .select("name, description, duration_minutes, price")
          .eq("clinic_id", clinicId),
        supabase
          .from("clinic_add_ons")
          .select("name, description, price")
          .eq("clinic_id", clinicId),
      ]);

    if (servicesError) throw new Error(servicesError.message);
    if (addOnsError) throw new Error(addOnsError.message);

    const catalog = [];
    (services || []).forEach((svc) =>
      catalog.push({
        type: "service",
        name: svc.name,
        description: svc.description,
        duration_minutes: Number(svc.duration_minutes || DEFAULT_SLOT_MINUTES),
        price: svc.price,
      }),
    );
    (addOns || []).forEach((addon) =>
      catalog.push({
        type: "add_on",
        name: addon.name,
        description: addon.description,
        duration_minutes: Number(addon.duration_minutes || 0),
        price: addon.price,
      }),
    );

    return res.json({ success: true, services: catalog });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolFindSlots(req, res) {
  try {
    const parameters = extractParameters(req);
    const {
      clinic_id: providedClinicId,
      service,
      window_start: windowStart,
      window_end: windowEnd,
    } = parameters;

    const { clinicId } = await resolveClinicContext(req, providedClinicId);
    if (!clinicId) {
      return respondError(
        res,
        "clinic_id could not be resolved from request context",
        "BAD_REQUEST",
      );
    }

    if (!service || !windowStart || !windowEnd) {
      return respondError(res, "service, window_start, window_end are required");
    }

    const startDate = parseISODate(windowStart);
    const endDate = parseISODate(windowEnd);
    if (!startDate || !endDate || startDate >= endDate) {
      return respondError(res, "Invalid time window");
    }

    const dateISO = startDate.toISOString();
    const dateStr = dateISO.slice(0, 10);

    const windowsFromHours = await supabase
      .from("clinic_working_hours")
      .select("is_open, open_time, close_time")
      .eq("clinic_id", clinicId)
      .eq("weekday", toWeekday(dateStr));
    if (windowsFromHours.error && windowsFromHours.error.code !== "PGRST116") {
      throw new Error(windowsFromHours.error.message);
    }

    const breaks = await supabase
      .from("clinic_working_breaks")
      .select("start_time, end_time")
      .eq("clinic_id", clinicId)
      .eq("weekday", toWeekday(dateStr));
    if (breaks.error && breaks.error.code !== "PGRST116") {
      throw new Error(breaks.error.message);
    }

    let windows = [];
    if (windowsFromHours.data && windowsFromHours.data.length) {
      windows = buildWindows(windowsFromHours.data, breaks.data || []);
    }

    if (!windows.length) {
      const location = await fetchPrimaryLocation(clinicId);
      if (!location) {
        return res.json({ success: true, slots: [], message: "Clinic hours unavailable" });
      }
      windows = buildWindowsFromLocationHours(location, startDate);
    }

    if (!windows.length) {
      return res.json({
        success: true,
        slots: [],
        message: "Clinic is closed during that window.",
      });
    }

    const serviceDurations = await fetchServiceDurationsMap(clinicId);
    const slotMinutes = serviceDurations[service] || DEFAULT_SLOT_MINUTES;
    const candidateTimes = generateSlotsForWindows(windows, slotMinutes);

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("confirmed_time, service_name")
      .eq("clinic_id", clinicId)
      .gte("confirmed_time", `${dateStr}T00:00:00Z`)
      .lt("confirmed_time", `${dateStr}T23:59:59Z`)
      .neq("status", "cancelled");
    if (appointmentsError) throw new Error(appointmentsError.message);

    const freeSlots = filterSlotsAgainstAppointments(
      candidateTimes,
      slotMinutes,
      appointments || [],
      serviceDurations,
    );

    const isoSlots = [];
    freeSlots.forEach((slot) => {
      const iso = `${dateStr}T${slot.time}:00Z`;
      const slotStart = new Date(iso);
      const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
      if (slotStart < startDate || slotEnd > endDate) return;
      if (isoSlots.length < MAX_PROPOSED_SLOTS) isoSlots.push(iso);
    });

    return res.json({ success: true, slots: isoSlots, slot_minutes: slotMinutes });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolCreateAppointment(req, res) {
  try {
    const body = normalizeRequestBody(req);
    const parameters = extractParameters(req);

    let { service, patient = {}, slot = {}, notes } = parameters;
    const { clinicId } = await resolveClinicContext(req, parameters.clinic_id);
    service = (service || "").trim();

    if (!clinicId) {
      return respondError(
        res,
        "clinic_id could not be resolved from request context",
        "BAD_REQUEST",
      );
    }
    if (!service || !patient.full_name || !patient.phone || !slot.start) {
      return respondError(
        res,
        "service, patient.full_name, patient.phone, slot.start are required",
      );
    }

    const start = parseISODate(slot.start);
    const end = parseISODate(slot.end);
    if (!start) return respondError(res, "Invalid slot.start");

    const serviceDurations = await fetchServiceDurationsMap(clinicId);
    const durationMinutes =
      end ?
        (end.getTime() - start.getTime()) / 60000 :
        serviceDurations[service] || DEFAULT_SLOT_MINUTES;
    const confirmedEnd = end || new Date(start.getTime() + durationMinutes * 60000);

    let patientId;
    try {
      patientId = await ensurePatientRecord(clinicId, patient);
    } catch (error) {
      return respondError(res, `Patient record error: ${error.message}`, "SERVER_ERROR");
    }
    if (!patientId) {
      return respondError(
        res,
        "Unable to store patient record (patients table missing or RLS/permissions)",
        "SERVER_ERROR",
      );
    }

    const callId = body?.call?.call_id || null;

    const insertPayload = {
      clinic_id: clinicId,
      service_name: service,
      status: "confirmed",
      requested_time: start.toISOString(),
      confirmed_time: start.toISOString(),
      patient_name: patient.full_name,
      patient_phone: normalizePhone(patient.phone),
      patient_id: patientId,
      ...(callId ? { via_call_id: callId } : {}),
    };

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert([insertPayload])
      .select()
      .single();
    if (error) throw new Error(error.message);

    await maybeSyncAppointmentToGoogle({
      clinicId,
      service,
      patient,
      startISO: start.toISOString(),
      endISO: confirmedEnd.toISOString(),
      notes,
      appointmentId: appointment.id,
    });

    return res.json({
      success: true,
      appointment_id: appointment.id,
      confirmed_time: appointment.confirmed_time,
    });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

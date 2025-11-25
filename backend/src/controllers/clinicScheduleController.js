// src/controllers/clinicScheduleController.js
import { supabase } from "../config/supabase.js";

/**
 * GET /api/clinics/:clinicId/working-hours?weekday=0..6
 */
export async function listWorkingHours(req, res) {
  const { clinicId } = req.params;
  const { weekday } = req.query;

  let q = supabase.from("clinic_working_hours").select("*").eq("clinic_id", clinicId).order("weekday");
  if (weekday !== undefined) q = q.eq("weekday", Number(weekday));

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ hours: data || [] });
}

/**
 * POST /api/clinics/:clinicId/working-hours
 * Body: { weekday: 0..6, open_time: "HH:MM", close_time: "HH:MM", is_open?: true }
 */
export async function addWorkingHour(req, res) {
  const { clinicId } = req.params;
  const { weekday, open_time, close_time, is_open = true } = req.body || {};
  if (weekday === undefined || !open_time || !close_time) {
    return res.status(400).json({ error: "weekday, open_time, close_time are required" });
  }

  const { data, error } = await supabase
    .from("clinic_working_hours")
    .insert([{ clinic_id: clinicId, weekday: Number(weekday), is_open, open_time, close_time }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ hour: data });
}

/**
 * PUT /api/clinics/:clinicId/working-hours/replace
 * Replace all windows for a specific weekday in one go.
 * Body: {
 *   weekday: 1,
 *   windows: [
 *     { open_time: "09:00", close_time: "13:00", is_open: true },
 *     { open_time: "15:00", close_time: "19:00", is_open: true }
 *   ]
 * }
 */
export async function replaceWorkingHoursForWeekday(req, res) {
  const { clinicId } = req.params;
  const { weekday, windows = [] } = req.body || {};
  if (weekday === undefined || !Array.isArray(windows)) {
    return res.status(400).json({ error: "weekday and windows[] are required" });
  }

  // Delete existing for this weekday
  const { error: delErr } = await supabase
    .from("clinic_working_hours")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("weekday", Number(weekday));
  if (delErr) return res.status(400).json({ error: delErr.message });

  if (!windows.length) return res.json({ ok: true, hours: [] });

  const rows = windows.map(w => ({
    clinic_id: clinicId,
    weekday: Number(weekday),
    is_open: w.is_open !== undefined ? !!w.is_open : true,
    open_time: w.open_time,
    close_time: w.close_time
  }));

  const { data, error } = await supabase.from("clinic_working_hours").insert(rows).select();
  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true, hours: data });
}

/**
 * PUT /api/clinics/:clinicId/working-hours/bulk
 * Body: {
 *   schedule: [
 *     { weekday: 1, windows: [{ open_time: "09:00", close_time: "17:00", is_open: true }] },
 *     ...
 *   ]
 * }
 * Replaces the complete weekly schedule in a single request.
 */
export async function replaceWorkingHoursBulk(req, res) {
  const { clinicId } = req.params;
  const { schedule = [] } = req.body || {};

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: "schedule[] is required" });
  }

  const rows = [];

  for (const entry of schedule) {
    if (entry?.weekday === undefined) {
      return res.status(400).json({ error: "Each schedule entry must include weekday" });
    }

    const weekday = Number(entry.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: `Invalid weekday: ${entry.weekday}` });
    }

    const windows = Array.isArray(entry.windows) ? entry.windows : [];
    for (const window of windows) {
      const open_time = window?.open_time;
      const close_time = window?.close_time;
      const is_open = window?.is_open !== false;

      if (!open_time || !close_time) {
        return res.status(400).json({ error: `open_time and close_time are required for weekday ${weekday}` });
      }

      rows.push({
        clinic_id: clinicId,
        weekday,
        is_open,
        open_time,
        close_time,
      });
    }
  }

  const { error: delErr } = await supabase
    .from("clinic_working_hours")
    .delete()
    .eq("clinic_id", clinicId);

  if (delErr) {
    return res.status(400).json({ error: delErr.message });
  }

  if (!rows.length) {
    return res.json({ ok: true, hours: [] });
  }

  const { error: insertErr } = await supabase
    .from("clinic_working_hours")
    .insert(rows);

  if (insertErr) {
    return res.status(400).json({ error: insertErr.message });
  }

  const { data: refreshed, error: fetchErr } = await supabase
    .from("clinic_working_hours")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("weekday")
    .order("open_time");

  if (fetchErr) {
    return res.status(400).json({ error: fetchErr.message });
  }

  res.json({ ok: true, hours: refreshed || [] });
}

/**
 * DELETE /api/clinics/:clinicId/working-hours/:hourId
 */
export async function deleteWorkingHour(req, res) {
  const { clinicId, hourId } = req.params;
  const { error } = await supabase
    .from("clinic_working_hours")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("id", hourId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

/* ========================= BREAKS ========================= */

/**
 * GET /api/clinics/:clinicId/working-breaks?weekday=0..6
 */
export async function listWorkingBreaks(req, res) {
  const { clinicId } = req.params;
  const { weekday } = req.query;

  let q = supabase.from("clinic_working_breaks").select("*").eq("clinic_id", clinicId).order("weekday");
  if (weekday !== undefined) q = q.eq("weekday", Number(weekday));

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ breaks: data || [] });
}

/**
 * POST /api/clinics/:clinicId/working-breaks
 * Body: { weekday: 0..6, start_time: "HH:MM", end_time: "HH:MM" }
 */
export async function addWorkingBreak(req, res) {
  const { clinicId } = req.params;
  const { weekday, start_time, end_time } = req.body || {};
  if (weekday === undefined || !start_time || !end_time) {
    return res.status(400).json({ error: "weekday, start_time, end_time are required" });
  }

  const { data, error } = await supabase
    .from("clinic_working_breaks")
    .insert([{ clinic_id: clinicId, weekday: Number(weekday), start_time, end_time }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ break: data });
}

/**
 * PUT /api/clinics/:clinicId/working-breaks/replace
 * Replace all breaks for a weekday.
 * Body: { weekday: 1, breaks: [{ start_time: "13:00", end_time: "15:00" }] }
 */
export async function replaceWorkingBreaksForWeekday(req, res) {
  const { clinicId } = req.params;
  const { weekday, breaks = [] } = req.body || {};
  if (weekday === undefined || !Array.isArray(breaks)) {
    return res.status(400).json({ error: "weekday and breaks[] are required" });
  }

  const { error: delErr } = await supabase
    .from("clinic_working_breaks")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("weekday", Number(weekday));
  if (delErr) return res.status(400).json({ error: delErr.message });

  if (!breaks.length) return res.json({ ok: true, breaks: [] });

  const rows = breaks.map(b => ({
    clinic_id: clinicId,
    weekday: Number(weekday),
    start_time: b.start_time,
    end_time: b.end_time
  }));

  const { data, error } = await supabase.from("clinic_working_breaks").insert(rows).select();
  if (error) return res.status(400).json({ error: error.message });

  res.json({ ok: true, breaks: data });
}

/**
 * DELETE /api/clinics/:clinicId/working-breaks/:breakId
 */
export async function deleteWorkingBreak(req, res) {
  const { clinicId, breakId } = req.params;
  const { error } = await supabase
    .from("clinic_working_breaks")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("id", breakId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

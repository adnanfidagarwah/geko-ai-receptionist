
import { retellClient } from "../config/retell.js";
import { supabase } from "../config/supabase.js";

export async function listCalls(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100);
    const fromRow = (page - 1) * pageSize;
    const toRow = fromRow + pageSize - 1;

    const direction = (req.query.direction || "").trim().toLowerCase();
    const status = (req.query.status || "").trim().toLowerCase();
    const fromDate = req.query.from;
    const toDate = req.query.to;
    const search = (req.query.search || "").trim();

    let query = supabase.from("call_logs").select("*", { count: "exact" });

    const clinicScope = req.user?.clinic_id;
    const restaurantScope = req.user?.restaurant_id;
    if (clinicScope) {
      query = query.eq("clinic_id", clinicScope);
    }
    if (restaurantScope) {
      query = query.eq("restaurant_id", restaurantScope);
    }

    if (direction && ["inbound", "outbound"].includes(direction)) {
      query = query.eq("direction", direction);
    }

    if (status === "completed") {
      query = query.gt("duration_ms", 0);
    } else if (status === "missed") {
      query = query.eq("duration_ms", 0);
    } else if (status === "in_progress") {
      query = query.is("end_timestamp", null);
    }

    const ISO8601_DATE = /^\d{4}-\d{2}-\d{2}$/;
    const normalizeDateInput = (value, endOfDay = false) => {
      if (!value || typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (!ISO8601_DATE.test(trimmed)) {
        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) return null;
        if (endOfDay) parsed.setHours(23, 59, 59, 999);
        else parsed.setHours(0, 0, 0, 0);
        return parsed.toISOString();
      }
      const [year, month, day] = trimmed.split("-").map((part) => Number(part));
      const parsed = new Date(Date.UTC(year, month - 1, day));
      if (Number.isNaN(parsed.getTime())) return null;
      if (endOfDay) parsed.setUTCHours(23, 59, 59, 999);
      else parsed.setUTCHours(0, 0, 0, 0);
      return parsed.toISOString();
    };

    if (fromDate) {
      const iso = normalizeDateInput(fromDate, false);
      if (iso) query = query.gte("start_timestamp", iso);
    }
    if (toDate) {
      const iso = normalizeDateInput(toDate, true);
      if (iso) query = query.lte("start_timestamp", iso);
    }

    if (search) {
      const sanitized = search.replace(/,/g, "\\,");
      query = query.or(
        `call_id.ilike.%${sanitized}%,from_number.ilike.%${sanitized}%,to_number.ilike.%${sanitized}%,call_summary.ilike.%${sanitized}%`,
      );
    }

    query = query.order("start_timestamp", { ascending: false }).range(fromRow, toRow);

    const { data, error, count } = await query;

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      ok: true,
      calls: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        hasMore: typeof count === "number" ? toRow + 1 < count : false,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export async function createOutboundCall(req, res) {
  try {
    const { to_number, from_number, override_agent_id } = req.body;
    if (!to_number) return res.status(400).json({ error: "to_number is required" });
    if (!from_number) return res.status(400).json({ error: "from_number is required" });

    const call = await retellClient.call.createPhoneCall({
      from_number,
      to_number,
      ...(override_agent_id ? { override_agent_id } : {}),
    });

    await supabase.from("call_logs").insert([
      {
        call_id: call.call_id,
        from_number: call.from_number,
        to_number: call.to_number,
        direction: call.direction,
        agent_id: call.agent_id,
        agent_version: call.agent_version,
        start_timestamp: call.start_timestamp ? new Date(call.start_timestamp) : null,
      },
    ]);

    return res.json({ ok: true, call });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

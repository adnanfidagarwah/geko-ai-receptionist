import { supabase } from "../config/supabase.js";
import { normalizeRequestBody } from "./requestHelpers.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUUID = (value) =>
  typeof value === "string" && UUID_REGEX.test(value.trim());

const normalizeDigits = (value = "") => value.replace(/\D+/g, "");

const collectUniqueStrings = (...values) => {
  const set = new Set();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed) set.add(trimmed);
  });
  return Array.from(set);
};

const buildPhoneCandidates = (phone) => {
  if (typeof phone !== "string") return [];
  const trimmed = phone.trim();
  const digits = normalizeDigits(trimmed);
  const candidates = new Set();
  if (trimmed) candidates.add(trimmed);
  if (digits) {
    candidates.add(digits);
    candidates.add(`+${digits}`);
  }
  return Array.from(candidates);
};

const maybeSingle = async (queryPromise) => {
  const { data, error } = await queryPromise;
  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }
  return data || null;
};

const lookupClinicByAgentId = async (agentId) => {
  if (!agentId) return null;
  const row = await maybeSingle(
    supabase.from("clinics").select("id").eq("agent_id", agentId).limit(1).maybeSingle(),
  );
  return row?.id || null;
};

const lookupClinicByPhone = async (phone) => {
  const candidates = buildPhoneCandidates(phone);
  for (const candidate of candidates) {
    const clinic = await maybeSingle(
      supabase.from("clinics").select("id").eq("phone", candidate).limit(1).maybeSingle(),
    );
    if (clinic?.id) return clinic.id;
  }
  for (const candidate of candidates) {
    const location = await maybeSingle(
      supabase
        .from("clinic_locations")
        .select("clinic_id")
        .eq("phone", candidate)
        .limit(1)
        .maybeSingle(),
    );
    if (location?.clinic_id) return location.clinic_id;
  }
  return null;
};

const lookupClinicByName = async (nameHint) => {
  if (typeof nameHint !== "string") return null;
  const normalized = nameHint.replace(/[_-]/g, " ").trim();
  if (!normalized) return null;

  const attempts = [normalized];
  if (!normalized.includes("%")) {
    attempts.push(`%${normalized}%`);
  }

  for (const attempt of attempts) {
    const clinic = await maybeSingle(
      supabase
        .from("clinics")
        .select("id")
        .ilike("name", attempt)
        .limit(1)
        .maybeSingle(),
    );
    if (clinic?.id) return clinic.id;
  }

  return null;
};

export const resolveClinicContext = async (req, providedClinicId) => {
  const hints = new Set();
  const addHint = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed) hints.add(trimmed);
  };

  addHint(providedClinicId);

  const body = normalizeRequestBody(req) || {};
  const call = body.call || {};
  const metadata = call.metadata || {};
  const parameters = body.parameters || body.args || {};
  const dynamicVars = body.dynamic_variables || body.dynamicVariables || {};

  collectUniqueStrings(
    parameters.clinic_id,
    parameters.clinicId,
    parameters.clinic_uuid,
    body.clinic_id,
    body.clinicId,
    call.clinic_id,
    call.clinicId,
    metadata.clinic_id,
    metadata.clinicId,
    metadata.clinic_uuid,
    metadata?.clinic?.id,
    dynamicVars.clinic_id,
    dynamicVars.clinicId,
    dynamicVars.clinic_uuid,
  ).forEach(addHint);

  for (const hint of hints) {
    if (isUUID(hint)) {
      return { clinicId: hint, source: "uuid", raw: hint };
    }
  }

  const agentHints = collectUniqueStrings(
    call.agent_id,
    call.agentId,
    metadata.agent_id,
    metadata.agentId,
    body.agent_id,
    body.agentId,
  );
  for (const agentId of agentHints) {
    const clinicId = await lookupClinicByAgentId(agentId);
    if (clinicId) {
      return { clinicId, source: "agent_id", raw: agentId };
    }
  }

  const phoneHints = collectUniqueStrings(
    metadata.clinic_phone,
    metadata.clinicPhone,
    metadata.to_number,
    metadata.toNumber,
    metadata.destination_number,
    call.to_number,
    call.toNumber,
  );
  for (const phone of phoneHints) {
    const clinicId = await lookupClinicByPhone(phone);
    if (clinicId) {
      return { clinicId, source: "phone", raw: phone };
    }
  }

  for (const hint of hints) {
    const clinicId = await lookupClinicByName(hint);
    if (clinicId) {
      return { clinicId, source: "name", raw: hint };
    }
  }

  return { clinicId: null, source: null, raw: null };
};

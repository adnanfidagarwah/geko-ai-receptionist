import { supabase } from "../config/supabase.js";
import { normalizeRequestBody } from "./requestHelpers.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUUID = (value) => typeof value === "string" && UUID_REGEX.test(value.trim());

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

const lookupRestaurantByAgentId = async (agentId) => {
  if (!agentId) return null;
  const row = await maybeSingle(
    supabase.from("restaurants").select("id").eq("agent_id", agentId).limit(1).maybeSingle(),
  );
  return row?.id || null;
};

const lookupRestaurantByPhone = async (phone) => {
  const candidates = buildPhoneCandidates(phone);
  for (const candidate of candidates) {
    const restaurant = await maybeSingle(
      supabase.from("restaurants").select("id").eq("phone", candidate).limit(1).maybeSingle(),
    );
    if (restaurant?.id) return restaurant.id;
  }
  return null;
};

const lookupRestaurantByName = async (nameHint) => {
  if (typeof nameHint !== "string") return null;
  const normalized = nameHint.replace(/[_-]/g, " ").trim();
  if (!normalized) return null;

  const attempts = [normalized];
  if (!normalized.includes("%")) {
    attempts.push(`%${normalized}%`);
  }

  for (const attempt of attempts) {
    const restaurant = await maybeSingle(
      supabase.from("restaurants").select("id").ilike("name", attempt).limit(1).maybeSingle(),
    );
    if (restaurant?.id) return restaurant.id;
  }

  return null;
};

export const resolveRestaurantContext = async (req, providedRestaurantId) => {
  const hints = new Set();
  const addHint = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed) hints.add(trimmed);
  };

  addHint(providedRestaurantId);

  const body = normalizeRequestBody(req) || {};
  const call = body.call || {};
  const metadata = call.metadata || {};
  const parameters = body.parameters || body.args || {};
  const dynamicVars = body.dynamic_variables || body.dynamicVariables || {};

  collectUniqueStrings(
    parameters.restaurant_id,
    parameters.restaurantId,
    body.restaurant_id,
    body.restaurantId,
    call.restaurant_id,
    call.restaurantId,
    metadata.restaurant_id,
    metadata.restaurantId,
    metadata?.restaurant?.id,
    dynamicVars.restaurant_id,
    dynamicVars.restaurantId,
  ).forEach(addHint);

  for (const hint of hints) {
    if (isUUID(hint)) {
      return { restaurantId: hint, source: "uuid", raw: hint };
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
    const restaurantId = await lookupRestaurantByAgentId(agentId);
    if (restaurantId) {
      return { restaurantId, source: "agent_id", raw: agentId };
    }
  }

  const phoneHints = collectUniqueStrings(
    metadata.restaurant_phone,
    metadata.restaurantPhone,
    metadata.to_number,
    metadata.destination_number,
    call.to_number,
    call.toNumber,
  );
  for (const phone of phoneHints) {
    const restaurantId = await lookupRestaurantByPhone(phone);
    if (restaurantId) {
      return { restaurantId, source: "phone", raw: phone };
    }
  }

  for (const hint of hints) {
    const restaurantId = await lookupRestaurantByName(hint);
    if (restaurantId) {
      return { restaurantId, source: "name", raw: hint };
    }
  }

  return { restaurantId: null, source: null, raw: null };
};

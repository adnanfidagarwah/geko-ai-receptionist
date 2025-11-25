import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { supabase } from "../config/supabase.js";
import { retellClient } from "../config/retell.js";
import { buildRetellTools } from "../utils/retell/toolsConfig.js";
import { composeRestaurantPrompt } from "../utils/restaurantPromptComposer.js";

/**
 * Helper: compute active org (default if exists; else first)
 */
async function getActiveOrgForUser(userId) {
  const { data: membs, error } = await supabase
    .from("memberships")
    .select("org_model, org_id, role, is_default")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  if (!membs || membs.length === 0) return null;

  const def = membs.find(m => m.is_default);
  const chosen = def || membs[0];

  return {
    orgModel: chosen.org_model,
    orgId: chosen.org_id,
    role: chosen.role
  };
}

/**
 * Helper: build JWT payload that includes clinic_id / restaurant_id
 */
async function buildTokenPayload(user) {
  const active = await getActiveOrgForUser(user.id);
  let clinic_id = null, restaurant_id = null, orgModel = null, orgId = null, role = null;

  if (active) {
    orgModel = active.orgModel;
    orgId = active.orgId;
    role = active.role;
    if (orgModel === "Clinic") clinic_id = orgId;
    if (orgModel === "Restaurant") restaurant_id = orgId;
  }

  return {
    sub: user.id,
    email: user.email,
    globalRoles: user.global_roles || [],
    orgModel,
    orgId,
    role,
    clinic_id,
    restaurant_id
  };
}

const PUBLIC_BASE_RAW =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  process.env.APP_URL ||
  process.env.PUBLIC_URL ||
  "";
const PUBLIC_BASE = PUBLIC_BASE_RAW.replace(/\/$/, "");
const CALL_WEBHOOK_URL = PUBLIC_BASE ? `${PUBLIC_BASE}/retell/webhooks/call-events` : null;

const fetchFirstVoiceId = async () => {
  const response = await fetch("https://api.retellai.com/list-voices", {
    headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch default voice: ${response.statusText}`);
  }
  const voices = await response.json();
  if (!Array.isArray(voices) || !voices.length) {
    throw new Error("No voices returned from Retell");
  }
  return voices[0].voice_id;
};

async function provisionRestaurantAgent({ restaurant }) {
  if (!restaurant?.id) return null;

  const { data: menuItems = [], error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,description,price,category,created_at")
    .eq("restaurant_id", restaurant.id)
    .limit(25);
  if (menuError) throw new Error(menuError.message);

  const prompt = composeRestaurantPrompt({ restaurant, menu: menuItems, settings: {} });
  const general_tools = buildRetellTools({
    baseUrl: PUBLIC_BASE || process.env.API_BASE_URL || "http://localhost:3300",
    secret: process.env.RETELL_TOOL_SECRET,
    orgType: "Restaurant",
  });
  const tool_call_strict_mode = true;
  const defaultModel = process.env.RETELL_LLM_MODEL || "gpt-4.1-mini";
  const defaultRealtime = process.env.RETELL_S25_MODEL || "gpt-4o-realtime-preview";
  const defaultVoice =
    process.env.RETELL_DEFAULT_VOICE_ID ||
    process.env.RETELL_VOICE_ID ||
    (await fetchFirstVoiceId());
  const default_dynamic_variables = {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_phone: restaurant.phone,
  };

  const llmResp = await retellClient.llm.create({
    general_prompt: prompt,
    model: defaultModel,
    s25_model: defaultRealtime,
    model_temperature: 0.1,
    general_tools,
    tool_call_strict_mode,
    default_dynamic_variables,
  });

  const agentPayload = {
    agent_name: `${restaurant.name || "Restaurant"} Host`,
    response_engine: { type: "retell-llm", llm_id: llmResp.llm_id },
    voice_id: defaultVoice,
    voice_temperature: 1,
    voice_speed: 1,
    volume: 1,
    language: "en-US",
    data_storage_setting: "everything",
    start_speaker: "agent",
    interruption_sensitivity: 0.9,
    max_call_duration_ms: 3600000,
  };
  if (CALL_WEBHOOK_URL) {
    agentPayload.webhook_url = CALL_WEBHOOK_URL;
  }

  const agentResp = await retellClient.agent.create(agentPayload);

  const { error: updateError } = await supabase
    .from("restaurants")
    .update({ agent_id: agentResp.agent_id, llm_id: llmResp.llm_id })
    .eq("id", restaurant.id);
  if (updateError) throw new Error(updateError.message);

  return { agentId: agentResp.agent_id, llmId: llmResp.llm_id };
}

/* =============== REGISTER (no org) =============== */
export async function register(req, res) {
  try {
    const { email, password, name, phone, address, globalRoles = [] } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert([{ email: email.toLowerCase().trim(), password_hash, name, phone, address, global_roles: globalRoles }])
      .select().single();
    if (error) return res.status(400).json({ error: error.message });

    // No memberships yet → token won’t have org ids
    const payload = await buildTokenPayload(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET || "change_me", { expiresIn: "7d" });

    res.json({ ok: true, token, user });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

/* =============== REGISTER + ORG =============== */
export async function registerWithOrg(req, res) {
  try {
    const { email, password, name, phone, address, orgType, org = {}, menuItems = [], services = [], globalRoles = [] } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });
    if (!orgType || !["Restaurant","Clinic"].includes(orgType)) return res.status(400).json({ error: "Invalid orgType" });
    if (!org?.name) return res.status(400).json({ error: "org.name is required" });

    const password_hash = await bcrypt.hash(password, 10);

    // 1) user
    const { data: user, error: uErr } = await supabase
      .from("users").insert([{ email: email.toLowerCase().trim(), password_hash, name, phone, address, global_roles: globalRoles }])
      .select().single();
    if (uErr) return res.status(400).json({ error: uErr.message });

    // 2) org
    let orgRow;
    if (orgType === "Restaurant") {
      const { data, error } = await supabase.from("restaurants")
        .insert([{ owner: user.id, name: org.name, address: org.address, phone: org.phone }]).select().single();
      if (error) return res.status(400).json({ error: error.message });
      orgRow = data;

      if (menuItems?.length) {
        const rows = menuItems.map(mi => ({
          restaurant_id: orgRow.id,
          name: mi.name,
          description: mi.description || "",
          price: Number(mi.price||0),
          category: mi.category || "General"
        }));
        const { error: miErr } = await supabase.from("menu_items").insert(rows);
        if (miErr) return res.status(400).json({ error: miErr.message });
      }
    } else {
      const { data, error } = await supabase.from("clinics")
        .insert([{ owner: user.id, name: org.name, address: org.address, phone: org.phone }]).select().single();
      if (error) return res.status(400).json({ error: error.message });
      orgRow = data;

      if (services?.length) {
        const rows = services.map(s => ({
          clinic_id: orgRow.id,
          name: s.name,
          duration_minutes: Number(s.durationMinutes||30),
          price: Number(s.price||0)
        }));
        const { error: sErr } = await supabase.from("clinic_services").insert(rows);
        if (sErr) return res.status(400).json({ error: sErr.message });
      }
    }

    // 3) default membership
    const { error: mErr } = await supabase.from("memberships").insert([{
      user_id: user.id, org_model: orgType, org_id: orgRow.id, role: "owner", is_default: true
    }]);
    if (mErr) return res.status(400).json({ error: mErr.message });

    if (orgType === "Restaurant") {
      try {
        await provisionRestaurantAgent({ restaurant: orgRow });
      } catch (err) {
        console.error("Failed to provision restaurant agent:", err?.message || err);
      }
    }

    // 4) token with clinic_id/restaurant_id
    const payload = await buildTokenPayload(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET || "change_me", { expiresIn: "7d" });

    res.json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, globalRoles: user.global_roles || [] },
      org: { type: orgType, id: orgRow.id, name: orgRow.name }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

/* =============== LOGIN =============== */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,password_hash,global_roles")
      .eq("email", (email||'').toLowerCase().trim())
      .single();
    if (error || !user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const payload = await buildTokenPayload(user);
    const token = jwt.sign(payload, process.env.JWT_SECRET || "change_me", { expiresIn: "7d" });

    res.json({ token, payload }); // returning payload helps the frontend know active org immediately
  } catch (e) { res.status(500).json({ error: e.message }); }
}

/* =============== PROFILE =============== */
/**
 * GET /api/auth/me
 * Returns user profile, memberships, and active org (expanded).
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [{ data: user, error: uErr }, { data: membs, error: mErr }] = await Promise.all([
      supabase.from("users").select("id,email,name,phone,address,global_roles,status,created_at,updated_at").eq("id", userId).single(),
      supabase.from("memberships").select("org_model,org_id,role,is_default").eq("user_id", userId)
    ]);
    if (uErr) return res.status(500).json({ error: uErr.message });
    if (mErr) return res.status(500).json({ error: mErr.message });

    // Determine active org
    const def = (membs || []).find(m => m.is_default) || (membs || [])[0] || null;
    let activeOrg = null;
    if (def) {
      if (def.org_model === "Clinic") {
        const { data: clinic } = await supabase.from("clinics").select("id,name,address,phone,agent_id,llm_id").eq("id", def.org_id).single();
        activeOrg = { type: "Clinic", ...clinic };
      } else {
        const { data: rest } = await supabase.from("restaurants").select("id,name,address,phone").eq("id", def.org_id).single();
        activeOrg = { type: "Restaurant", ...rest };
      }
    }

    res.json({
      user,
      memberships: membs || [],
      activeOrg,
      tokenHints: {
        // mirrors what login/register put into the token
        orgModel: def?.org_model || null,
        orgId: def?.org_id || null,
        clinic_id: def?.org_model === "Clinic" ? def?.org_id : null,
        restaurant_id: def?.org_model === "Restaurant" ? def?.org_id : null
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/* =============== LOGOUT =============== */
export async function logout(_req, res) {
  // JWT-based auth: clearing token client-side is sufficient; respond OK for symmetry
  res.json({ ok: true });
}

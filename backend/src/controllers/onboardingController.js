import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { retellClient } from "../config/retell.js";
import { composePromptFromOnboarding } from "../utils/promptComposer.js";
import { buildRetellTools } from "../utils/retell/toolsConfig.js";

const TABLE = "clinic_onboarding";
const DEFAULT_COMPLETED = [];

const publicBase =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  process.env.APP_URL ||
  "http://localhost:3300";
const baseUrl = publicBase.replace(/\/$/, "");
const callWebhookUrl = `${baseUrl}/retell/webhooks/call-events`;

const toNullable = (value) => (value === undefined ? null : value);
const toBoolean = (value) =>
  value === undefined || value === null ? null : Boolean(value);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ensureUUID = (value) => {
  if (typeof value === "string" && UUID_REGEX.test(value.trim())) {
    return value.trim();
  }
  return randomUUID();
};

async function syncLocations(clinicId, locations = []) {
  await supabase.from("clinic_locations").delete().eq("clinic_id", clinicId);
  if (!locations.length) return;

  const rows = locations.map((location) => ({
    id: ensureUUID(location.id),
    clinic_id: clinicId,
    label: toNullable(location.label),
    timezone: toNullable(location.timezone),
    phone: toNullable(location.phone),
    website: toNullable(location.website),
    directions_url: toNullable(location.directionsUrl ?? location.directions_url),
    default_slot_length: location.defaultSlotLength
      ? Number(location.defaultSlotLength)
      : toNullable(location.default_slot_length),
    allow_same_day: toBoolean(location.allowSameDay ?? location.allow_same_day),
    reschedule_policy: toNullable(location.reschedulePolicy ?? location.reschedule_policy),
    late_fee_policy: toNullable(location.lateFeePolicy ?? location.late_fee_policy),
    bookable_window: toNullable(location.bookableWindow ?? location.bookable_window),
    holidays_notes: toNullable(location.holidaysNotes ?? location.holidays_notes),
    hours: location.hours ?? null,
  }));

  const { error } = await supabase.from("clinic_locations").insert(rows);
  if (error) {
    throw new Error(`Failed to sync clinic locations: ${error.message}`);
  }
}

async function syncProviders(clinicId, providers = []) {
  await supabase.from("clinic_providers").delete().eq("clinic_id", clinicId);
  if (!providers.length) return;

  const rows = providers.map((provider) => ({
    id: ensureUUID(provider.id),
    clinic_id: clinicId,
    name: toNullable(provider.name),
    title: toNullable(provider.title),
    specialties: toNullable(provider.specialties),
    services: toNullable(provider.services),
    schedule_notes: toNullable(provider.scheduleNotes ?? provider.schedule_notes),
  }));

  const { error } = await supabase.from("clinic_providers").insert(rows);
  if (error) {
    throw new Error(`Failed to sync clinic providers: ${error.message}`);
  }
}

async function syncServices(clinicId, services = []) {
  await supabase.from("clinic_services").delete().eq("clinic_id", clinicId);
  if (!services.length) return;

  const rows = services.map((service) => ({
    id: ensureUUID(service.id),
    clinic_id: clinicId,
    name: toNullable(service.name),
    description: toNullable(service.description),
    duration_minutes: service.duration_minutes
      ? Number(service.duration_minutes)
      : service.duration
        ? Number(service.duration)
        : null,
    price: service.price !== undefined && service.price !== ""
      ? Number(service.price)
      : null,
    requires_evaluation: toBoolean(service.requiresEvaluation ?? service.requires_evaluation),
    requires_deposit: toBoolean(service.requiresDeposit ?? service.requires_deposit),
    is_maintenance: toBoolean(service.isMaintenance ?? service.is_maintenance),
  }));

  const { error } = await supabase.from("clinic_services").insert(rows);
  if (error) {
    throw new Error(`Failed to sync clinic services: ${error.message}`);
  }
}

async function syncAddOns(clinicId, addOns = []) {
  await supabase.from("clinic_add_ons").delete().eq("clinic_id", clinicId);
  if (!addOns.length) return;

  const rows = addOns.map((addOn) => ({
    id: ensureUUID(addOn.id),
    clinic_id: clinicId,
    name: toNullable(addOn.name),
    description: toNullable(addOn.description),
    price: addOn.price !== undefined && addOn.price !== ""
      ? Number(addOn.price)
      : null,
  }));

  const { error } = await supabase.from("clinic_add_ons").insert(rows);
  if (error) {
    throw new Error(`Failed to sync clinic add-ons: ${error.message}`);
  }
}

async function syncInsurance(clinicId, insurance = {}) {
  const plans = Array.isArray(insurance.plans) ? insurance.plans : [];

  await Promise.all([
    supabase.from("clinic_insurance_plans").delete().eq("clinic_id", clinicId),
    supabase.from("clinic_plan_coverages").delete().eq("clinic_id", clinicId),
  ]);

  if (!plans.length) return;

  const financingDetails = toNullable(
    typeof insurance.notes?.financingDetails === "string"
      ? insurance.notes.financingDetails
      : typeof insurance.notes === "string"
        ? insurance.notes
        : null,
  );
  const paymentMethods = Array.isArray(insurance.notes?.paymentMethods)
    ? insurance.notes.paymentMethods.map((method) => `${method}`)
    : [];

  const planIdMap = new Map();
  const planRows = plans.map((plan) => {
    const sanitizedId = ensureUUID(plan.id);
    planIdMap.set(plan.id, sanitizedId);
    return {
      id: sanitizedId,
      clinic_id: clinicId,
      name: toNullable(plan.name),
      notes: toNullable(plan.notes ?? financingDetails),
      payment_methods: paymentMethods.length ? paymentMethods : null,
    };
  });

  const { error: planErr } = await supabase
    .from("clinic_insurance_plans")
    .insert(planRows);

  if (planErr) {
    throw new Error(`Failed to sync insurance plans: ${planErr.message}`);
  }
  const coverageRows = [];
  plans.forEach((plan) => {
    const planId = planIdMap.get(plan.id) ?? ensureUUID(plan.id);
    (plan.coverages || []).forEach((coverage) => {
      coverageRows.push({
        id: ensureUUID(coverage.id),
        clinic_id: clinicId,
        plan_id: planId,
        service: toNullable(coverage.service),
        coverage_detail: toNullable(coverage.coverageDetail ?? coverage.coverage_detail),
      });
    });
  });

  if (coverageRows.length) {
    const { error } = await supabase.from("clinic_plan_coverages").insert(coverageRows);
    if (error) {
      throw new Error(`Failed to sync insurance plan coverages: ${error.message}`);
    }
  }
}

async function syncPolicies(clinicId, policies = {}) {
  const payload = {
    clinic_id: clinicId,
    emergency_script: toNullable(policies.emergency_script ?? policies.emergencyScript),
    consent_text: toNullable(policies.consent_text ?? policies.consentText),
    privacy_policy_url: toNullable(policies.privacy_policy_url ?? policies.privacyPolicyUrl),
    privacy_mode: Boolean(policies.privacy_mode ?? policies.privacyMode ?? true),
    notify_sms: Boolean(policies.notify_sms ?? policies.notifySms ?? true),
    notify_whatsapp: Boolean(policies.notify_whatsapp ?? policies.notifyWhatsapp ?? false),
    notify_email: Boolean(policies.notify_email ?? policies.notifyEmail ?? true),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("clinic_policies")
    .upsert(payload, { onConflict: "clinic_id" });
  if (error) {
    throw new Error(`Failed to sync clinic policies: ${error.message}`);
  }
}

async function syncMessaging(clinicId, messaging = {}) {
  const payload = {
    clinic_id: clinicId,
    greeting_line: toNullable(messaging.greeting_line ?? messaging.greetingLine),
    closing_line: toNullable(messaging.closing_line ?? messaging.closingLine),
    tone_variants: Array.isArray(messaging.tone_variants ?? messaging.toneVariants)
      ? messaging.tone_variants ?? messaging.toneVariants
      : [],
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("clinic_messaging")
    .upsert(payload, { onConflict: "clinic_id" });
  if (error) {
    throw new Error(`Failed to sync messaging preferences: ${error.message}`);
  }
}

const defaultOnboardingState = (clinicId) => ({
  clinic_id: clinicId,
  locations: [],
  providers: [],
  services: [],
  add_ons: [],
  insurance: { plans: [], notes: { paymentMethods: [], financingDetails: "" } },
  policies: {
    emergency_script: "",
    notify_sms: true,
    notify_whatsapp: false,
    notify_email: true,
    privacy_policy_url: "",
    consent_text: "",
  },
  messaging: {
    greeting_line: "",
    closing_line: "",
    tone_variants: ["Formal", "Casual"],
  },
  selected_voice_id: null,
  completed_sections: DEFAULT_COMPLETED,
});

const sanitize = (row = {}) => {
  const insuranceRaw = row.insurance ?? {};
  const insuranceNotesRaw = insuranceRaw.notes;
  const insuranceNotes =
    typeof insuranceNotesRaw === "object" && insuranceNotesRaw !== null
      ? {
          paymentMethods: Array.isArray(insuranceNotesRaw.paymentMethods)
            ? insuranceNotesRaw.paymentMethods
            : [],
          financingDetails:
            typeof insuranceNotesRaw.financingDetails === "string"
              ? insuranceNotesRaw.financingDetails
              : "",
        }
      : {
          paymentMethods: [],
          financingDetails:
            typeof insuranceNotesRaw === "string" ? insuranceNotesRaw : "",
        };

  const insurance = {
    plans: Array.isArray(insuranceRaw.plans) ? insuranceRaw.plans : [],
    notes: insuranceNotes,
  };

  return {
    clinic_id: row.clinic_id,
    locations: row.locations ?? [],
    providers: row.providers ?? [],
    services: row.services ?? [],
    addOns: row.add_ons ?? [],
    insurance,
    policies: row.policies ?? {},
    messaging: row.messaging ?? {},
    selected_voice_id: row.selected_voice_id ?? null,
    completed_sections: row.completed_sections ?? [],
    updated_at: row.updated_at ?? null,
  };
};

async function ensureOnboarding(clinicId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("clinic_id", clinicId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch onboarding data: ${error.message}`);
  }

  if (data && data.length) {
    return data[0];
  }

  const seed = {
    ...defaultOnboardingState(clinicId),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await supabase
    .from(TABLE)
    .insert([seed])
    .select()
    .single();

  if (insertErr) {
    throw new Error(`Failed to initialize onboarding: ${insertErr.message}`);
  }

  return inserted;
}

async function updateSection(clinicId, patch) {
  const changes = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq("clinic_id", clinicId);

  if (error) {
    throw new Error(`Failed to update onboarding section: ${error.message}`);
  }

  const updated = await ensureOnboarding(clinicId);
  return sanitize(updated);
}

export async function getOnboarding(req, res) {
  try {
    const clinicId = req.params.id;
    if (!clinicId) {
      return res.status(400).json({ error: "clinic id is required" });
    }
    const row = await ensureOnboarding(clinicId);
    return res.json({ ok: true, onboarding: sanitize(row) });
  } catch (error) {
    console.error("getOnboarding error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function upsertLocations(req, res) {
  try {
    const clinicId = req.params.id;
    const { locations } = req.body || {};
    if (!Array.isArray(locations)) {
      return res.status(400).json({ error: "locations must be an array" });
    }
    const onboarding = await updateSection(clinicId, { locations });
    await syncLocations(clinicId, locations);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("upsertLocations error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function upsertProviders(req, res) {
  try {
    const clinicId = req.params.id;
    const { providers } = req.body || {};
    if (!Array.isArray(providers)) {
      return res.status(400).json({ error: "providers must be an array" });
    }
    const onboarding = await updateSection(clinicId, { providers });
    await syncProviders(clinicId, providers);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("upsertProviders error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function upsertServices(req, res) {
  try {
    const clinicId = req.params.id;
    const { services } = req.body || {};
    if (!Array.isArray(services)) {
      return res.status(400).json({ error: "services must be an array" });
    }
    const onboarding = await updateSection(clinicId, { services });
    await syncServices(clinicId, services);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("upsertServices error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function upsertAddOns(req, res) {
  try {
    const clinicId = req.params.id;
    const { addOns } = req.body || {};
    if (!Array.isArray(addOns)) {
      return res.status(400).json({ error: "addOns must be an array" });
    }
    const onboarding = await updateSection(clinicId, { add_ons: addOns });
    await syncAddOns(clinicId, addOns);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("upsertAddOns error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function upsertInsurance(req, res) {
  try {
    const clinicId = req.params.id;
    const { insurance } = req.body || {};
    if (!insurance || typeof insurance !== "object") {
      return res.status(400).json({ error: "insurance must be an object" });
    }
    const plans = Array.isArray(insurance.plans) ? insurance.plans : [];
    const rawNotes = insurance.notes;
    const notes = typeof rawNotes === "object" && rawNotes !== null
      ? {
          paymentMethods: Array.isArray(rawNotes.paymentMethods)
            ? rawNotes.paymentMethods
            : [],
          financingDetails:
            typeof rawNotes.financingDetails === "string"
              ? rawNotes.financingDetails
              : "",
        }
      : {
          paymentMethods: [],
          financingDetails: typeof rawNotes === "string" ? rawNotes : "",
        };

    const normalized = {
      plans,
      notes,
    };
    const onboarding = await updateSection(clinicId, { insurance: normalized });
    await syncInsurance(clinicId, normalized);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("upsertInsurance error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function savePolicies(req, res) {
  try {
    const clinicId = req.params.id;
    const body = req.body || {};
    const policiesInput = body.policies || body;
    if (!policiesInput || typeof policiesInput !== "object") {
      return res.status(400).json({ error: "policies must be an object" });
    }

    const notificationPrefs = policiesInput.notification_prefs || policiesInput.notificationPrefs;
    const base = {
      ...policiesInput,
    };

    if (notificationPrefs) {
      base.notify_sms = Boolean(notificationPrefs.sms);
      base.notify_whatsapp = Boolean(notificationPrefs.whatsapp);
      base.notify_email = Boolean(notificationPrefs.email);
      delete base.notification_prefs;
      delete base.notificationPrefs;
    }

    const onboarding = await updateSection(clinicId, { policies: base });
    await syncPolicies(clinicId, base);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("savePolicies error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function saveMessaging(req, res) {
  try {
    const clinicId = req.params.id;
    const body = req.body || {};
    const messaging = body.messaging || body;
    if (!messaging || typeof messaging !== "object") {
      return res.status(400).json({ error: "messaging must be an object" });
    }

    const normalized = {
      greeting_line: messaging.greeting_line ?? "",
      closing_line: messaging.closing_line ?? "",
      tone_variants: Array.isArray(messaging.tone_variants || messaging.toneVariants)
        ? (messaging.tone_variants || messaging.toneVariants)
        : [],
    };

    const onboarding = await updateSection(clinicId, { messaging: normalized });
    await syncMessaging(clinicId, normalized);
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("saveMessaging error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function setSelectedVoice(req, res) {
  try {
    const clinicId = req.params.id;
    const { voice_id } = req.body || {};
    if (!voice_id || typeof voice_id !== "string") {
      return res.status(400).json({ error: "voice_id is required" });
    }
    const onboarding = await updateSection(clinicId, { selected_voice_id: voice_id });
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("setSelectedVoice error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function markSectionComplete(req, res) {
  try {
    const clinicId = req.params.id;
    const { section, sectionId, completed, isComplete } = req.body || {};
    const target = section || sectionId;
    if (!target || typeof target !== "string") {
      return res.status(400).json({ error: "section is required" });
    }
    const shouldComplete = completed ?? isComplete ?? true;

    const current = await ensureOnboarding(clinicId);
    const nextSet = new Set(current.completed_sections || []);
    if (shouldComplete) {
      nextSet.add(target);
    } else {
      nextSet.delete(target);
    }

    const onboarding = await updateSection(clinicId, { completed_sections: Array.from(nextSet) });
    return res.json({ ok: true, onboarding });
  } catch (error) {
    console.error("markSectionComplete error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function finishOnboarding(req, res) {
  try {
    const clinicId = req.params.id;
    if (!clinicId) {
      return res.status(400).json({ error: "clinic id is required" });
    }

    const onboardingRow = await ensureOnboarding(clinicId);
    const onboarding = sanitize(onboardingRow);

    if (!onboarding.selected_voice_id) {
      return res.status(400).json({ error: "Select a voice before finishing onboarding." });
    }

    const { data: clinic, error: clinicErr } = await supabase
      .from("clinics")
      .select("id, name, address, phone, agent_id, llm_id")
      .eq("id", clinicId)
      .single();

    if (clinicErr) {
      return res.status(404).json({ error: "Clinic not found." });
    }

    const prompt = composePromptFromOnboarding({
      clinic,
      onboarding,
    });
    const general_tools = buildRetellTools({
      baseUrl,
      secret: process.env.RETELL_TOOL_SECRET,
    });
    const tool_call_strict_mode = true;

    const defaultModel = process.env.RETELL_LLM_MODEL || "gpt-4.1-mini";
    const defaultRealtime = process.env.RETELL_S25_MODEL || "gpt-4o-realtime-preview";

    let llmId = clinic.llm_id || null;
    const defaultDynamicVariables = {
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      clinic_phone: clinic.phone,
    };

    const createLlm = async () => {
      const llmResp = await retellClient.llm.create({
        general_prompt: prompt,
        model: defaultModel,
        s25_model: defaultRealtime,
        model_temperature: 0.1,
        kb_config: { top_k: 5, filter_score: 0.5 },
        general_tools,
        tool_call_strict_mode,
        default_dynamic_variables: defaultDynamicVariables,
      });

      return llmResp.llm_id;
    };

    if (llmId) {
      try {
        await retellClient.llm.update(llmId, {
          general_prompt: prompt,
          general_tools,
          tool_call_strict_mode,
          default_dynamic_variables: defaultDynamicVariables,
        });
      } catch (err) {
        const status = err?.response?.status || err?.statusCode || err?.status;
        const message = err?.message || "";
        const notFound = status === 404 || message.includes("404");
        if (!notFound) {
          throw err;
        }
        llmId = await createLlm();
      }
    } else {
      llmId = await createLlm();
    }

    const voiceId = onboarding.selected_voice_id;
    const agentName = `${clinic.name ?? "Clinic"} Receptionist`;
    let agentId = clinic.agent_id || null;
    const createAgent = async () => {
      const agentResp = await retellClient.agent.create({
        agent_name: agentName,
        response_engine: { type: "retell-llm", llm_id: llmId },
        voice_id: voiceId,
        voice_temperature: 1,
        voice_speed: 1,
        volume: 1,
        language: "en-US",
        data_storage_setting: "everything",
        start_speaker: "agent",
        interruption_sensitivity: 0.9,
        max_call_duration_ms: 3600000,
        webhook_url: callWebhookUrl,
      });
      return agentResp.agent_id;
    };

    if (agentId) {
      try {
        await retellClient.agent.update(agentId, {
          response_engine: { type: "retell-llm", llm_id: llmId },
          voice_id: voiceId,
          agent_name: agentName,
          webhook_url: callWebhookUrl,
        });
      } catch (err) {
        const status = err?.response?.status || err?.statusCode || err?.status;
        const message = err?.message || "";
        const notFound = status === 404 || message.includes("404");
        if (!notFound) {
          throw err;
        }
        agentId = await createAgent();
      }
    } else {
      agentId = await createAgent();
    }

    const finishedSections = new Set(onboarding.completed_sections || []);
    finishedSections.add("voices");
    finishedSections.add("finish");

    const timestamp = new Date().toISOString();

    await Promise.all([
      supabase
        .from("clinics")
        .update({ agent_id: agentId, llm_id: llmId, onboarding_finished_at: timestamp })
        .eq("id", clinicId),
      supabase
        .from(TABLE)
        .update({
          completed_sections: Array.from(finishedSections),
          updated_at: timestamp,
        })
        .eq("clinic_id", clinicId),
    ]);

    return res.json({
      ok: true,
      agent_id: agentId,
      llm_id: llmId,
      prompt,
    });
  } catch (error) {
    console.error("finishOnboarding error:", error);
    return res.status(500).json({ error: error.message });
  }
}

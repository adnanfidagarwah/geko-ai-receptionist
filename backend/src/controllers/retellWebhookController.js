import fetch from "node-fetch";
import { supabase } from "../config/supabase.js";
import { retellClient } from "../config/retell.js";
import { resolveClinicContext } from "../utils/clinicResolver.js";
import { resolveRestaurantContext } from "../utils/restaurantResolver.js";

const PUBLIC_BASE_RAW =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  process.env.APP_URL ||
  process.env.PUBLIC_URL ||
  "";
const PUBLIC_BASE = PUBLIC_BASE_RAW.replace(/\/$/, "");
const CALL_WEBHOOK_URL = PUBLIC_BASE ? `${PUBLIC_BASE}/retell/webhooks/call-events` : null;

const withWebhook = (payload = {}) =>
  CALL_WEBHOOK_URL ? { webhook_url: CALL_WEBHOOK_URL, ...payload } : payload;

const buildAgentPayload = (agent = {}, llmId, fallbackName = "Agent") => ({
  agent_name: agent.agent_name || fallbackName,
  response_engine: { type: "retell-llm", llm_id: llmId },
  voice_id: agent.voice_id,
  voice_temperature: agent.voice_temperature ?? 1,
  voice_speed: agent.voice_speed ?? 1,
  volume: agent.volume ?? 1,
  language: agent.language || "en-US",
  data_storage_setting: "everything",
  start_speaker: "agent",
  interruption_sensitivity: agent.interruption_sensitivity ?? 0.9,
  max_call_duration_ms: agent.max_call_duration_ms ?? 3600000,
});

const createRetellAgent = async ({ agent, llmId, fallbackName }) =>
  retellClient.agent.create(withWebhook(buildAgentPayload(agent, llmId, fallbackName)));

/** ------------------------------------------------------------------
 * Agent + LLM management
 * ------------------------------------------------------------------ */
export async function createAgentForClinic(req, res) {
  try {
    const { clinic_id, agent = {}, llm = {}, reuse_llm_id } = req.body || {};
    if (!clinic_id) return res.status(400).json({ error: "clinic_id is required" });
    if (!agent.voice_id) return res.status(400).json({ error: "agent.voice_id is required" });

    let llmId = reuse_llm_id || llm.llm_id || null;
    if (!llmId) {
      const llmResp = await retellClient.llm.create({
        model: llm?.model || undefined,
        general_prompt: llm?.general_prompt || undefined,
        begin_message: llm?.begin_message ?? undefined,
        default_dynamic_variables: llm?.default_dynamic_variables || undefined,
      });
      llmId = llmResp.llm_id;
    }

    const agentResp = await createRetellAgent({
      agent,
      llmId,
      fallbackName: agent.agent_name || "Clinic Agent",
    });

    const { error } = await supabase
      .from("clinics")
      .update({ agent_id: agentResp.agent_id, llm_id: llmId })
      .eq("id", clinic_id);
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ ok: true, clinic_id, agent_id: agentResp.agent_id, llm_id: llmId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateAgentPrompt(req, res) {
  try {
    const { agent_id } = req.params;
    let { llm_id, clinic_id, general_prompt, begin_message, model, default_dynamic_variables } =
      req.body || {};

    if (!agent_id) return res.status(400).json({ error: "agent_id is required" });

    if (!llm_id && clinic_id) {
      const { data: clinic, error } = await supabase
        .from("clinics")
        .select("llm_id")
        .eq("id", clinic_id)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      llm_id = clinic?.llm_id;
    }

    if (!llm_id) {
      return res
        .status(400)
        .json({ error: "llm_id is required (pass it or provide clinic_id so we can look it up)" });
    }

    await retellClient.llm.update(llm_id, {
      model,
      general_prompt,
      begin_message,
      default_dynamic_variables,
    });

    return res.json({ ok: true, agent_id, llm_id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateAgentProperties(req, res) {
  try {
    const { agent_id } = req.params;
    const { agent_name, voice_id } = req.body || {};
    if (!agent_id) return res.status(400).json({ error: "agent_id is required" });

    const updatePayload = withWebhook({});
    if (agent_name !== undefined) updatePayload.agent_name = agent_name;
    if (voice_id !== undefined) updatePayload.voice_id = voice_id;

    const resp = await retellClient.agent.update(agent_id, updatePayload);
    return res.json({ ok: true, agent_id: resp.agent_id, updated: updatePayload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** ------------------------------------------------------------------
 * Call webhook handler
 * ------------------------------------------------------------------ */
export async function handleCallEvent(req, res) {
  try {
    const payload = req.body || {};
    const callPayload =
      payload.call ||
      payload.data?.call ||
      payload.data ||
      payload.detail?.call ||
      payload.detail ||
      {};
    const analysisPayload = payload.call_analysis || payload.analysis || {};
    const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

    const callId = firstDefined(
      payload.call_id,
      callPayload.call_id,
      callPayload.id,
      payload.id,
    );
    if (!callId) {
      console.warn("Retell webhook missing call_id", {
        topLevelKeys: Object.keys(payload),
        callKeys: Object.keys(callPayload),
      });
      return res.status(400).json({ error: "call_id is required" });
    }

    const { clinicId } = await resolveClinicContext(req, payload?.clinic_id);
    const { restaurantId } = await resolveRestaurantContext(req, payload?.restaurant_id);

    const row = {
      call_id: callId,
      from_number: firstDefined(payload.from_number, callPayload.from_number),
      to_number: firstDefined(payload.to_number, callPayload.to_number),
      direction: firstDefined(payload.direction, callPayload.direction),
      agent_id: firstDefined(payload.agent_id, callPayload.agent_id),
      agent_version: firstDefined(payload.agent_version, callPayload.agent_version),
      start_timestamp: firstDefined(
        payload.start_timestamp,
        callPayload.start_timestamp,
        callPayload.startTime,
        callPayload.started_at,
      )
        ? new Date(
            firstDefined(
              payload.start_timestamp,
              callPayload.start_timestamp,
              callPayload.startTime,
              callPayload.started_at,
            ),
          )
        : null,
      end_timestamp: firstDefined(
        payload.end_timestamp,
        callPayload.end_timestamp,
        callPayload.endTime,
        callPayload.ended_at,
      )
        ? new Date(
            firstDefined(
              payload.end_timestamp,
              callPayload.end_timestamp,
              callPayload.endTime,
              callPayload.ended_at,
            ),
          )
        : null,
      duration_ms: firstDefined(payload.duration_ms, callPayload.duration_ms, callPayload.durationMs),
      transcript: firstDefined(payload.transcript, callPayload.transcript),
      transcript_object: firstDefined(
        payload.transcript_object,
        callPayload.transcript_object,
        callPayload.transcriptObject,
      ) || null,
      transcript_with_tool_calls:
        firstDefined(
          payload.transcript_with_tool_calls,
          callPayload.transcript_with_tool_calls,
          callPayload.transcriptWithToolCalls,
        ) || null,
      recording_url: firstDefined(payload.recording_url, callPayload.recording_url),
      call_summary: firstDefined(
        payload.call_summary,
        callPayload.call_summary,
        analysisPayload.call_summary,
        analysisPayload.summary,
      ) || null,
      sentiment:
        firstDefined(
          payload.sentiment,
          callPayload.sentiment,
          analysisPayload.user_sentiment,
          analysisPayload.sentiment,
        ) || null,
      cost:
        firstDefined(payload.call_cost, payload.cost, callPayload.call_cost, callPayload.cost) || null,
      clinic_id: clinicId || null,
      restaurant_id: restaurantId || null,
    };

    const { error } = await supabase.from("call_logs").upsert(row, { onConflict: "call_id" });
    if (error) {
      console.error("call_logs upsert failed:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.json({ ok: true, call_id: callId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** ------------------------------------------------------------------
 * Tooling: Voice & LLM utilities
 * ------------------------------------------------------------------ */
export async function listVoices(req, res) {
  try {
    const response = await fetch("https://api.retellai.com/list-voices", {
      headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const voices = await response.json();
    const clean = voices.map((voice) => ({
      voice_id: voice.voice_id,
      name: voice.voice_name,
      provider: voice.provider,
      gender: voice.gender,
      accent: voice.accent,
      language: voice.language || "en-US",
      preview_url: voice.preview_audio_url || null,
      avatar: voice.avatar_url || null,
      description: `${voice.provider} • ${voice.gender} • ${voice.accent}`,
    }));

    return res.json({ ok: true, voices: clean });
  } catch (error) {
    console.error("Retell Voices Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function playVoice(req, res) {
  try {
    const { voice_id } = req.body || {};
    if (!voice_id) return res.status(400).json({ error: "voice_id is required" });

    const voiceResp = await fetch("https://api.retellai.com/list-voices", {
      headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}` },
    });
    const voices = await voiceResp.json();
    const voice = voices.find((item) => item.voice_id === voice_id);
    if (!voice || !voice.preview_audio_url) {
      return res.status(404).json({ error: "No preview audio available for this voice." });
    }

    const audioResp = await fetch(voice.preview_audio_url);
    if (!audioResp.ok) throw new Error(`Failed to fetch audio: ${audioResp.statusText}`);

    const buffer = Buffer.from(await audioResp.arrayBuffer());
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length,
      "Content-Disposition": `inline; filename="voice-${voice_id}.mp3"`,
      "Cache-Control": "no-cache",
    });
    res.end(buffer);
  } catch (error) {
    console.error("Retell Voice Play Error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function createLLM(req, res) {
  try {
    const { general_prompt, model = "gpt-4.1", s25_model = "gpt-4o-realtime" } = req.body || {};
    const llmResp = await retellClient.llm.create({
      general_prompt,
      model,
      s25_model,
      model_temperature: 0.0,
      kb_config: { top_k: 3, filter_score: 0.6 },
    });
    res.json({ ok: true, llm: llmResp });
  } catch (error) {
    console.error("Retell LLM Error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function createAgent(req, res) {
  try {
    const { clinic_id, restaurant_id, agent = {}, llm = {} } = req.body || {};
    const orgType = clinic_id ? "Clinic" : "Restaurant";
    const orgId = clinic_id || restaurant_id;

    let llmId = llm.llm_id;
    if (!llmId) {
      const newLLM = await retellClient.llm.create({
        general_prompt: llm.general_prompt || "You are a polite assistant.",
        model: llm.model || "gpt-4.1",
        s25_model: llm.s25_model || "gpt-4o-realtime",
        model_temperature: 0.0,
        kb_config: { top_k: 3, filter_score: 0.6 },
      });
      llmId = newLLM.llm_id;
    }

    const agentResp = await createRetellAgent({
      agent,
      llmId,
      fallbackName: agent.agent_name || `${orgType} Agent`,
    });

    if (clinic_id) {
      await supabase
        .from("clinics")
        .update({ agent_id: agentResp.agent_id, llm_id: llmId })
        .eq("id", clinic_id);
    } else if (restaurant_id) {
      await supabase
        .from("restaurants")
        .update({ agent_id: agentResp.agent_id, llm_id: llmId })
        .eq("id", restaurant_id);
    }

    res.json({ ok: true, agent: agentResp, llm_id: llmId, org_type: orgType, org_id: orgId });
  } catch (error) {
    console.error("Retell Agent Error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAgent(req, res) {
  try {
    const { agentId } = req.params;
    const agent = await retellClient.agent.retrieve(agentId);
    res.json({ ok: true, agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateAgent(req, res) {
  try {
    const { agentId } = req.params;
    const payload = withWebhook(req.body || {});
    const updated = await retellClient.agent.update(agentId, payload);
    res.json({ ok: true, agent: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getLLM(req, res) {
  try {
    const { llmId } = req.params;
    const llm = await retellClient.llm.retrieve(llmId);
    res.json({ ok: true, llm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Bot, Check, ArrowRight, X, Play, CircleCheckBig } from "lucide-react";
import {
  useGetVoicesQuery,
  usePlayVoiceMutation,
  useCreateLLMMutation,
  useCreateAgentMutation,
  useGetLlmQuery,
} from "../../features/api/retellApi";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
const agentStepMeta = [
  { id: 1, label: "Voice", description: "Choose how your agent sounds" },
  { id: 2, label: "Prompt", description: "Write their core instructions" },
  { id: 3, label: "Finish", description: "" },
];

const totalAgentSteps = 3;

const CreateAgentModal = ({ isOpen, onClose, onSubmit }) => {
  const [createAgentStep, setCreateAgentStep] = useState(1);
  const [selectedVoiceId, setSelectedVoiceId] = useState(null);
  const [agentPrompt, setAgentPrompt] = useState("");
  const [playingVoices, setPlayingVoices] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [llmId, setLlmId] = useState(null);

  const [createLLM] = useCreateLLMMutation();
  const [createAgent] = useCreateAgentMutation();
  const { data: llm, isLoading: llmLoading } = useGetLlmQuery(llmId, {
    skip: !llmId,
  });
  const {
    data: voicesData,
    isLoading: voicesLoading,
    isError,
  } = useGetVoicesQuery(undefined, {
    skip: !isOpen,
  });

  const [playVoice] = usePlayVoiceMutation();

  const voices = voicesData ?? [];

  const selectedVoice = useMemo(
    () =>
      selectedVoiceId
        ? voices.find((voice) => voice.voice_id === selectedVoiceId) ?? null
        : null,
    [selectedVoiceId, voices]
  );

  useEffect(() => {
    if (llm) console.log("Fetched LLM:", llm);
  }, [llm]);

  useEffect(() => {
    if (!isOpen) {
      setCreateAgentStep(1);
      setSelectedVoiceId(null);
      setAgentPrompt("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const canProceedToNext =
    createAgentStep === 1
      ? Boolean(selectedVoiceId)
      : createAgentStep === 2
      ? Boolean(agentPrompt.trim())
      : false;

  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId((prev) => (prev === voiceId ? prev : voiceId));
  };

  const handleAgentPromptChange = (value) => {
    setAgentPrompt(value);
  };

  const goToNextStep = () => {
    if (createAgentStep >= totalAgentSteps || !canProceedToNext) {
      return;
    }
    setCreateAgentStep((prev) => Math.min(prev + 1, totalAgentSteps));
  };

  const goToPreviousStep = () => {
    setCreateAgentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = async () => {
    if (createAgentStep === 2) {
      setLoading(true);
      try {
        const resp = await createLLM({
          general_prompt: agentPrompt,
        }).unwrap();

        if (resp.ok && resp.llm?.llm_id) {
          setLlmId(resp.llm.llm_id);
          setCreateAgentStep(3);
        } else {
          toast.error(resp.error || "LLM creation failed");
        }
      } catch (err) {
        console.error("LLM create error:", err);
        toast.error("Failed to create LLM");
      } finally {
        setLoading(false);
      }
    } else {
      setCreateAgentStep((prev) => prev + 1);
    }
  };

  const getOrgDetailsFromToken = () => {
  try {
    const token = localStorage.getItem("ra.auth.token");
    if (!token) return null;
    const decoded = jwtDecode(token);

    // Determine org model and ID dynamically
    const orgModel = decoded?.orgModel || "Clinic"; // default fallback
    const orgId =
      orgModel === "Clinic"
        ? decoded?.clinic_id
        : orgModel === "Restaurant"
        ? decoded?.restaurant_id
        : null;

    return { orgModel, orgId };
  } catch (err) {
    console.error("Invalid JWT token:", err);
    return null;
  }
};


  const handleCreateAgent = async () => {
  setLoading(true);
  try {
    const orgInfo = getOrgDetailsFromToken();

    if (!orgInfo || !orgInfo.orgId) {
      toast.error("Organization ID not found in token!");
      setLoading(false);
      return;
    }

    // Build request payload dynamically based on org type
    const payload = {
      [orgInfo.orgModel === "Clinic" ? "clinic_id" : "restaurant_id"]:
        orgInfo.orgId,
      agent: { voice_id: selectedVoiceId },
      llm: { llm_id: llmId },
    };

    const resp = await createAgent(payload).unwrap();

    if (resp.ok) {
      toast.success(
        `${orgInfo.orgModel} Agent created successfully! 🎉`
      );
      onClose();
    } else {
      toast.error(resp.error || "Agent creation failed");
    }
  } catch (err) {
    console.error("Agent create error:", err);
    toast.error("Failed to create agent");
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Agent Builder
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-primary-dark">
              Create a new voice agent
            </h2>
            <p className="mt-1 text-xs text-textcolor-secondary">
              Pick a voice and craft the base prompt. The rest is coming soon.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-muted transition hover:bg-background-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {agentStepMeta.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
                      createAgentStep === step.id &&
                        "border-primary bg-primary text-white shadow-md",
                      createAgentStep > step.id &&
                        "border-success/60 bg-success/10 text-success-dark",
                      createAgentStep < step.id &&
                        "border-muted/60 bg-white text-muted"
                    )}
                  >
                    {step.id}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {step.label}
                  </span>
                </div>
                {index < agentStepMeta.length - 1 ? (
                  <div
                    className={clsx(
                      "h-px flex-1",
                      createAgentStep > step.id
                        ? "bg-primary/80"
                        : "bg-muted/40"
                    )}
                  />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-background-hover/70 bg-white/90 p-5 shadow-inner">
          {createAgentStep === 1 ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary-dark">
                    Choose a voice
                  </h3>
                  <p className="text-sm text-textcolor-secondary">
                    Voices come from ElevenLabs — pick the tone that best
                    matches your brand.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-background-hover/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {voices.length} available
                </span>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="flex flex-col gap-3 text-sm text-textcolor-secondary">
                    <div className="h-16 animate-pulse rounded-2xl bg-background-hover/60" />
                    <div className="h-16 animate-pulse rounded-2xl bg-background-hover/60" />
                    <div className="h-16 animate-pulse rounded-2xl bg-background-hover/60" />
                  </div>
                ) : isError ? (
                  <div className="rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-error">
                    Failed to load voices. Please try again later.
                  </div>
                ) : voices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-muted/60 p-6 text-sm text-textcolor-secondary">
                    No voices available yet. Connect ElevenLabs to get started.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {voices.map((voice) => (
                      <div
                        key={voice.voice_id}
                        className={clsx(
                          "flex flex-col items-start gap-2 rounded-2xl border bg-white p-4 transition hover:border-primary/40 hover:shadow-md",
                          selectedVoiceId === voice.voice_id
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-background-hover/70"
                        )}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-primary-dark">
                              {voice.name}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              {voice.language ?? "English (United States)"}
                            </p>
                          </div>
                          {selectedVoiceId === voice.voice_id ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : null}
                        </div>

                        <p className="text-xs text-textcolor-secondary leading-snug">
                          {voice.description || "No description provided."}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {/* ✅ Select Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectVoice(voice.voice_id)}
                            className={clsx(
                              "flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                              selectedVoiceId === voice.voice_id
                                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-muted text-muted hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            Select
                          </button>

                          {/* ✅ Play Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (playingVoices[voice.voice_id]) return; // already playing

                                // mark as playing
                                setPlayingVoices((prev) => ({
                                  ...prev,
                                  [voice.voice_id]: true,
                                }));

                                const res = await playVoice({
                                  voice_id: voice.voice_id,
                                  text: "Hello, this is a voice preview from ElevenLabs.",
                                  mode: "convert", // or "stream"
                                });

                                if (res?.data) {
                                  const audioUrl = URL.createObjectURL(
                                    res.data
                                  );
                                  const audio = new Audio(audioUrl);

                                  // when audio ends, remove playing flag
                                  audio.onended = () => {
                                    setPlayingVoices((prev) => {
                                      const updated = { ...prev };
                                      delete updated[voice.voice_id];
                                      return updated;
                                    });
                                  };

                                  audio.play();
                                }
                              } catch (err) {
                                console.error("Voice play failed:", err);
                              } finally {
                                setPlayingVoices((prev) => {
                                  const updated = { ...prev };
                                  delete updated[voice.voice_id];
                                  return updated;
                                });
                              }
                            }}
                            disabled={playingVoices[voice.voice_id]}
                            className={clsx(
                              "rounded-full border p-2 transition",
                              playingVoices[voice.voice_id]
                                ? "border-muted text-muted cursor-not-allowed"
                                : "border-primary/40 text-primary hover:bg-primary/10"
                            )}
                          >
                            <Play size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {createAgentStep === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-primary-dark">
                  Draft the core prompt
                </h3>
                <p className="text-sm text-textcolor-secondary">
                  Tell the agent how to greet callers, what it can help with,
                  and the tone it should keep.
                </p>
              </div>
              {selectedVoice ? (
                <div className="flex items-center gap-3 rounded-2xl border border-background-hover/70 bg-white/80 px-4 py-3 text-sm text-textcolor-secondary">
                  <Bot className="h-4 w-4 text-primary" />
                  <span>
                    Voice selected:
                    <span className="ml-1 font-semibold text-primary-dark">
                      {selectedVoice.name}
                    </span>
                  </span>
                </div>
              ) : null}
              <label className="flex flex-col gap-2 text-sm text-primary-dark/90">
                Agent Prompt
                <textarea
                  rows={6}
                  value={agentPrompt}
                  onChange={(event) =>
                    handleAgentPromptChange(event.target.value)
                  }
                  className="rounded-2xl border border-background-hover/70 bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., You are the friendly receptionist for Downtown Medical Clinic..."
                />
              </label>
            </div>
          ) : null}

          {createAgentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-success flex items-center justify-center gap-2">
                  <CircleCheckBig /> LLM Created Successfully!
                </h3>
                <p className="text-sm text-textcolor-secondary mt-1">
                  Your LLM has been generated and is ready to be linked with the
                  agent.
                </p>
              </div>

              {llm ? (
                <div className="rounded-2xl border border-background-hover/70 bg-white/80 p-4 shadow-inner space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-semibold text-primary-dark">
                      LLM ID:
                    </span>
                    <code className="text-xs bg-background-hover/50 rounded px-2 py-1">
                      {llm.llm_id}
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-semibold text-primary-dark">
                      Model:
                    </span>
                    <span className="text-sm text-textcolor-secondary">
                      {llm.model ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm font-semibold text-primary-dark">
                      Temperature:
                    </span>
                    <span className="text-sm text-textcolor-secondary">
                      {llm.model_temperature ?? "0"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-dark mb-1">
                      General Prompt:
                    </p>
                    <p className="text-sm text-textcolor-secondary whitespace-pre-wrap bg-background-hover/40 p-3 rounded-xl">
                      {llm.general_prompt || "No prompt found."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted py-4">
                  Loading LLM details...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-full border border-error/30 px-4 py-2 text-xs font-semibold text-error transition hover:border-error hover:bg-error/10"
          >
            <X size={14} />
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {createAgentStep > 1 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
              >
                Back
              </button>
            ) : null}
            {createAgentStep < totalAgentSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToNext}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border border-success/50 px-4 py-2 text-xs font-semibold transition",
                  canProceedToNext
                    ? "border-success bg-success/10 text-success hover:border-success hover:bg-success/20"
                    : "cursor-not-allowed border-muted/50 bg-muted/20 text-muted"
                )}
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateAgent}
                disabled={!selectedVoiceId || !agentPrompt.trim()}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border border-success/50 px-4 py-2 text-xs font-semibold transition",
                  selectedVoiceId && agentPrompt.trim()
                    ? "border-success bg-success/10 text-success hover:border-success hover:bg-success/20"
                    : "cursor-not-allowed border-muted/50 bg-muted/20 text-muted"
                )}
              >
                Create Agent
                <Check size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentModal;

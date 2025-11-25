import React, { memo } from "react";
import { CheckCircle2, Play } from "lucide-react";

const VoicesSection = ({
  voices,
  voicesLoading,
  voicesError,
  selectedVoiceId,
  voiceSelectionError,
  playingVoices,
  onSelectVoice,
  onPreviewVoice,
  selectedVoice,
}) => (
  <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-primary-dark">Select a voice</h3>
        <p className="text-xs text-textcolor-secondary">
          Voices stream directly from ElevenLabs. Pick the tone that feels most
          on-brand for your reception assistant.
        </p>
      </div>
      <span className="inline-flex items-center rounded-full border border-background-hover bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-textcolor-muted">
        {voices.length} available
      </span>
    </div>

    {voiceSelectionError ? (
      <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error">
        {voiceSelectionError}
      </div>
    ) : null}

    {voicesLoading ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-background-hover bg-background-hover/80"
          />
        ))}
      </div>
    ) : voicesError ? (
      <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        We couldn&apos;t load your voice catalog. Please try again in a moment.
      </div>
    ) : voices.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-background-hover bg-white px-5 py-6 text-sm text-textcolor-secondary">
        No voices available yet. Connect your ElevenLabs account to sync preset voices.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {voices.map((voice) => {
          const isSelected = selectedVoiceId === voice.voice_id;
          const isPlaying = Boolean(playingVoices[voice.voice_id]);
          return (
            <div
              key={voice.voice_id}
              className={`flex h-full flex-col gap-2 rounded-2xl border bg-white p-4 transition ${
                isSelected
                  ? "border-primary shadow-md shadow-primary/20"
                  : "border-background-hover hover:border-accent/40 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-primary-dark">
                    {voice.name}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-textcolor-muted">
                    {voice.language ?? "English (United States)"}
                  </p>
                </div>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-textcolor-secondary">
                {voice.description?.trim() || "No description provided."}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectVoice(voice.voice_id)}
                  className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary-dark"
                      : "border-background-hover text-textcolor-secondary hover:border-accent/40 hover:text-primary-dark"
                  }`}
                >
                  {isSelected ? "Selected" : "Select voice"}
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewVoice(voice)}
                  disabled={isPlaying}
                  className={`rounded-full border p-2 transition ${
                    isPlaying
                      ? "cursor-not-allowed border-background-hover text-textcolor-muted"
                      : "border-accent/40 text-accent-dark hover:bg-accent/10"
                  }`}
                  aria-label={`Preview ${voice.name}`}
                >
                  <Play size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {selectedVoice ? (
      <div className="rounded-2xl border border-background-hover bg-white px-4 py-3 text-xs text-textcolor-secondary">
        <span>
          Currently selected voice:
          <span className="ml-1 font-semibold text-primary-dark">
            {selectedVoice.name}
          </span>
        </span>
      </div>
    ) : null}
  </div>
);

export default memo(VoicesSection);

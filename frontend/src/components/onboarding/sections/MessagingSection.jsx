import React, { memo } from "react";
import { TextArea } from "../FormControls";

const MessagingSection = ({
  greetingLine,
  onGreetingLineChange,
  closingLine,
  onClosingLineChange,
  toneOptions,
  toneVariants,
  onToggleTone,
}) => (
  <div className="space-y-5">
    <TextArea
      label="Greeting line"
      rows={2}
      placeholder="Hi! Thanks for calling Acme Medical. How can I help?"
      value={greetingLine}
      onChange={(event) => onGreetingLineChange(event.target.value)}
    />
    <TextArea
      label="Closing line"
      rows={2}
      placeholder="It was my pleasure assisting you today. Have a great week!"
      value={closingLine}
      onChange={(event) => onClosingLineChange(event.target.value)}
    />

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-primary-dark">Tone variants</h3>
      <p className="text-xs text-textcolor-secondary">
        Choose one or more tone presets the assistant can switch between.
      </p>
      <div className="flex flex-wrap gap-3">
        {toneOptions.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => onToggleTone(tone)}
            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              toneVariants.includes(tone)
                ? "border-accent/40 bg-accent/10 text-accent-dark"
                : "border-background-hover bg-white text-textcolor-secondary hover:border-accent/40 hover:text-primary-dark"
            }`}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>

    <div className="rounded-2xl border border-dashed border-background-hover bg-white px-5 py-6 text-center text-sm text-textcolor-secondary">
      <p>
        Need custom voice guidance? Drop notes here or attach scripts later in the
        knowledge base.
      </p>
    </div>
  </div>
);

export default memo(MessagingSection);

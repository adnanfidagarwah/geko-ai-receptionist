import { X, FileText, MessageSquare, Bot } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-neutral-600">{title}</h4>
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
      {children}
    </div>
  </div>
);

const formatTranscript = (transcript, withToolCalls) => {
  if (withToolCalls && Array.isArray(withToolCalls) && withToolCalls.length) {
    return withToolCalls.map((entry, idx) => {
      const type = entry.role || entry.type || "message";
      const speaker =
        type === "assistant" || type === "agent"
          ? "Agent"
          : type === "user"
            ? "Caller"
            : type;
      const content = entry.content || entry.text || entry.message || JSON.stringify(entry, null, 2);
      return (
        <div key={idx} className="rounded-md bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-400">
            {speaker === "Agent" ? <Bot className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
            {speaker}
          </div>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{content}</p>
        </div>
      );
    });
  }

  if (typeof transcript === "string" && transcript.trim().length) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{transcript}</p>;
  }

  return <p className="text-sm text-neutral-500">No transcript captured for this call.</p>;
};

export default function CallTranscriptViewer({ call, onClose }) {
  if (!call) return null;

  const rawCall = call.rawCall ?? call;
  const call_id = call.call_id ?? rawCall?.call_id;
  const transcript = call.transcript ?? rawCall?.transcript;
  const transcript_with_tool_calls =
    call.transcriptWithToolCalls ?? rawCall?.transcript_with_tool_calls;
  const transcript_object = rawCall?.transcript_object;
  const call_summary = call.callSummary ?? rawCall?.call_summary;
  const sentiment = call.sentiment ?? rawCall?.sentiment;
  const duration_ms = rawCall?.duration_ms ?? call.duration_ms;
  const direction = rawCall?.direction ?? call.direction;

  const formatDuration = (ms) => {
    if (!ms) return "—";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const summary = call_summary || transcript_object?.summary;
  const sentimentValue = sentiment || transcript_object?.sentiment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <FileText className="h-4 w-4 text-primary-500" />
              Call Transcript
            </div>
            <h3 className="mt-1 text-lg font-semibold text-neutral-900">Call #{call_id}</h3>
            <p className="text-xs text-neutral-400">
              {direction ? direction.toUpperCase() : "UNKNOWN"} • Duration {formatDuration(duration_ms)}
            </p>
          </div>
          <button
            className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            onClick={onClose}
            aria-label="Close transcript"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <Section title="Summary">
            {summary ? <p>{summary}</p> : <p className="text-neutral-500">No summary available.</p>}
          </Section>

          <Section title="Sentiment">
            {sentimentValue ? <p>{sentimentValue}</p> : <p className="text-neutral-500">No sentiment data.</p>}
          </Section>

          <Section title="Transcript">
            {formatTranscript(transcript,)}
          </Section>
        </div>
      </div>
    </div>
  );
}

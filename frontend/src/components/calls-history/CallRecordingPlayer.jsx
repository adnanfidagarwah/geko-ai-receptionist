import { X, PlayCircle } from "lucide-react";

export default function CallRecordingPlayer({ call, onClose }) {
  if (!call) return null;

  const { recordingUrl, caller, phone, time } = call;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <PlayCircle className="h-4 w-4 text-primary-500" />
              Call Recording
            </div>
            <h3 className="mt-1 text-lg font-semibold text-neutral-900">
              {caller ?? "Caller"} • {phone ?? "Unknown"}
            </h3>
            <p className="text-xs text-neutral-400">{time ?? ""}</p>
          </div>
          <button
            className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            onClick={onClose}
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {recordingUrl ? (
            <audio
              src={recordingUrl}
              controls
              autoPlay
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-500">
              Recording URL not available. Try again later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

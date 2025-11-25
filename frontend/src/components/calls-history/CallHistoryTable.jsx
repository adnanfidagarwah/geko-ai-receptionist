import { useEffect, useMemo, useState } from "react";
import { Play, Eye, Filter, RefreshCw, Search, Loader2 } from "lucide-react";
import Table from "../ui/Table";
import { Badge } from "../ui/Badge";
import { useGetCallsQuery } from "../../features/api/appApi";
import CallRecordingPlayer from "./CallRecordingPlayer";
import CallTranscriptViewer from "./CallTranscriptViewer";

const columns = [
  { key: "direction", label: "Direction" },
  { key: "phone", label: "Contact" },
  { key: "time", label: "Start" },
  { key: "duration", label: "Duration" },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const variant =
        val === "Completed" ? "success" : val === "In Progress" ? "warning" : "error";
      return <Badge variant={variant}>{val}</Badge>;
    },
  },
  { key: "outcome", label: "Outcome" },
];

const statusMap = {
  completed: "Completed",
  missed: "Missed",
  in_progress: "In Progress",
};

const formatPhone = (value = "") => {
  if (!value) return "Unknown";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return value;
};

const formatDuration = (ms) => {
  if (!ms || Number.isNaN(ms)) return "—";
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
};

const resolveStatus = (call) => {
  if (!call) return "Unknown";
  if (!call.end_timestamp && !call.duration_ms) return "In Progress";
  if (call.duration_ms === 0) return "Missed";
  return "Completed";
};

export default function CallHistoryTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    const base = { page, pageSize };
    if (direction) base.direction = direction;
    if (status) base.status = status;
    if (from) base.from = from;
    if (to) base.to = to;
    if (search.trim()) base.search = search.trim();
    return base;
  }, [page, pageSize, direction, status, from, to, search]);

  const { data, isFetching, isLoading, isError } = useGetCallsQuery(params);
  const [activeCall, setActiveCall] = useState(null);
  const [transcriptCall, setTranscriptCall] = useState(null);

  const calls = data?.data?.calls ?? data?.calls ?? [];
  const pagination = data?.data?.pagination ?? data?.pagination ?? {};
  const total = pagination.total ?? calls.length;
  const currentPage = pagination.page ?? page;
  const currentPageSize = pagination.pageSize ?? pageSize;
  const hasMore = pagination.hasMore ?? currentPage * currentPageSize < total;
  const isInitialLoading = isLoading && !data;

  useEffect(() => {
    if (!isFetching && total > 0 && calls.length === 0 && currentPage > 1) {
      const lastPage = Math.max(Math.ceil(total / currentPageSize), 1);
      if (lastPage !== currentPage) setPage(lastPage);
    }
  }, [calls.length, total, currentPage, currentPageSize, isFetching]);

  useEffect(() => {
    setPage(1);
  }, [direction, status, from, to, search]);

  const rows = useMemo(
    () =>
      calls.map((call) => {
        const dirLabel = call.direction === "inbound" ? "Inbound" : "Outbound";
        const number = call.direction === "inbound" ? call.from_number : call.to_number;
        const statusLabel = resolveStatus(call);
        const transcriptAvailable =
          (!!call.transcript && call.transcript.trim().length > 0) ||
          (Array.isArray(call.transcript_with_tool_calls) && call.transcript_with_tool_calls.length > 0);

        return {
          direction: dirLabel,
          phone: formatPhone(number),
          time: formatTime(call.start_timestamp),
          duration: formatDuration(call.duration_ms),
          status: statusLabel,
          outcome: call.call_summary ? call.call_summary : "—",
          call,
          recordingUrl: call.recording_url,
          transcript: call.transcript,
          hasTranscript: transcriptAvailable,
        };
      }),
    [calls],
  );

  const resetFilters = () => {
    setDirection("");
    setStatus("");
    setFrom("");
    setTo("");
    setSearch("");
  };

  let tableContent = null;
  if (isInitialLoading) {
    tableContent = (
      <div className="card-default rounded-xl p-6 text-neutral-500">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading call history…
        </div>
      </div>
    );
  } else if (isError) {
    tableContent = (
      <div className="card-default rounded-xl p-6 text-red-500">
        Unable to load call history. Please refresh and try again.
      </div>
    );
  } else if (!isFetching && rows.length === 0) {
    tableContent = (
      <div className="card-default rounded-xl p-6 text-neutral-500">
        No call data yet. Once your receptionist handles calls, they’ll appear here.
      </div>
    );
  } else {
    tableContent = (
      <Table
        title="Call History"
        subtitle="Recent incoming and outgoing calls"
        columns={columns}
        data={rows}
        actions={[
          ({ row }) => (
            <button
              className="p-1.5 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-40"
              onClick={() => row.recordingUrl && setActiveCall(row)}
              disabled={!row.recordingUrl}
              title={row.recordingUrl ? "Play recording" : "Recording unavailable"}
            >
              <Play className="h-4 w-4 text-primary-500" />
            </button>
          ),
          ({ row }) => (
            <button
              className="p-1.5 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-40"
              onClick={() => row.hasTranscript && setTranscriptCall(row)}
              disabled={!row.hasTranscript}
              title={row.hasTranscript ? "View transcript" : "Transcript unavailable"}
            >
              <Eye className="h-4 w-4 text-primary-500" />
            </button>
          ),
        ]}
        searchable={false}
        pageSizeOptions={[5, 10, 25, 50]}
        defaultPageSize={pageSize}
        manualPagination
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
        isLoading={isFetching}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          {(direction || status || from || to || search.trim()) && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-xs font-medium text-primary-600 transition hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search call id, phone, or summary"
            className="input-primary h-10 w-full pl-9"
          />
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Direction
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="input-primary h-10"
            >
              <option value="">All directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-primary h-10"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="in_progress">In Progress</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-primary h-10"
              max={to || undefined}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-primary h-10"
              min={from || undefined}
            />
          </label>
        </div>
      )}

      {tableContent}
      <CallRecordingPlayer call={activeCall} onClose={() => setActiveCall(null)} />
      <CallTranscriptViewer call={transcriptCall} onClose={() => setTranscriptCall(null)} />
    </div>
  );
}

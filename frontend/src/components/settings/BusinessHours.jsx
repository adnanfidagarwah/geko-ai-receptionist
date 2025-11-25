import React, { useEffect, useState } from "react";
import { Save, Clock, Settings, CalendarClock, RotateCcw } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import api from "../../lib/http";

const CLINIC_STORAGE_KEY = "ra.settings.activeClinicId";

const templateButtons = [
  { key: "standard", label: "Mon-Fri 8-5" },
  { key: "extended", label: "Extended 7-7" },
  { key: "alwaysOpen", label: "24/7 coverage" },
];

const upcomingClosures = [
  {
    title: "Memorial Day",
    date: "Mon • May 27",
    coverage: "Play holiday greeting and send callers to voicemail",
  },
  {
    title: "Team training",
    date: "Fri • Jun 14",
    coverage: "Forward to on-call mobile: (555) 987-6543",
  },
];

const defaultHours = [
  { day: "Monday", weekday: 1, open: "08:00 AM", close: "05:00 PM", enabled: true },
  { day: "Tuesday", weekday: 2, open: "08:00 AM", close: "05:00 PM", enabled: true },
  { day: "Wednesday", weekday: 3, open: "08:00 AM", close: "05:00 PM", enabled: true },
  { day: "Thursday", weekday: 4, open: "08:00 AM", close: "05:00 PM", enabled: true },
  { day: "Friday", weekday: 5, open: "08:00 AM", close: "05:00 PM", enabled: true },
  { day: "Saturday", weekday: 6, open: "09:00 AM", close: "01:00 PM", enabled: true },
  { day: "Sunday", weekday: 0, open: "", close: "", enabled: false },
];

const callFeatures = [
  {
    title: "Call forwarding",
    desc: "Redirect missed calls to a backup number",
    enabled: true,
  },
  {
    title: "Voicemail capture",
    desc: "Let callers leave detailed messages after hours",
    enabled: true,
  },
  {
    title: "Smart receptionist",
    desc: "AI answers and routes calls automatically",
    enabled: true,
  },
  {
    title: "Call recording",
    desc: "Record calls for coaching and quality review",
    enabled: true,
  },
  {
    title: "After-hours flows",
    desc: "Customize what happens when you are closed",
    enabled: true,
  },
  {
    title: "Multi-language support",
    desc: "Offer Spanish and other languages to callers",
    enabled: false,
  },
];

const hourTemplates = {
  standard: () =>
    defaultHours.map((slot) => ({
      ...slot,
      open:
        slot.day === "Saturday"
          ? "09:00 AM"
          : slot.day === "Sunday"
          ? ""
          : "08:00 AM",
      close:
        slot.day === "Saturday"
          ? "01:00 PM"
          : slot.day === "Sunday"
          ? ""
          : "05:00 PM",
      enabled: slot.day !== "Sunday",
    })),
  extended: () =>
    defaultHours.map((slot) => ({
      ...slot,
      open:
        slot.day === "Saturday"
          ? "08:00 AM"
          : slot.day === "Sunday"
          ? "10:00 AM"
          : "07:00 AM",
      close:
        slot.day === "Saturday"
          ? "04:00 PM"
          : slot.day === "Sunday"
          ? "02:00 PM"
          : "07:00 PM",
      enabled: true,
    })),
  alwaysOpen: () =>
    defaultHours.map((slot) => ({
      ...slot,
      open: "12:00 AM",
      close: "11:59 PM",
      enabled: true,
    })),
};

const buildHoursFromApi = (records) => {
  if (!Array.isArray(records) || !records.length) {
    return defaultHours.map((slot) => ({ ...slot }));
  }

  const grouped = records.reduce((acc, row) => {
    const key = Number(row.weekday);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return defaultHours.map((slot) => {
    const dayRecords = grouped[slot.weekday] ? [...grouped[slot.weekday]] : [];
    if (!dayRecords.length) {
      return { ...slot, enabled: false, open: "", close: "" };
    }

    dayRecords.sort((a, b) => (a.open_time || "").localeCompare(b.open_time || ""));
    const openRecord =
      dayRecords.find((rec) => rec.is_open !== false) || dayRecords[0];

    if (!openRecord || openRecord.is_open === false) {
      return { ...slot, enabled: false, open: "", close: "" };
    }

    const open = convertFrom24Hr(openRecord.open_time) || "";
    const close = convertFrom24Hr(openRecord.close_time) || "";

    return {
      ...slot,
      enabled: true,
      open,
      close,
    };
  });
};

const BusinessHours = () => {
  const [hours, setHours] = useState(() =>
    defaultHours.map((slot) => ({ ...slot }))
  );
  const [features, setFeatures] = useState(() =>
    callFeatures.map((feature) => ({ ...feature }))
  );
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const storage =
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : null;

  function extractErrorMessage(err) {
    return (
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "An unexpected error occurred."
    );
  }

  useEffect(() => {
    if (!storage) return;
    const token = storage.getItem("ra.auth.token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("BusinessHours decoded token:", decoded);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
    // We only need to run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadClinics = async () => {
      setIsLoadingClinics(true);
      try {
        const { data } = await api.get("/clinics");
        if (!isMounted) return;

        const clinicList = Array.isArray(data?.clinics) ? data.clinics : [];
        setClinics(clinicList);

        const storedClinicId = storage?.getItem?.(CLINIC_STORAGE_KEY);
        const matchingStored = clinicList.find(
          (clinic) => String(clinic.id) === String(storedClinicId)
        );
        const initialClinicId =
          matchingStored?.id ?? clinicList[0]?.id ?? null;

        setSelectedClinicId(initialClinicId ? String(initialClinicId) : null);
        if (initialClinicId && storage) {
          storage.setItem(CLINIC_STORAGE_KEY, String(initialClinicId));
        }
      } catch (err) {
        if (!isMounted) return;
        toast.error(extractErrorMessage(err) || "Failed to load clinics.");
        setClinics([]);
        setSelectedClinicId(null);
      } finally {
        if (isMounted) {
          setIsLoadingClinics(false);
        }
      }
    };

    loadClinics();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClinicId) {
      setHours(defaultHours.map((slot) => ({ ...slot })));
      setHasChanges(false);
      return;
    }

    let isMounted = true;

    const loadHours = async () => {
      setIsLoadingHours(true);
      try {
        const { data } = await api.get(
          `/clinics/${selectedClinicId}/working-hours`
        );
        if (!isMounted) return;
        const records = Array.isArray(data?.hours) ? data.hours : [];
        setHours(buildHoursFromApi(records));
        setHasChanges(records.length === 0);
      } catch (err) {
        if (!isMounted) return;
        toast.error(
          extractErrorMessage(err) || "Failed to load working hours."
        );
        setHours(defaultHours.map((slot) => ({ ...slot })));
        setHasChanges(true);
      } finally {
        if (isMounted) {
          setIsLoadingHours(false);
        }
      }
    };

    loadHours();
    return () => {
      isMounted = false;
    };
  }, [selectedClinicId]);

  const handleClinicChange = (event) => {
    const nextId = event.target.value || null;
    setSelectedClinicId(nextId);
    if (storage) {
      if (nextId) {
        storage.setItem(CLINIC_STORAGE_KEY, nextId);
      } else {
        storage.removeItem(CLINIC_STORAGE_KEY);
      }
    }
  };

  const convertToMinutes = (timeStr) => {
    const value = convertTo24Hr(timeStr);
    if (!value) return null;
    const [hoursValue, minutesValue] = value.split(":").map(Number);
    if (Number.isNaN(hoursValue) || Number.isNaN(minutesValue)) return null;
    return hoursValue * 60 + minutesValue;
  };

  const handleSaveHours = async () => {
    if (!selectedClinicId) {
      toast.error("Select a clinic before saving hours.");
      return;
    }

    for (const slot of hours) {
      if (!slot.enabled) continue;
      if (!slot.open || !slot.close) {
        toast.error(`Provide both opening and closing times for ${slot.day}.`);
        return;
      }

      const start = convertToMinutes(slot.open);
      const end = convertToMinutes(slot.close);
      if (start === null || end === null) {
        toast.error(`Invalid time format for ${slot.day}.`);
        return;
      }
      if (start >= end) {
        toast.error(`${slot.day} closing time must be after opening time.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const schedule = hours.map((slot) => ({
        weekday: slot.weekday,
        windows:
          slot.enabled && slot.open && slot.close
            ? [
                {
                  open_time: convertTo24Hr(slot.open),
                  close_time: convertTo24Hr(slot.close),
                  is_open: true,
                },
              ]
            : [],
      }));

      const { data } = await api.put(
        `/clinics/${selectedClinicId}/working-hours/bulk`,
        { schedule }
      );

      const savedRecords = Array.isArray(data?.hours) ? data.hours : [];
      setHours(buildHoursFromApi(savedRecords));
      toast.success("Business hours saved.");
      setHasChanges(false);
    } catch (err) {
      toast.error(
        extractErrorMessage(err) || "Failed to save working hours."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = hourTemplates[templateKey];
    if (!template) return;
    setHours(template());
    setHasChanges(true);
  };

  const resetTemplate = () => {
    setHours(defaultHours.map((slot) => ({ ...slot })));
    setHasChanges(true);
  };

  const handleToggleHours = (index) => {
    setHours((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
    setHasChanges(true);
  };

  const handleTimeChange = (index, field, value) => {
    setHours((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index
          ? { ...slot, [field]: convertFrom24Hr(value) }
          : slot
      )
    );
    setHasChanges(true);
  };

  const handleToggleFeature = (index) => {
    setFeatures((prev) =>
      prev.map((feature, featureIndex) =>
        featureIndex === index
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-background-hover/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-dark">
                Operating schedule
              </h2>
              <p className="text-sm text-textcolor-secondary">
                Toggle availability by day and tailor the hours to match your
                clinic.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-textcolor-secondary">
                Clinic
              </span>
              <select
                value={selectedClinicId ?? ""}
                onChange={handleClinicChange}
                disabled={isLoadingClinics || !clinics.length || isSaving}
                className="rounded-full border border-background-hover/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-textcolor-secondary transition focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingClinics ? (
                  <option value="">Loading...</option>
                ) : clinics.length ? (
                  clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name || `Clinic ${clinic.id}`}
                    </option>
                  ))
                ) : (
                  <option value="">No clinics available</option>
                )}
              </select>
            </div>
            {templateButtons.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => applyTemplate(template.key)}
                className="rounded-full border border-background-hover/80 px-3 py-1.5 text-xs font-medium text-textcolor-secondary transition hover:border-primary hover:text-primary"
              >
                {template.label}
              </button>
            ))}
            <button
              type="button"
              onClick={resetTemplate}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6 divide-y divide-background-hover/60">
          {isLoadingHours ? (
            <div className="py-8 text-center text-sm text-textcolor-secondary">
              Loading working hours...
            </div>
          ) : (
            hours.map((item, i) => (
              <div
                key={item.day}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-semibold text-primary-dark">
                    {item.day}
                  </span>
                  <ToggleButton
                    enabled={item.enabled}
                    disabled={isLoadingHours || isSaving}
                    onClick={() => handleToggleHours(i)}
                  />
                </div>

                {item.enabled ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <TimeInput
                      value={item.open}
                      onChange={(value) => handleTimeChange(i, "open", value)}
                      disabled={isLoadingHours || isSaving}
                    />
                    <span className="text-xs uppercase tracking-wide text-textcolor-secondary">
                      to
                    </span>
                    <TimeInput
                      value={item.close}
                      onChange={(value) => handleTimeChange(i, "close", value)}
                      disabled={isLoadingHours || isSaving}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-textcolor-secondary/70">
                    Closed
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSaveHours}
            disabled={
              isSaving ||
              isLoadingHours ||
              !selectedClinicId ||
              !hasChanges
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save hours"}
          </button>
        </div>
      </div>

      {/* <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-background-hover/60 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-primary-dark">
              Call handling features
            </h2>
          </div>
          <p className="mb-4 text-sm text-textcolor-secondary">
            Enable the automation options that best match your front-desk flow.
          </p>

          <div className="space-y-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="flex items-center justify-between rounded-xl border border-background-hover/60 bg-background-hover/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-primary-dark">
                    {feature.title}
                  </p>
                  <p className="text-xs text-textcolor-secondary">
                    {feature.desc}
                  </p>
                </div>
                <ToggleButton
                  enabled={feature.enabled}
                  onClick={() => handleToggleFeature(i)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-background-hover/60 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-primary-dark">
              Upcoming exceptions
            </h2>
          </div>
          <p className="mb-4 text-sm text-textcolor-secondary">
            Plan ahead for holidays or team events so callers always know what
            to expect.
          </p>

          <div className="space-y-3">
            {upcomingClosures.map((closure) => (
              <div
                key={closure.title}
                className="rounded-xl border border-background-hover/60 bg-background-hover/30 p-4"
              >
                <p className="text-sm font-semibold text-primary-dark">
                  {closure.title}
                </p>
                <p className="text-xs text-textcolor-secondary">
                  {closure.date}
                </p>
                <p className="mt-2 text-xs text-textcolor-secondary/80">
                  {closure.coverage}
                </p>
              </div>
            ))}
          </div>

          <button className="mt-5 w-full rounded-md border border-primary/50 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15">
            Add exception
          </button>
        </div>
      </div> */}
    </div>
  );
};

const ToggleButton = ({ enabled, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
      enabled ? "bg-primary" : "bg-background-hover"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        enabled ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

const TimeInput = ({ value, onChange, disabled = false }) => (
  <input
    type="time"
    value={convertTo24Hr(value)}
    onChange={(event) => onChange?.(event.target.value)}
    disabled={disabled}
    className="rounded-md border border-background-hover/60 bg-background-hover/40 px-3 py-2 text-sm text-primary-dark transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
  />
);

const convertTo24Hr = (timeStr) => {
  if (!timeStr) return "";
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  let hrs = parseInt(hours, 10);

  if (modifier === "AM") {
    if (hrs === 12) hrs = 0;
  } else if (modifier === "PM") {
    if (hrs !== 12) hrs += 12;
  }

  return `${String(hrs).padStart(2, "0")}:${minutes}`;
};

const convertFrom24Hr = (timeStr) => {
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":");
  let hrs = parseInt(hours, 10);
  const modifier = hrs >= 12 ? "PM" : "AM";

  if (hrs === 0) {
    hrs = 12;
  } else if (hrs > 12) {
    hrs -= 12;
  }

  return `${String(hrs).padStart(2, "0")}:${minutes} ${modifier}`;
};

export default BusinessHours;

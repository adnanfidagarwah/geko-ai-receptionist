const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_LANGUAGE = "English";
const DEFAULT_LANGUAGES = ["English"];
const DEFAULT_TIMEZONE = "America/Chicago";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Varies";
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return `${value}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(number);
};

const safeJoin = (items, separator = ", ", fallback = "Not provided") => {
  const filtered = (items || []).map((item) => item).filter(Boolean);
  return filtered.length ? filtered.join(separator) : fallback;
};

const summarizeHours = (locations = []) => {
  if (!locations.length) {
    return "Not provided";
  }

  const summaries = locations.map((location) => {
    const hours = location.hours || {};
    const parts = DAYS.map((day) => {
      const entry = hours[day];
      if (!entry || entry.closed) {
        return `${day}: Closed`;
      }
      const open = entry.open || "00:00";
      const close = entry.close || "00:00";
      return `${day}: ${open}–${close}`;
    }).join("; ");

    const label = location.label || "Primary location";
    return `${label} (${location.timezone || DEFAULT_TIMEZONE}): ${parts}`;
  });

  return summaries.join(" | ");
};

const machineHours = (locations = [], timezoneFallback = DEFAULT_TIMEZONE) => {
  const payload = {};
  locations.forEach((location) => {
    const label = location.label || "Primary location";
    payload[label] = {
      timezone: location.timezone || timezoneFallback,
      hours: location.hours || {},
    };
  });
  return JSON.stringify(payload);
};

const formatPlans = (insurance = {}) => {
  const plans = Array.isArray(insurance.plans) ? insurance.plans : [];
  if (!plans.length) {
    return "No insurance plans on file.";
  }

  const lines = plans.map((plan) => {
    const coverages = Array.isArray(plan.coverages) ? plan.coverages : [];
    const coverageSummary = coverages.length
      ? coverages
          .map((coverage) => {
            const service = coverage.service || "Service";
            const detail =
              coverage.coverageDetail ||
              coverage.coverage_detail ||
              "Coverage varies";
            return `${service}: ${detail}`;
          })
          .join("; ")
      : "Coverage details vary by service.";
    return `${plan.name || "Plan"} — ${coverageSummary}`;
  });

  return lines.join(" | ");
};

const formatPricingTable = (services = []) => {
  if (!services.length) {
    return "Service | Duration | Price\\n--- | --- | ---\\nConsultation | 30 min | Varies";
  }

  const header = "Service | Duration | Price";
  const divider = "--- | --- | ---";
  const rows = services.map((service) => {
    const name = service.name || "Service";
    const duration = service.duration_minutes || service.duration || 30;
    const price = formatCurrency(service.price);
    return `${name} | ${duration} min | ${price}`;
  });

  return [header, divider, ...rows].join("\\n");
};

const formatPaymentMethods = (insuranceNotes = {}) => {
  const methods = Array.isArray(insuranceNotes.paymentMethods)
    ? insuranceNotes.paymentMethods
    : [];
  if (methods.length) {
    return methods.join(", ");
  }
  return "Cash, Credit / Debit Card";
};

const formatHolidays = (locations = []) => {
  const notes = locations
    .map((location) => location.holidaysNotes || location.holidays_notes)
    .filter(Boolean);
  return notes.length ? notes.join(" | ") : "None provided";
};

const formatConfirmationChannels = (policies = {}) => {
  const channels = [];
  if (policies.notify_sms) channels.push("SMS");
  if (policies.notify_email) channels.push("Email");
  if (policies.notify_whatsapp) channels.push("WhatsApp");
  return safeJoin(channels, ", ", "None");
};

const determineTimezone = (locations = []) => {
  const tz =
    locations.find((location) => location.timezone)?.timezone || DEFAULT_TIMEZONE;
  return tz;
};

const buildPromptContext = ({ clinic = {}, onboarding = {} }) => {
  const locations = onboarding.locations || [];
  const services = onboarding.services || [];
  const addOns = onboarding.addOns || onboarding.add_ons || [];
  const insurance = onboarding.insurance || {};
  const policies = onboarding.policies || {};
  const messaging = onboarding.messaging || {};

  const timezone = determineTimezone(locations);
  const defaultSlotMinutes =
    Number(
      locations.find((location) => location.defaultSlotLength)?.defaultSlotLength,
    ) || 30;

  const privacyMode = policies.privacy_mode ?? policies.privacyMode ?? true;
  const privacyLabel = privacyMode ? "Privacy mode enabled" : "Standard retention";
  const optOut = !privacyMode;

  const paymentMethods = formatPaymentMethods(insurance.notes);
  const supportedInsurance = safeJoin(
    (insurance.plans || []).map((plan) => plan.name),
    ", ",
    "No insurance plans on file",
  );

  const lateFee =
    locations.find((location) => location.lateFeePolicy || location.late_fee_policy)
      ?.lateFeePolicy ||
    locations.find((location) => location.late_fee_policy)?.late_fee_policy ||
    "No late fee";

  const reschedulePolicy =
    locations.find(
      (location) => location.reschedulePolicy || location.reschedule_policy,
    )?.reschedulePolicy ||
    locations.find((location) => location.reschedule_policy)?.reschedule_policy ||
    "Please cancel or reschedule at least 24 hours in advance.";

  const greeting = messaging.greeting_line || messaging.greetingLine || "";
  const closing = messaging.closing_line || messaging.closingLine || "";
  const toneVariants =
    messaging.tone_variants || messaging.toneVariants || ["Formal", "Casual"];

  return {
    AGENT_NAME: clinic.agent_name || `${clinic.name || "Clinic"} Receptionist`,
    ORG_LEGAL_NAME: clinic.legal_name || clinic.name || "Your Clinic",
    BRAND_NAME: clinic.brand_name || clinic.name || "Your Clinic",
    ORG_TIMEZONE: timezone,
    HOURS_SUMMARY: summarizeHours(locations),
    DEFAULT_SLOT_MINUTES: defaultSlotMinutes,
    CURRENT_YEAR: new Date().getFullYear(),
    SUPPORTED_LANGUAGES: safeJoin(DEFAULT_LANGUAGES),
    DEFAULT_LANGUAGE: DEFAULT_LANGUAGE,
    PRIVACY_MODE: privacyLabel,
    PII_POLICY_URL: policies.privacy_policy_url || policies.privacyPolicyUrl || "Not provided",
    OPT_OUT_SENSITIVE_DATA_STORAGE: optOut ? "true" : "false",
    INSURANCE_RULES_SUMMARY: formatPlans(insurance),
    SERVICE_PRICING_TABLE: formatPricingTable([...services, ...addOns]),
    HOURS_MACHINE_RULES: machineHours(locations, timezone),
    HOLIDAYS: formatHolidays(locations),
    ALT_SLOTS_COUNT: 3,
    SUPPORTED_INSURANCE_LIST: supportedInsurance,
    PAYMENT_METHODS: paymentMethods,
    CANCEL_RESCHEDULE_POLICY: reschedulePolicy,
    LATE_FEE: lateFee,
    NEW_PATIENT_INTAKE_INFO:
      policies.new_patient_intake ||
      policies.newPatientIntake ||
      "Please arrive 10 minutes early with photo ID and insurance card.",
    CONFIRMATION_CHANNELS: formatConfirmationChannels(policies),
    EMERGENCY_SCRIPT:
      policies.emergency_script ||
      policies.emergencyScript ||
      "If this is a medical emergency, please hang up and dial 911.",
    ESCALATION_CONTACTS:
      policies.escalation_contacts ||
      policies.escalationContacts ||
      `Contact the front desk at ${clinic.phone || "the clinic phone number"}.`,
    CALLBACK_POLICY:
      policies.callback_policy ||
      policies.callbackPolicy ||
      "Collect name, phone number, and best call-back time; a staff member will follow up within one business day.",
    HOURS_MACHINE_RULES_HUMAN: summarizeHours(locations),
    SERVICE_SUMMARY: services.length
      ? services.map((service) => service.name).filter(Boolean).join(", ")
      : "General services",
    GREETING_LINE: greeting,
    CLOSING_LINE: closing,
    TONE_VARIANTS: safeJoin(toneVariants),
    PAYMENT_NOTES:
      typeof insurance.notes?.financingDetails === "string"
        ? insurance.notes.financingDetails
        : "",
  };
};

const renderTemplate = (template, context) =>
  template.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(context, key)
      ? `${context[key]}`
      : "Not provided",
  );

export { buildPromptContext, renderTemplate };

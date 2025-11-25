import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Building2,
  Users,
  Stethoscope,
  FileText,
  ShieldCheck,
  MessageCircle,
  CalendarDays,
  CalendarCheck2,
  Mic2,
  Sparkles,
  Wand2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  useGetVoicesQuery,
  usePlayVoiceMutation,
} from "../features/api/retellApi";
import {
  useGetClinicOnboardingQuery,
  useSaveLocationsMutation,
  useSaveProvidersMutation,
  useSaveServicesMutation,
  useSaveAddOnsMutation,
  useSaveInsuranceMutation,
  useSavePoliciesMutation,
  useSaveMessagingMutation,
  useSelectVoiceMutation,
  useSetSectionCompletionMutation,
  useFinishOnboardingMutation,
  useGetGoogleCalendarStatusQuery,
  useLazyGetGoogleCalendarStatusQuery,
} from "../features/api/appApi";
import SectionCard from "../components/onboarding/SectionCard";
import { IconButton } from "../components/onboarding/FormControls";
import LocationsSection from "../components/onboarding/sections/LocationsSection";
import ProvidersSection from "../components/onboarding/sections/ProvidersSection";
import ServicesSection from "../components/onboarding/sections/ServicesSection";
import InsuranceSection from "../components/onboarding/sections/InsuranceSection";
import PoliciesSection from "../components/onboarding/sections/PoliciesSection";
import MessagingSection from "../components/onboarding/sections/MessagingSection";
import VoicesSection from "../components/onboarding/sections/VoicesSection";
import { useSelector } from "react-redux";
import { selectAuth } from "../features/auth/authSlice";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const paymentOptions = [
  "Cash",
  "Credit / Debit Card",
  "ACH / Bank Transfer",
  "Digital Wallet",
  "Checks",
  "Financing",
];

const toneOptions = ["Formal", "Casual", "Friendly", "Concise"];

const createDefaultHours = () =>
  daysOfWeek.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { open: "", close: "", closed: false },
    }),
    {},
  );

const createEmptyLocation = () => ({
  id: `${Date.now()}-${Math.random()}`,
  label: "",
  timezone: "",
  phone: "",
  website: "",
  directionsUrl: "",
  defaultSlotLength: "30",
  allowSameDay: true,
  reschedulePolicy: "",
  lateFeePolicy: "",
  bookableWindow: "",
  holidaysNotes: "",
  hours: createDefaultHours(),
});

const createEmptyProvider = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  title: "",
  specialties: "",
  services: "",
  scheduleNotes: "",
});

const createEmptyService = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  description: "",
  duration: "",
  price: "",
  requiresEvaluation: false,
  requiresDeposit: false,
  isMaintenance: false,
});

const createEmptyAddOn = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  description: "",
  price: "",
});

const createEmptyPlan = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  coverages: [
    {
      id: `${Date.now()}-${Math.random()}`,
      service: "",
      coverageDetail: "",
    },
  ],
});

const AgentSettings = () => {
  const { token } = useSelector(selectAuth);
  const clinicId = useMemo(() => {
    if (!token) {
      return null;
    }
    try {
      const decoded = jwtDecode(token);
      return decoded?.clinic_id ?? decoded?.orgId ?? null;
    } catch (error) {
      console.error("Failed to decode auth token", error);
      return null;
    }
  }, [token]);

  const [locations, setLocations] = useState([createEmptyLocation()]);
  const [providers, setProviders] = useState([
    createEmptyProvider(),
  ]);
  const [services, setServices] = useState([createEmptyService()]);
  const [addOns, setAddOns] = useState([]);
  const [unsupportedServices, setUnsupportedServices] = useState("");
  const [plans, setPlans] = useState([createEmptyPlan()]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(
    new Set(["Cash", "Credit / Debit Card"]),
  );
  const [financingDetails, setFinancingDetails] = useState("");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [emergencyScript, setEmergencyScript] = useState("");
  const [consentText, setConsentText] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState({
    sms: true,
    whatsapp: false,
    email: true,
  });
  const [greetingLine, setGreetingLine] = useState("");
  const [closingLine, setClosingLine] = useState("");
  const [toneVariants, setToneVariants] = useState(["Formal", "Casual"]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [voiceSelectionError, setVoiceSelectionError] = useState("");
  const [playingVoices, setPlayingVoices] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializedRef = useRef(false);
  const locationsStateRef = useRef(locations);
  const providersStateRef = useRef(providers);
  const servicesStateRef = useRef(services);
  const addOnsStateRef = useRef(addOns);
  const plansStateRef = useRef(plans);
  const paymentMethodsRef = useRef(selectedPaymentMethods);
  const financingDetailsRef = useRef(financingDetails);
  const emergencyScriptRef = useRef(emergencyScript);
  const consentTextRef = useRef(consentText);
  const privacyPolicyUrlRef = useRef(privacyPolicyUrl);
  const privacyModeRef = useRef(privacyMode);
  const notificationPrefsRef = useRef(notificationPrefs);
  const greetingLineRef = useRef(greetingLine);
  const closingLineRef = useRef(closingLine);
  const toneVariantsRef = useRef(toneVariants);
  const selectedVoiceIdRef = useRef(selectedVoiceId);
  const saveTimersRef = useRef({});
  const {
    data: voicesData,
    isLoading: voicesLoading,
    isError: voicesError,
  } = useGetVoicesQuery();
  const [playVoice] = usePlayVoiceMutation();
  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    error: onboardingError,
  } =
    useGetClinicOnboardingQuery(clinicId, {
      skip: !clinicId,
    });
  const [saveLocations] = useSaveLocationsMutation();
  const [saveProviders] = useSaveProvidersMutation();
  const [saveServices] = useSaveServicesMutation();
  const [saveAddOns] = useSaveAddOnsMutation();
  const [saveInsurance] = useSaveInsuranceMutation();
  const [savePoliciesMutation] = useSavePoliciesMutation();
  const [saveMessagingMutation] = useSaveMessagingMutation();
  const [selectVoiceMutation] = useSelectVoiceMutation();
  const [setSectionCompletion] = useSetSectionCompletionMutation();
  const [finishOnboardingTrigger, { isLoading: isFinishing }] =
    useFinishOnboardingMutation();
  const {
    data: googleCalendarStatus,
    isFetching: isGoogleStatusFetching,
    isLoading: isGoogleStatusLoading,
  } = useGetGoogleCalendarStatusQuery(clinicId, { skip: !clinicId });
  const [
    triggerGoogleStatus,
    { isFetching: isTriggeringGoogleStatus },
  ] = useLazyGetGoogleCalendarStatusQuery();

  const googleConnected = Boolean(googleCalendarStatus?.connected);
  const googleConfigMissing = googleCalendarStatus?.oauth_configured === false;
  const isGoogleStatusPending = isGoogleStatusFetching || isGoogleStatusLoading;
  const googleActionLoading = isTriggeringGoogleStatus;
  const connectButtonLabel = googleActionLoading
    ? "Working..."
    : googleConnected
      ? "Reconnect Google"
      : "Connect Google";
  const refreshButtonLabel = googleActionLoading ? "Checking..." : "Refresh status";
  const voices = voicesData ?? [];
  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voice_id === selectedVoiceId) ?? null,
    [voices, selectedVoiceId],
  );


  useEffect(() => {
    locationsStateRef.current = locations;
  }, [locations]);

  useEffect(() => {
    providersStateRef.current = providers;
  }, [providers]);

  useEffect(() => {
    servicesStateRef.current = services;
  }, [services]);

  useEffect(() => {
    addOnsStateRef.current = addOns;
  }, [addOns]);

  useEffect(() => {
    plansStateRef.current = plans;
  }, [plans]);

  useEffect(() => {
    paymentMethodsRef.current = selectedPaymentMethods;
  }, [selectedPaymentMethods]);

  useEffect(() => {
    financingDetailsRef.current = financingDetails;
  }, [financingDetails]);

  useEffect(() => {
    emergencyScriptRef.current = emergencyScript;
  }, [emergencyScript]);

  useEffect(() => {
    consentTextRef.current = consentText;
  }, [consentText]);

  useEffect(() => {
    privacyPolicyUrlRef.current = privacyPolicyUrl;
  }, [privacyPolicyUrl]);

  useEffect(() => {
    privacyModeRef.current = privacyMode;
  }, [privacyMode]);

  useEffect(() => {
    notificationPrefsRef.current = notificationPrefs;
  }, [notificationPrefs]);

  useEffect(() => {
    greetingLineRef.current = greetingLine;
  }, [greetingLine]);

  useEffect(() => {
    closingLineRef.current = closingLine;
  }, [closingLine]);

  useEffect(() => {
    toneVariantsRef.current = toneVariants;
  }, [toneVariants]);

  useEffect(() => {
    selectedVoiceIdRef.current = selectedVoiceId;
  }, [selectedVoiceId]);

  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

useEffect(() => () => {
  Object.values(saveTimersRef.current).forEach((timer) => clearTimeout(timer));
}, []);


  useEffect(() => {
    setIsInitialized(false);
  }, [clinicId]);

  useEffect(() => {
    if (!onboardingError) {
      return;
    }
    const message =
      onboardingError?.data?.error ||
      onboardingError?.error ||
      onboardingError?.message ||
      "Failed to load onboarding data.";
    toast.error(message);
  }, [onboardingError]);

  useEffect(() => {
    if (!onboardingData || isInitialized) {
      return;
    }

    const withId = (item) => ({
      ...item,
      id: item?.id ?? `${Date.now()}-${Math.random()}`,
    });

    const normalizedLocations =
      onboardingData.locations && onboardingData.locations.length
        ? onboardingData.locations.map((location) => ({
            ...location,
            id: location?.id ?? `${Date.now()}-${Math.random()}`,
            hours: location?.hours ?? createDefaultHours(),
          }))
        : [createEmptyLocation()];

    const normalizedProviders =
      onboardingData.providers && onboardingData.providers.length
        ? onboardingData.providers.map(withId)
        : [createEmptyProvider()];

    const normalizedServices =
      onboardingData.services && onboardingData.services.length
        ? onboardingData.services.map(withId)
        : [createEmptyService()];

    const normalizedAddOns =
      onboardingData.addOns && onboardingData.addOns.length
        ? onboardingData.addOns.map(withId)
        : [];

    const insurancePlansRaw =
      onboardingData.insurance?.plans && onboardingData.insurance.plans.length
        ? onboardingData.insurance.plans
        : [createEmptyPlan()];

    const normalizedPlans = insurancePlansRaw.map((plan) => ({
      ...plan,
      id: plan?.id ?? `${Date.now()}-${Math.random()}`,
      coverages: Array.isArray(plan?.coverages)
        ? plan.coverages.map((coverage) => ({
            ...coverage,
            id: coverage?.id ?? `${Date.now()}-${Math.random()}`,
          }))
        : plan?.coverages ?? [],
    }));

    const insuranceNotes = onboardingData.insurance?.notes;
    const paymentMethodsFromNotes = Array.isArray(
      insuranceNotes?.paymentMethods,
    )
      ? insuranceNotes.paymentMethods
      : Array.isArray(insuranceNotes)
        ? insuranceNotes
        : null;

    const policies = onboardingData.policies ?? {};
    const messaging = onboardingData.messaging ?? {};

    setLocations(normalizedLocations);
    setProviders(normalizedProviders);
    setServices(normalizedServices);
    setAddOns(normalizedAddOns);
    setPlans(normalizedPlans);
    if (typeof onboardingData.unsupported_services === "string") {
      setUnsupportedServices(onboardingData.unsupported_services);
    } else if (typeof onboardingData.unsupportedServices === "string") {
      setUnsupportedServices(onboardingData.unsupportedServices);
    }

    if (paymentMethodsFromNotes) {
      setSelectedPaymentMethods(new Set(paymentMethodsFromNotes));
    }

    if (typeof insuranceNotes?.financingDetails === "string") {
      setFinancingDetails(insuranceNotes.financingDetails);
    } else if (typeof insuranceNotes === "string") {
      setFinancingDetails(insuranceNotes);
    }

    setPrivacyMode(
      policies.privacy_mode ??
        policies.allow_personal_data ??
        policies.privacyMode ??
        true,
    );
    setPrivacyPolicyUrl(
      policies.privacy_policy_url ?? policies.privacyPolicyUrl ?? "",
    );
    setEmergencyScript(
      policies.emergency_script ?? policies.emergencyScript ?? "",
    );
    setConsentText(policies.consent_text ?? policies.consentText ?? "");
    setNotificationPrefs({
      sms: Boolean(policies.notify_sms ?? policies.notifySms ?? true),
      whatsapp: Boolean(
        policies.notify_whatsapp ?? policies.notifyWhatsapp ?? false,
      ),
      email: Boolean(policies.notify_email ?? policies.notifyEmail ?? true),
    });

    setGreetingLine(messaging.greeting_line ?? messaging.greetingLine ?? "");
    setClosingLine(messaging.closing_line ?? messaging.closingLine ?? "");
    setToneVariants(
      Array.isArray(messaging.tone_variants ?? messaging.toneVariants)
        ? messaging.tone_variants ?? messaging.toneVariants
        : ["Formal", "Casual"],
    );

    if (onboardingData.selected_voice_id) {
      setSelectedVoiceId(onboardingData.selected_voice_id);
    }

    if (
      Array.isArray(onboardingData.completed_sections) &&
      onboardingData.completed_sections.length
    ) {
      setCompletedSections(new Set(onboardingData.completed_sections));
    }

    setIsInitialized(true);
  }, [onboardingData, isInitialized]);

  const onboardingSteps = useMemo(
    () => [
      {
        id: "locations",
        title: "Locations & contact",
        summary: "Phones, routing URLs, timezone, and booking windows.",
        icon: Building2,
      },
      {
        id: "providers",
        title: "Providers",
        summary: "Names, specialties, and the services each person performs.",
        icon: Users,
      },
      {
        id: "services",
        title: "Services",
        summary: "Catalog details, add-ons, and exclusions the AI should know.",
        icon: Stethoscope,
      },
      {
        id: "insurance",
        title: "Insurance & payments",
        summary: "Coverage guidance, payment methods, and financing options.",
        icon: ShieldCheck,
      },
      {
        id: "policies",
        title: "Policies & legal",
        summary: "Emergency language, consent, and confirmation preferences.",
        icon: FileText,
      },
      {
        id: "messaging",
        title: "Messaging & tone",
        summary: "Teach the assistant how to greet, close, and sound on-brand.",
        icon: MessageCircle,
      },
      {
        id: "voices",
        title: "Voice & persona",
        summary: "Select the AI voice, preview samples, and match your brand.",
        icon: Mic2,
      },
    ],
    [],
  );

  const totalSteps = onboardingSteps.length;
  const stepIndexMap = useMemo(() => {
    const map = {};
    onboardingSteps.forEach((step, index) => {
      map[step.id] = index;
    });
    return map;
  }, [onboardingSteps]);
  const [activeSection, setActiveSection] = useState(
    onboardingSteps[0]?.id ?? "",
  );
  const [completedSections, setCompletedSections] = useState(() => new Set());

  const locationsRef = useRef(null);
  const providersRef = useRef(null);
  const servicesRef = useRef(null);
  const insuranceRef = useRef(null);
  const policiesRef = useRef(null);
  const messagingRef = useRef(null);
  const voicesRef = useRef(null);

  const persistSectionData = useCallback(
    async (sectionId) => {
      if (!clinicId) {
        return;
      }

      switch (sectionId) {
        case "locations":
          await saveLocations({
            clinicId,
            locations: locationsStateRef.current,
          }).unwrap();
          break;
        case "providers":
          await saveProviders({
            clinicId,
            providers: providersStateRef.current,
          }).unwrap();
          break;
        case "services":
          await saveServices({
            clinicId,
            services: servicesStateRef.current,
          }).unwrap();
          await saveAddOns({
            clinicId,
            addOns: addOnsStateRef.current,
          }).unwrap();
          break;
        case "insurance": {
          const insurancePayload = {
            plans: plansStateRef.current,
            notes: {
              paymentMethods: Array.from(paymentMethodsRef.current),
              financingDetails: financingDetailsRef.current,
            },
          };
          await saveInsurance({
            clinicId,
            insurance: insurancePayload,
          }).unwrap();
          break;
        }
        case "policies": {
          const policiesPayload = {
            emergency_script: emergencyScriptRef.current,
            consent_text: consentTextRef.current,
            privacy_policy_url: privacyPolicyUrlRef.current,
            privacy_mode: privacyModeRef.current,
            allow_personal_data: privacyModeRef.current,
            notification_prefs: notificationPrefsRef.current,
          };
          await savePoliciesMutation({
            clinicId,
            policies: policiesPayload,
          }).unwrap();
          break;
        }
        case "messaging": {
          const messagingPayload = {
            greeting_line: greetingLineRef.current,
            closing_line: closingLineRef.current,
            tone_variants: toneVariantsRef.current,
          };
          await saveMessagingMutation({
            clinicId,
            messaging: messagingPayload,
          }).unwrap();
          break;
        }
        case "voices": {
          const voiceId = selectedVoiceIdRef.current;
          if (!voiceId) {
            throw new Error("Select a voice before marking complete.");
          }
          await selectVoiceMutation({
            clinicId,
            voice_id: voiceId,
          }).unwrap();
          break;
        }
        default:
          break;
      }
    },
    [
      clinicId,
      saveAddOns,
      saveInsurance,
      saveLocations,
      saveMessagingMutation,
      savePoliciesMutation,
      saveProviders,
      saveServices,
      selectVoiceMutation,
    ],
  );

  const scheduleAutoSave = useCallback(
    (sectionId) => {
      if (!clinicId || !isInitializedRef.current) return;
      const timers = saveTimersRef.current;
      if (timers[sectionId]) {
        clearTimeout(timers[sectionId]);
      }
      timers[sectionId] = setTimeout(() => {
        persistSectionData(sectionId).catch((error) => {
          console.error(`auto-save failed for ${sectionId}:`, error);
        });
      }, 800);
    },
    [clinicId, persistSectionData],
  );

  useEffect(() => {
    scheduleAutoSave("locations");
  }, [locations, scheduleAutoSave]);

  useEffect(() => {
    scheduleAutoSave("providers");
  }, [providers, scheduleAutoSave]);

  useEffect(() => {
    scheduleAutoSave("services");
  }, [services, addOns, scheduleAutoSave]);

  useEffect(() => {
    scheduleAutoSave("insurance");
  }, [plans, selectedPaymentMethods, financingDetails, scheduleAutoSave]);

  useEffect(() => {
    scheduleAutoSave("policies");
  }, [emergencyScript, consentText, privacyPolicyUrl, privacyMode, notificationPrefs, scheduleAutoSave]);

  useEffect(() => {
    scheduleAutoSave("messaging");
  }, [greetingLine, closingLine, toneVariants, scheduleAutoSave]);

  useEffect(() => {
    if (!selectedVoiceId) return;
    scheduleAutoSave("voices");
  }, [selectedVoiceId, scheduleAutoSave]);

  const updateLocation = useCallback((id, nextLocation) => {
    setLocations((prev) =>
      prev.map((location) => (location.id === id ? nextLocation : location)),
    );
  }, []);

  const addLocation = useCallback(() => {
    setLocations((prev) => [...prev, createEmptyLocation()]);
  }, []);

  const removeLocation = useCallback((id) => {
    setLocations((prev) => prev.filter((location) => location.id !== id));
  }, []);

  const updateProvider = useCallback((id, nextProvider) => {
    setProviders((prev) =>
      prev.map((provider) => (provider.id === id ? nextProvider : provider)),
    );
  }, []);

  const addProvider = useCallback(() => {
    setProviders((prev) => [...prev, createEmptyProvider()]);
  }, []);

  const removeProvider = useCallback((id) => {
    setProviders((prev) => prev.filter((provider) => provider.id !== id));
  }, []);

  const updateService = useCallback((id, nextService) => {
    setServices((prev) =>
      prev.map((service) => (service.id === id ? nextService : service)),
    );
  }, []);

  const addService = useCallback(() => {
    setServices((prev) => [...prev, createEmptyService()]);
  }, []);

  const removeService = useCallback((id) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  }, []);

  const addAddOn = useCallback(() => {
    setAddOns((prev) => [...prev, createEmptyAddOn()]);
  }, []);

  const updateAddOn = useCallback((id, nextAddOn) => {
    setAddOns((prev) =>
      prev.map((addOn) => (addOn.id === id ? nextAddOn : addOn)),
    );
  }, []);

  const removeAddOn = useCallback((id) => {
    setAddOns((prev) => prev.filter((addOn) => addOn.id !== id));
  }, []);

  const addPlan = useCallback(() => {
    setPlans((prev) => [...prev, createEmptyPlan()]);
  }, []);

  const removePlan = useCallback((id) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id));
  }, []);

  const togglePaymentMethod = useCallback((method) => {
    setSelectedPaymentMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
      } else {
        next.add(method);
      }
      return next;
    });
  }, []);

  const toggleNotification = useCallback((channel) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  }, []);

  const toggleTone = useCallback((tone) => {
    setToneVariants((prev) =>
      prev.includes(tone)
        ? prev.filter((variant) => variant !== tone)
        : [...prev, tone],
    );
  }, []);

  const handleSelectVoice = useCallback(
    async (voiceId) => {
      setSelectedVoiceId(voiceId);
      selectedVoiceIdRef.current = voiceId;
      setVoiceSelectionError("");
      if (!clinicId) {
        return;
      }
      try {
        await selectVoiceMutation({ clinicId, voice_id: voiceId }).unwrap();
        await setSectionCompletion({
          clinicId,
          section: "voices",
          completed: true,
        }).unwrap();
        setCompletedSections((prev) => {
          const next = new Set(prev);
          next.add("voices");
          return next;
        });
      } catch (error) {
        const message =
          error?.data?.error ||
          error?.error ||
          error?.message ||
          "Unable to save voice selection.";
        toast.error(message);
      }
    },
    [clinicId, selectVoiceMutation, setSectionCompletion],
  );

  const handlePreviewVoice = useCallback(
    async (voice) => {
      if (!voice?.voice_id || playingVoices[voice.voice_id]) {
        return;
      }

      try {
        setPlayingVoices((prev) => ({
          ...prev,
          [voice.voice_id]: true,
        }));

        const response = await playVoice({
          voice_id: voice.voice_id,
          text: "Hello! This is how I sound when greeting callers.",
          mode: "convert",
        });

        const blob = response?.data;
        if (blob instanceof Blob) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setPlayingVoices((prev) => {
              const next = { ...prev };
              delete next[voice.voice_id];
              return next;
            });
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
          };
          await audio.play();
        }
      } catch (error) {
        console.error("Failed to play voice preview", error);
      } finally {
        setPlayingVoices((prev) => {
          const next = { ...prev };
          delete next[voice.voice_id];
          return next;
        });
      }
    },
    [playVoice, playingVoices],
  );

  const scrollToSection = useCallback((id) => {
    const refMap = {
      locations: locationsRef,
      providers: providersRef,
      services: servicesRef,
      insurance: insuranceRef,
      policies: policiesRef,
      messaging: messagingRef,
      voices: voicesRef,
    };
    const ref = refMap[id];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sectionStatus = (id) => {
    if (completedSections.has(id)) {
      return "complete";
    }
    if (activeSection === id) {
      return "active";
    }
    return "upcoming";
  };

  const getStepNumber = (id) => (stepIndexMap[id] ?? 0) + 1;

  const handleStepClick = useCallback((id) => {
    setActiveSection(id);
    setTimeout(() => scrollToSection(id), 60);
  }, [scrollToSection]);

  const handleLoadTestData = useCallback(() => {
    const sampleHours = daysOfWeek.reduce((acc, day) => {
      acc[day] = { open: "09:00", close: "17:00", closed: day === "Sunday" };
      return acc;
    }, {});

    setLocations([
      {
        id: `${Date.now()}-sample-location`,
        label: "Downtown Clinic",
        timezone: "America/New_York",
        phone: "(555) 123-4567",
        website: "https://exampleclinic.com",
        directionsUrl: "https://maps.example.com/downtown",
        allowSameDay: true,
        defaultSlotLength: "30",
        reschedulePolicy:
          "Please cancel or reschedule at least 24 hours in advance to avoid fees.",
        lateFeePolicy: "$35 late cancellation fee applied inside 24 hours.",
        bookableWindow: "Today through 60 days out",
        holidaysNotes: "Closed on major US holidays",
        hours: sampleHours,
      },
    ]);

    setProviders([
      {
        id: `${Date.now()}-provider-1`,
        name: "Dr. Nina Patel",
        title: "Medical Director, MD",
        specialties: "Primary care, preventive medicine",
        services: "Annual exams, chronic care follow-ups, telehealth visits",
        scheduleNotes: "Telehealth on Wednesdays, in-clinic Mon/Tue/Thu",
      },
    ]);

    setServices([
      {
        id: `${Date.now()}-service-1`,
        name: "Comprehensive Physical",
        description: "Annual preventive exam with labs as needed.",
        duration: "45",
        price: "180",
        requiresEvaluation: false,
        requiresDeposit: false,
        isMaintenance: false,
      },
      {
        id: `${Date.now()}-service-2`,
        name: "Telehealth Follow-up",
        description: "Virtual follow-up for established patients.",
        duration: "30",
        price: "120",
        requiresEvaluation: false,
        requiresDeposit: false,
        isMaintenance: true,
      },
    ]);

    setAddOns([
      {
        id: `${Date.now()}-addon-1`,
        name: "Lab Panel",
        description: "Comprehensive metabolic and lipid panel.",
        price: "65",
      },
    ]);

    setUnsupportedServices(
      "We do not manage obstetrics, emergency care, or cosmetic procedures.",
    );

    setPlans([
      {
        id: `${Date.now()}-plan-1`,
        name: "Aetna Gold PPO",
        coverages: [
          {
            id: `${Date.now()}-coverage-1`,
            service: "Comprehensive Physical",
            coverageDetail: "100% covered once per year",
          },
          {
            id: `${Date.now()}-coverage-2`,
            service: "Telehealth Follow-up",
            coverageDetail: "80% covered after deductible",
          },
        ],
      },
    ]);

    setSelectedPaymentMethods(new Set(["Cash", "Credit / Debit Card", "Financing"]));
    setFinancingDetails("Flexible financing available through CareCredit partners.");

    setEmergencyScript("If this is a medical emergency, hang up and dial 911.");
    setPrivacyMode(true);
    setPrivacyPolicyUrl("https://exampleclinic.com/privacy");
    setConsentText(
      "By leaving a voicemail or providing information, you consent to us contacting you regarding care.",
    );
    setNotificationPrefs({ sms: true, email: true, whatsapp: false });

    setGreetingLine("Thank you for calling Example Clinic, this is your virtual receptionist.");
    setClosingLine("It was a pleasure assisting you today. Stay well!");
    setToneVariants(["Friendly", "Concise"]);

    const defaultVoiceId = voices[0]?.voice_id || "";
    setSelectedVoiceId(defaultVoiceId);
    if (!defaultVoiceId) {
      setVoiceSelectionError("Select a voice before publishing.");
    } else {
      setVoiceSelectionError("");
    }

    setCompletedSections(new Set());
    toast.success("Sample data loaded. Adjust anything you like and publish when ready.");
  }, [voices]);
  const handleMarkComplete = useCallback(
    async (id) => {
      if (clinicId) {
        try {
          await persistSectionData(id);
          await setSectionCompletion({
            clinicId,
            section: id,
            completed: true,
          }).unwrap();
        } catch (error) {
          const message =
            error?.data?.error ||
            error?.error ||
            error?.message ||
            "Unable to update onboarding progress.";
          toast.error(message);
          return;
        }
      }

      setCompletedSections((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      const currentIndex = stepIndexMap[id] ?? 0;
      const nextStep = onboardingSteps[currentIndex + 1];
      if (nextStep) {
        setActiveSection(nextStep.id);
        setTimeout(() => scrollToSection(nextStep.id), 120);
      }
    },
  [
    clinicId,
    onboardingSteps,
    persistSectionData,
    scrollToSection,
    setSectionCompletion,
    stepIndexMap,
  ],
);

  const handleFinishOnboarding = useCallback(async () => {
    if (!clinicId) {
      toast.error("Unable to determine clinic. Please sign in again.");
      return;
    }

    if (!selectedVoiceIdRef.current) {
      toast.error("Select a voice before publishing your agent.");
      handleStepClick("voices");
      return;
    }

    try {
      await persistSectionData(activeSection);
      const response = await finishOnboardingTrigger({ clinicId }).unwrap();
      setCompletedSections((prev) => {
        const next = new Set(prev);
        next.add("finish");
        return next;
      });
      toast.success(
        response?.agent_id
          ? "Your reception agent is ready to take calls!"
          : "Onboarding finished successfully.",
      );
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.error ||
        error?.message ||
        "Unable to finish onboarding. Please review the sections and try again.";
      toast.error(message);
    }
  }, [activeSection, clinicId, finishOnboardingTrigger, handleStepClick, persistSectionData]);

  const handleGoogleConnect = useCallback(async () => {
    if (!clinicId) {
      toast.error("Missing clinic identifier. Please sign in again.");
      return;
    }

    let status = googleCalendarStatus;
    if (!status || !status.connect_url) {
      try {
        status = await triggerGoogleStatus(clinicId).unwrap();
      } catch (error) {
        const message =
          error?.data?.error ||
          error?.error ||
          error?.message ||
          "Unable to generate Google authorization link.";
        toast.error(message);
        return;
      }
    }

    if (!status) {
      toast.error("Unable to load Google Calendar status.");
      return;
    }

    if (status.oauth_configured === false) {
      toast.error("Google OAuth client is not configured on the server.");
      return;
    }

    if (!status.connect_url) {
      toast.error("Google authorization URL is unavailable. Try again shortly.");
      return;
    }

    window.open(status.connect_url, "_blank", "noopener,noreferrer");
  }, [clinicId, googleCalendarStatus, triggerGoogleStatus]);

  const handleRefreshGoogleStatus = useCallback(async () => {
    if (!clinicId) {
      toast.error("Missing clinic identifier. Please sign in again.");
      return;
    }

    try {
      const status = await triggerGoogleStatus(clinicId).unwrap();
      if (status?.oauth_configured === false) {
        toast.error("Google OAuth client is not configured on the server.");
        return;
      }
      if (status?.connected) {
        toast.success("Google Calendar connection confirmed.");
      } else {
        toast.info("Waiting for Google authorization. Complete the consent flow and refresh.");
      }
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.error ||
        error?.message ||
        "Failed to refresh Google Calendar status.";
      toast.error(message);
    }
  }, [clinicId, triggerGoogleStatus]);

  const handleVoicesComplete = useCallback(async () => {
    if (!selectedVoiceIdRef.current) {
      setVoiceSelectionError("Select a voice before marking this section complete.");
      return;
    }
    await handleMarkComplete("voices");
  }, [handleMarkComplete]);

  const completedCount = completedSections.size;
  const progress = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;
  const upcomingStep = onboardingSteps.find(
    (step) => !completedSections.has(step.id),
  );
  const nextStepTitle = upcomingStep?.title ?? "Data quality review";
  const nextStepSummary =
    upcomingStep?.summary ??
    "Preview answers and launch your concierge once everything looks right.";

  const agentReady = completedSections.has("finish");
  const voiceLabel = selectedVoice?.name ?? "No voice selected";
  const voiceLocale = selectedVoiceId
    ? selectedVoice?.language ?? "Language not provided"
    : "Select a voice to publish";
  const formatTimestamp = useCallback((iso) => {
    if (!iso) return "Not published yet";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "Not published yet";
    }
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);
  const lastPublishedLabel = formatTimestamp(onboardingData?.updated_at);
  const stepsRemaining = Math.max(totalSteps - completedCount, 0);

  if (onboardingLoading && !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-white to-background-hover/80">
        <div className="flex h-72 items-center justify-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm font-medium">Loading receptionist settings....</span>
                  </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-background-hover/80 pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="relative overflow-hidden rounded-3xl border border-background-hover bg-white px-8 pb-10 pt-12 text-textcolor shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-dark">
                  Agent Settings
                </span>
                <h1 className="text-3xl font-semibold text-primary-dark lg:text-4xl">
                  Manage your AI receptionist
                </h1>
                <p className="max-w-2xl text-sm text-textcolor-secondary">
                  Update locations, policies, messaging, and voice. Publish whenever you&apos;re ready to push changes to the live agent.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <IconButton
                  label="Load test data"
                  icon={Wand2}
                  variant="ghost"
                  onClick={handleLoadTestData}
                  disabled={isFinishing}
                />
                <IconButton
                  label={isFinishing ? "Publishing..." : "Finish & create agent"}
                  icon={Sparkles}
                  variant="solid"
                  onClick={handleFinishOnboarding}
                  disabled={isFinishing || !selectedVoiceId}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-accent/30 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <CalendarCheck2
                    className={`h-4 w-4 ${
                      googleConnected ? "text-success-dark" : "text-textcolor-muted"
                    }`}
                  />
                  <span className="font-semibold text-primary-dark">
                    {googleConnected ? "Google Calendar connected" : "Google Calendar not connected"}
                  </span>
                  {!isGoogleStatusPending && googleCalendarStatus?.google_calendar_id && (
                    <span className="text-xs text-textcolor-secondary">
                      Calendar: {googleCalendarStatus.google_calendar_id}
                    </span>
                  )}
                  {googleConfigMissing && (
                    <span className="text-xs font-medium text-red-500">
                      Google OAuth client needs configuration.
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleConnect}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-dark transition hover:bg-accent/20 disabled:opacity-60"
                    disabled={googleActionLoading || googleConfigMissing}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {connectButtonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleRefreshGoogleStatus}
                    className="inline-flex items-center gap-2 rounded-full border border-background-hover px-4 py-2 text-xs font-semibold text-primary-dark transition hover:border-accent/30 hover:text-accent-dark disabled:opacity-60"
                    disabled={googleActionLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {refreshButtonLabel}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-background-hover bg-white/85 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-textcolor-muted">
                  Agent status
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  {agentReady ? (
                    <CheckCircle2 className="h-5 w-5 text-success-dark" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-accent-dark" />
                  )}
                  <span className={agentReady ? "text-success-dark" : "text-accent-dark"}>
                    {agentReady ? "Live with latest data" : "Draft – publish to sync"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-textcolor-secondary">
                  Last publish: {lastPublishedLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-background-hover bg-white/85 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-textcolor-muted">
                  Voice selection
                </p>
                <p className="mt-3 text-sm font-semibold text-primary-dark">
                  {voiceLabel}
                </p>
                <p className="text-xs text-textcolor-secondary">{voiceLocale}</p>
                <button
                  type="button"
                  onClick={() => handleStepClick("voices")}
                  className="mt-3 text-xs font-semibold text-accent-dark underline-offset-2 transition hover:underline"
                >
                  Update voice
                </button>
              </div>

              <div className="rounded-2xl border border-background-hover bg-white/85 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-textcolor-muted">
                  Completion
                </p>
                <div className="mt-3 text-3xl font-semibold text-primary-dark">
                  {completedCount} / {totalSteps}
                </div>
                <div className="mt-3 h-2.5 w-full rounded-full bg-background-hover">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent via-accent-dark to-primary-dark transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-textcolor-secondary">
                  {stepsRemaining > 0
                    ? `${stepsRemaining} steps remaining`
                    : "All sections captured"}
                </p>
              </div>

              <div className="rounded-2xl border border-background-hover bg-white/85 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-textcolor-muted">
                  Next step
                </p>
                <p className="mt-3 text-sm font-semibold text-primary-dark">
                  {nextStepTitle}
                </p>
                <p className="mt-2 text-xs text-textcolor-secondary">
                  {nextStepSummary}
                </p>
                <button
                  type="button"
                  onClick={() => upcomingStep && handleStepClick(upcomingStep.id)}
                  className="mt-3 text-xs font-semibold text-accent-dark underline-offset-2 transition hover:underline"
                  disabled={!upcomingStep}
                >
                  Jump to step
                </button>
              </div>
            </div>
          </div>
        </div>
        <nav className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {onboardingSteps.map((step, index) => {
            const status = sectionStatus(step.id);
            const Icon = step.icon;
            const isActive = status === "active";
            const isComplete = status === "complete";
            const buttonClasses = isActive
              ? "border-accent/40 bg-white text-primary-dark shadow-lg shadow-accent/20"
              : isComplete
                ? "border-success/30 bg-white text-success-dark shadow-md shadow-success/20"
                : "border-background-hover bg-white/70 text-textcolor-secondary transition hover:border-accent/30 hover:text-primary-dark";
            const numberClasses = isActive
              ? "border-accent/40 bg-accent/10 text-accent-dark"
              : isComplete
                ? "border-success/40 bg-success/10 text-success-dark"
                : "border-background-hover text-textcolor-muted";
            const summaryClasses =
              isActive || isComplete
                ? "text-xs leading-relaxed text-textcolor-secondary"
                : "text-xs leading-relaxed text-textcolor-muted";

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all duration-300 backdrop-blur ${buttonClasses}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-1 min-w-[180px] items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${numberClasses} ${
                        isActive || isComplete ? "" : "bg-transparent"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p
                        className={`text-xs uppercase tracking-[0.25em] ${
                          isActive || isComplete
                            ? "text-accent-dark"
                            : "text-textcolor-muted"
                        }`}
                      >
                        Step {index + 1}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          isActive
                            ? "text-primary-dark"
                            : isComplete
                              ? "text-success-dark"
                              : "text-textcolor"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${
                      isActive
                        ? "border-accent/40 bg-accent/10 text-accent-dark"
                        : isComplete
                          ? "border-success/40 bg-success/10 text-success-dark"
                          : "border-background-hover bg-white/60 text-textcolor-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className={`mt-3 ${summaryClasses}`}>{step.summary}</p>
              </button>
            );
          })}
        </nav>

        <div className="mt-10 space-y-8">
          <SectionCard
            ref={locationsRef}
            icon={Building2}
            title="Locations & contact"
            subtitle="Document each site your receptionist should understand, along with contact paths."
            status={sectionStatus("locations")}
            isOpen={activeSection === "locations"}
            onToggle={() => handleStepClick("locations")}
            stepNumber={getStepNumber("locations")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("locations")}
            completionHint="Ready once phone numbers, timezones, and scheduling rules are verified."
          >
            <LocationsSection
              locations={locations}
              onUpdateLocation={updateLocation}
              onRemoveLocation={removeLocation}
              onAddLocation={addLocation}
              days={daysOfWeek}
            />
          </SectionCard>

          <SectionCard
            ref={providersRef}
            icon={Users}
            title="Providers"
            subtitle="Capture the humans (or bots!) responsible for delivering services."
            status={sectionStatus("providers")}
            isOpen={activeSection === "providers"}
            onToggle={() => handleStepClick("providers")}
            stepNumber={getStepNumber("providers")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("providers")}
            completionHint="List every person (or virtual agent) patients might be scheduled with."
          >
            <ProvidersSection
              providers={providers}
              onUpdateProvider={updateProvider}
              onRemoveProvider={removeProvider}
              onAddProvider={addProvider}
            />
          </SectionCard>

          <SectionCard
            ref={servicesRef}
            icon={Stethoscope}
            title="Services"
            subtitle="Build the catalog so scheduling and triage decisions match your practice."
            status={sectionStatus("services")}
            isOpen={activeSection === "services"}
            onToggle={() => handleStepClick("services")}
            stepNumber={getStepNumber("services")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("services")}
            completionHint="Confirm durations, pricing, exclusions, and any upsell bundles."
          >
            <ServicesSection
              services={services}
              onUpdateService={updateService}
              onRemoveService={removeService}
              onAddService={addService}
              unsupportedServices={unsupportedServices}
              onUnsupportedServicesChange={setUnsupportedServices}
              addOns={addOns}
              onAddAddOn={addAddOn}
              onUpdateAddOn={updateAddOn}
              onRemoveAddOn={removeAddOn}
            />
          </SectionCard>

          <SectionCard
            ref={insuranceRef}
            icon={ShieldCheck}
            title="Insurance & payments"
            subtitle="Clarify how the assistant should talk about coverage and getting paid."
            status={sectionStatus("insurance")}
            isOpen={activeSection === "insurance"}
            onToggle={() => handleStepClick("insurance")}
            stepNumber={getStepNumber("insurance")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("insurance")}
            completionHint="Spot-check plan names, coverage language, and accepted payments."
          >
            <InsuranceSection
              plans={plans}
              onPlanChange={setPlans}
              onAddPlan={addPlan}
              onRemovePlan={removePlan}
              paymentOptions={paymentOptions}
              selectedPaymentMethods={selectedPaymentMethods}
              onTogglePaymentMethod={togglePaymentMethod}
              financingDetails={financingDetails}
              onFinancingDetailsChange={setFinancingDetails}
            />
          </SectionCard>

          <SectionCard
            ref={policiesRef}
            icon={FileText}
            title="Policies & legal"
            subtitle="Capture the must-say language so the assistant stays compliant."
            status={sectionStatus("policies")}
            isOpen={activeSection === "policies"}
            onToggle={() => handleStepClick("policies")}
            stepNumber={getStepNumber("policies")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("policies")}
            completionHint="Lock in consent language, emergency scripts, and confirmation channels."
          >
            <PoliciesSection
              emergencyScript={emergencyScript}
              onEmergencyScriptChange={setEmergencyScript}
              privacyMode={privacyMode}
              onTogglePrivacyMode={() => setPrivacyMode((prev) => !prev)}
              privacyPolicyUrl={privacyPolicyUrl}
              onPrivacyPolicyUrlChange={setPrivacyPolicyUrl}
              consentText={consentText}
              onConsentTextChange={setConsentText}
              notificationPrefs={notificationPrefs}
              onToggleNotification={toggleNotification}
            />
          </SectionCard>

          <SectionCard
            ref={messagingRef}
            icon={MessageCircle}
            title="Messaging & tone"
            subtitle="Teach the AI how to sound like an extension of your front desk."
            status={sectionStatus("messaging")}
            isOpen={activeSection === "messaging"}
            onToggle={() => handleStepClick("messaging")}
            stepNumber={getStepNumber("messaging")}
            totalSteps={totalSteps}
            onMarkComplete={() => handleMarkComplete("messaging")}
            completionHint="Dial in greetings, closings, and tone presets before you launch."
          >
            <MessagingSection
              greetingLine={greetingLine}
              onGreetingLineChange={setGreetingLine}
              closingLine={closingLine}
              onClosingLineChange={setClosingLine}
              toneOptions={toneOptions}
              toneVariants={toneVariants}
              onToggleTone={toggleTone}
            />
          </SectionCard>

          <SectionCard
            ref={voicesRef}
            icon={Mic2}
            title="Voice & persona"
            subtitle="Choose the assistant&apos;s spoken style from the synced ElevenLabs voices."
            status={sectionStatus("voices")}
            isOpen={activeSection === "voices"}
            onToggle={() => handleStepClick("voices")}
            stepNumber={getStepNumber("voices")}
            totalSteps={totalSteps}
            onMarkComplete={handleVoicesComplete}
            completionHint="Preview samples and confirm the voice that matches your brand."
          >
            <VoicesSection
              voices={voices}
              voicesLoading={voicesLoading}
              voicesError={voicesError}
              selectedVoiceId={selectedVoiceId}
              voiceSelectionError={voiceSelectionError}
              playingVoices={playingVoices}
              onSelectVoice={handleSelectVoice}
              onPreviewVoice={handlePreviewVoice}
              selectedVoice={selectedVoice}
            />
          </SectionCard>

          <div className="mt-12 rounded-2xl border border-background-hover bg-white px-6 py-6 text-sm shadow-md shadow-accent/10">
            <div className="flex flex-wrap items-center gap-3">
              <CalendarDays className="h-6 w-6 text-accent-dark" />
              <div>
                <p className="font-semibold text-primary-dark">
                  Publish whenever you&apos;re ready
                </p>
                <p className="text-xs text-textcolor-secondary">
                  Saving keeps your progress inside the dashboard. Click “Finish & create agent” from the header once you want the live receptionist to pick up the new playbook.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSettings;

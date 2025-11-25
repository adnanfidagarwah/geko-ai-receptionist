import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Play,
  Plus,
  Check,
  X,
  Bot,
  BarChart3,
  Clock3,
  MessageCircle,
  Sparkles,
  MessageSquareText,
  Stethoscope,
} from "lucide-react";
import CreateAgentModal from "../components/prompts/CreateAgentModal";

const PromptsFaqs = () => {
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [greeting, setGreeting] = useState({
    message:
      "Hello! Thank you for calling Downtown Medical Clinic. I'm your AI assistant. How can I help you today? I can help you schedule appointments, answer questions about our services, or provide information about our office hours.",
    updatedAt: "2024-09-15",
  });
  const [tempMessage, setTempMessage] = useState(greeting.message);

  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const handleOpenCreateAgentModal = () => setIsCreateAgentModalOpen(true);
  const handleCloseCreateAgentModal = () => setIsCreateAgentModalOpen(false);
  const handleSubmitCreateAgent = (payload) => {
    console.log("Create agent payload →", payload);
    setIsCreateAgentModalOpen(false);
  };


  const formatDateLabel = (value) => {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }
    return parsedDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSaveGreeting = () => {
    setGreeting({
      message: tempMessage,
      updatedAt: new Date().toISOString().split("T")[0],
    });
    setIsEditingGreeting(false);
  };

  const [faqs, setFaqs] = useState([
    {
      id: 1,
      question: "What are your office hours?",
      answer:
        "Our office hours are Monday through Friday, 8:00 AM to 5:00 PM, and Saturday 9:00 AM to 1:00 PM. We are closed on Sundays.",
      category: "General",
      timesUsed: 45,
      updatedAt: "2024-09-20",
      isEditing: false,
      tempQuestion: "",
      tempAnswer: "",
    },
    {
      id: 2,
      question: "How do I schedule an appointment?",
      answer:
        "I can help you schedule an appointment right now! Please let me know what type of appointment you need and your preferred date and time.",
      category: "Appointments",
      timesUsed: 89,
      updatedAt: "2024-09-25",
      isEditing: false,
      tempQuestion: "",
      tempAnswer: "",
    },
  ]);

  const [services, setServices] = useState(() =>
    [
      {
        id: 1,
        name: "New Patient Comprehensive Exam",
        description:
          "60-minute intake that includes full history, labs order set, and personalized care plan.",
        durationMinutes: 60,
        basePrice: 245,
        provider: "Dr. Morgan Lee",
        isActive: true,
      },
      {
        id: 2,
        name: "Established Patient Follow-up",
        description:
          "Focused visit to review labs, adjust medications, or manage ongoing concerns.",
        durationMinutes: 30,
        basePrice: 165,
        provider: "NP Jasmine Ortiz",
        isActive: true,
      },
      {
        id: 3,
        name: "Same-Day Urgent Visit",
        description:
          "Rapid access for acute concerns that are not life-threatening; includes care coordination.",
        durationMinutes: 25,
        basePrice: 185,
        provider: "Dr. Theo Walsh",
        isActive: false,
      },
      {
        id: 4,
        name: "Telehealth Check-in",
        description:
          "Virtual follow-up for medication refills, lab reviews, or post-visit questions.",
        durationMinutes: 20,
        basePrice: 95,
        provider: "PA Riya Kapoor",
        isActive: true,
      },
    ].map((service) => ({
      ...service,
      isEditing: false,
      draft: null,
    }))
  );
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    durationMinutes: "",
    basePrice: "",
    provider: "",
    isActive: true,
  });

  const [messagingConfig, setMessagingConfig] = useState(() => ({
    closingLine:
      "Thanks for calling Downtown Medical Clinic. If you need anything else, I'm here to help or can connect you with our front desk.",
    toneVariants: {
      formal:
        "Warm, professional, and concise. Always use the caller's last name until they invite a first-name basis.",
      casual:
        "Friendly and upbeat. Use first names once confirmed and offer to text helpful links.",
    },
  }));
  const [messagingDraft, setMessagingDraft] = useState(() => ({
    closingLine:
      "Thanks for calling Downtown Medical Clinic. If you need anything else, I'm here to help or can connect you with our front desk.",
    toneVariants: {
      formal:
        "Warm, professional, and concise. Always use the caller's last name until they invite a first-name basis.",
      casual:
        "Friendly and upbeat. Use first names once confirmed and offer to text helpful links.",
    },
  }));
  const [isEditingMessaging, setIsEditingMessaging] = useState(false);

  const handleEditFaq = (id) => {
    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === id
          ? {
            ...faq,
            isEditing: true,
            tempQuestion: faq.question,
            tempAnswer: faq.answer,
          }
          : faq
      )
    );
  };

  const handleCancelFaq = (id) => {
    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === id
          ? { ...faq, isEditing: false, tempQuestion: "", tempAnswer: "" }
          : faq
      )
    );
  };

  const handleSaveFaq = (id) => {
    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === id
          ? {
            ...faq,
            question: faq.tempQuestion,
            answer: faq.tempAnswer,
            updatedAt: new Date().toISOString().split("T")[0],
            isEditing: false,
          }
          : faq
      )
    );
  };

  const handleEditMessaging = () => {
    setMessagingDraft({
      ...messagingConfig,
      toneVariants: { ...messagingConfig.toneVariants },
    });
    setIsEditingMessaging(true);
  };

  const handleMessagingDraftChange = (field, value) => {
    setMessagingDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToneVariantChange = (toneKey, value) => {
    setMessagingDraft((prev) => ({
      ...prev,
      toneVariants: {
        ...prev.toneVariants,
        [toneKey]: value,
      },
    }));
  };

  const handleSaveMessaging = () => {
    const updated = {
      ...messagingDraft,
      toneVariants: { ...messagingDraft.toneVariants },
    };
    setMessagingConfig(updated);
    setMessagingDraft(updated);
    setIsEditingMessaging(false);
  };

  const handleEditService = (id) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? {
            ...service,
            isEditing: true,
            draft: {
              name: service.name,
              description: service.description,
              durationMinutes: String(service.durationMinutes),
              basePrice: String(service.basePrice),
              provider: service.provider,
              isActive: service.isActive,
            },
          }
          : service
      )
    );
  };

  const handleServiceDraftChange = (id, field, value) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? {
            ...service,
            draft: {
              ...service.draft,
              [field]: value,
            },
          }
          : service
      )
    );
  };

  const handleCancelServiceEdit = (id) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? { ...service, isEditing: false, draft: null }
          : service
      )
    );
  };

  const handleSaveService = (id) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== id || !service.draft) {
          return service;
        }

        const {
          name,
          description,
          durationMinutes,
          basePrice,
          provider,
          isActive,
        } = service.draft;

        const parsedDuration = Number(durationMinutes);
        const parsedPrice = Number(basePrice);

        return {
          ...service,
          name: name.trim() || service.name,
          description: description.trim() || service.description,
          provider: provider.trim() || service.provider,
          durationMinutes:
            Number.isFinite(parsedDuration) && parsedDuration > 0
              ? Math.round(parsedDuration)
              : service.durationMinutes,
          basePrice:
            Number.isFinite(parsedPrice) && parsedPrice >= 0
              ? Number(parsedPrice.toFixed(2))
              : service.basePrice,
          isActive: Boolean(isActive),
          isEditing: false,
          draft: null,
        };
      })
    );
  };

  const handleNewServiceChange = (field, value) => {
    setNewService((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetNewService = () => {
    setNewService({
      name: "",
      description: "",
      durationMinutes: "",
      basePrice: "",
      provider: "",
      isActive: true,
    });
  };

  const handleCreateService = () => {
    if (!newService.name.trim() || !newService.description.trim()) {
      return;
    }

    const parsedDuration = Number(newService.durationMinutes);
    const parsedPrice = Number(newService.basePrice);

    setServices((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newService.name.trim(),
        description: newService.description.trim(),
        provider: newService.provider.trim(),
        durationMinutes:
          Number.isFinite(parsedDuration) && parsedDuration > 0
            ? Math.round(parsedDuration)
            : 0,
        basePrice:
          Number.isFinite(parsedPrice) && parsedPrice >= 0
            ? Number(parsedPrice.toFixed(2))
            : 0,
        isActive: Boolean(newService.isActive),
        isEditing: false,
        draft: null,
      },
    ]);
    resetNewService();
    setIsAddingService(false);
  };

  const handleCancelCreateService = () => {
    resetNewService();
    setIsAddingService(false);
  };

  const handleCancelMessaging = () => {
    setMessagingDraft({
      ...messagingConfig,
      toneVariants: { ...messagingConfig.toneVariants },
    });
    setIsEditingMessaging(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const totalTimesUsed = faqs.reduce((acc, faq) => acc + faq.timesUsed, 0);
  const formattedGreetingDate = formatDateLabel(greeting.updatedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background.DEFAULT via-white to-background-hover/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur sm:rounded-3xl sm:p-8">
          <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6 sm:gap-8">
            <div className="w-full max-w-xl space-y-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-dark">
                <Sparkles size={16} />
                Prompt Studio
              </span>
              <h2 className="text-2xl font-semibold text-primary-dark sm:text-3xl">
                Craft conversations that feel human
              </h2>
              <p className="text-sm text-textcolor-secondary">
                Direct how your AI receptionist greets callers and answers real
                questions in seconds.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button className="btn-secondary flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto">
                <Play size={16} />
                Test Mode
              </button>
              <button className="btn-primary flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto">
                <Plus size={16} />
                Add FAQ
              </button>
              <button
                onClick={handleOpenCreateAgentModal}
                className="btn-primary flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto"
              >
                <Bot size={16} />
                Create Agent
              </button>
            </div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                <span>Total FAQs</span>
                <MessageCircle size={16} className="text-accent" />
              </div>
              <p className="mt-3 text-xl font-semibold text-primary-dark sm:text-2xl">
                {faqs.length}
              </p>
              <p className="mt-1 text-xs text-textcolor-secondary">
                Ready for instant responses
              </p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                <span>Active Services</span>
                <BarChart3 size={16} className="text-accent" />
              </div>
              <p className="mt-3 text-xl font-semibold text-primary-dark sm:text-2xl">
                3
              </p>
              <p className="mt-1 text-xs text-textcolor-secondary">
                {/* Total plays across FAQs */}
                Total services accros FAQs
              </p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                <span>Greeting refresh</span>
                <Clock3 size={16} className="text-accent" />
              </div>
              <p className="mt-3 text-lg font-semibold text-primary-dark sm:text-xl">
                {formattedGreetingDate}
              </p>
              <p className="mt-1 text-xs text-textcolor-secondary">
                Most recent update
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Services */}
          <div className="card rounded-2xl border border-background-hover/70 p-5 shadow-md sm:rounded-3xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-dark">
                  <Stethoscope size={20} className="text-accent" />
                  Services & Packages
                </h3>
                <p className="text-sm text-textcolor-secondary">
                  Give the assistant context on what you offer and how to book it.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAddingService ? (
                  <button
                    onClick={handleCancelCreateService}
                    className="inline-flex items-center gap-2 rounded-full border border-error/30 px-3 py-2 text-xs font-semibold text-error transition hover:border-error hover:bg-error/10"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddingService(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-2 text-xs font-semibold text-primary-dark transition hover:border-accent hover:bg-accent/10"
                  >
                    <Plus size={14} />
                    Add Service
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-2">
                        {!service.isEditing ? (
                          <>
                            <p className="text-sm font-semibold text-primary-dark">
                              {service.name}
                            </p>
                            <p className="text-xs text-textcolor-secondary">
                              {service.description}
                            </p>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={service.draft?.name ?? ""}
                              onChange={(e) =>
                                handleServiceDraftChange(
                                  service.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                              placeholder="Service name"
                            />
                            <textarea
                              rows={3}
                              value={service.draft?.description ?? ""}
                              onChange={(e) =>
                                handleServiceDraftChange(
                                  service.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                              placeholder="Short description"
                            />
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:flex-col sm:items-end sm:gap-3">
                        {!service.isEditing ? (
                          <>
                            <span className="bg-green-100 px-3 py-1 text-gray-700 rounded-xl">
                              {service.durationMinutes} min
                            </span>
                            <span className="bg-blue-100 px-3 py-1 text-gray-700 rounded-xl">
                              {formatCurrency(service.basePrice)}
                            </span>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              <span>Duration</span>
                              <input
                                type="number"
                                min={0}
                                value={service.draft?.durationMinutes ?? ""}
                                onChange={(e) =>
                                  handleServiceDraftChange(
                                    service.id,
                                    "durationMinutes",
                                    e.target.value
                                  )
                                }
                                className="w-20 rounded-xl border border-primary/30 bg-white/90 px-2 py-1 text-xs text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                              <span>Price</span>
                              <input
                                type="number"
                                min={0}
                                value={service.draft?.basePrice ?? ""}
                                onChange={(e) =>
                                  handleServiceDraftChange(
                                    service.id,
                                    "basePrice",
                                    e.target.value
                                  )
                                }
                                className="w-24 rounded-xl border border-primary/30 bg-white/90 px-2 py-1 text-xs text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        {!service.isEditing ? (
                          <>
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                              Provider • {service.provider || "Unassigned"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${service.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                                }`}
                            >
                              {service.isActive ? "Active" : "Inactive"}
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={service.draft?.provider ?? ""}
                              onChange={(e) =>
                                handleServiceDraftChange(
                                  service.id,
                                  "provider",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-xs text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition sm:w-60"
                              placeholder="Assign a provider"
                            />
                            <label className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-dark">
                              <input
                                type="checkbox"
                                checked={Boolean(service.draft?.isActive)}
                                onChange={(e) =>
                                  handleServiceDraftChange(
                                    service.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-accent/40"
                              />
                              Active
                            </label>
                          </>
                        )}
                      </div>
                      <div className="flex w-full items-center justify-between gap-2 rounded-full bg-white/70 p-1 text-muted shadow-inner sm:w-auto sm:justify-start">
                        {!service.isEditing ? (
                          <>
                            <button
                              className="rounded-full p-2 transition hover:bg-white hover:text-accent-dark"
                              onClick={() => handleEditService(service.id)}
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="rounded-full p-2 text-success transition hover:bg-white hover:text-success-dark"
                              onClick={() => handleSaveService(service.id)}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              className="rounded-full p-2 text-error transition hover:bg-white hover:text-error-dark"
                              onClick={() => handleCancelServiceEdit(service.id)}
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isAddingService && (
                <div className="rounded-2xl border border-dashed border-accent/40 bg-white/80 p-5 shadow-inner">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Service name
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) =>
                          handleNewServiceChange("name", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                        placeholder="e.g., Wellness Consultation"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={newService.description}
                        onChange={(e) =>
                          handleNewServiceChange("description", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                        placeholder="What happens during this visit?"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newService.durationMinutes}
                        onChange={(e) =>
                          handleNewServiceChange(
                            "durationMinutes",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newService.basePrice}
                        onChange={(e) =>
                          handleNewServiceChange("basePrice", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Provider
                      </label>
                      <input
                        type="text"
                        value={newService.provider}
                        onChange={(e) =>
                          handleNewServiceChange("provider", e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                        placeholder="Who leads this service?"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={newService.isActive}
                        onChange={(e) =>
                          handleNewServiceChange("isActive", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-primary/40 text-primary focus:ring-accent/40"
                      />
                      <span className="text-xs font-semibold text-primary-dark">
                        Active service
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={handleCancelCreateService}
                      className="inline-flex items-center gap-2 rounded-full border border-error/30 px-3 py-2 text-xs font-semibold text-error transition hover:border-error hover:bg-error/10"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateService}
                      className="inline-flex items-center gap-2 rounded-full border border-success/30 px-3 py-2 text-xs font-semibold text-success transition hover:border-success hover:bg-success/10"
                    >
                      <Check size={14} />
                      Save Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messaging */}
          <div className="card rounded-2xl border border-background-hover/70 p-5 shadow-md sm:rounded-3xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-dark">
                  <MessageSquareText size={20} className="text-accent" />
                  Messaging Guidelines
                </h3>
                <p className="text-sm text-textcolor-secondary">
                  Coach the assistant on tone and how to wrap up conversations.
                </p>
              </div>
              {!isEditingMessaging ? (
                <button
                  onClick={handleEditMessaging}
                  className="rounded-full p-2 text-accent-dark transition hover:bg-white/80 hover:text-accent"
                >
                  <Pencil size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveMessaging}
                    className="rounded-full p-2 text-success transition hover:bg-white/80 hover:text-success-dark"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelMessaging}
                    className="rounded-full p-2 text-error transition hover:bg-white/80 hover:text-error-dark"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Greeting line
                </span>
                <p className="mt-2 text-sm text-textcolor-secondary">
                  {greeting.message}
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Closing line
                </span>
                {!isEditingMessaging ? (
                  <p className="mt-2 text-sm text-textcolor-secondary">
                    {messagingConfig.closingLine}
                  </p>
                ) : (
                  <textarea
                    rows={3}
                    value={messagingDraft.closingLine}
                    onChange={(e) =>
                      handleMessagingDraftChange("closingLine", e.target.value)
                    }
                    className="mt-2 h-28 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                  />
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Tone: formal
                  </span>
                  {!isEditingMessaging ? (
                    <p className="mt-2 text-sm text-textcolor-secondary">
                      {messagingConfig.toneVariants.formal}
                    </p>
                  ) : (
                    <textarea
                      rows={4}
                      value={messagingDraft.toneVariants.formal}
                      onChange={(e) =>
                        handleToneVariantChange("formal", e.target.value)
                      }
                      className="mt-2 h-32 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                    />
                  )}
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Tone: casual
                  </span>
                  {!isEditingMessaging ? (
                    <p className="mt-2 text-sm text-textcolor-secondary">
                      {messagingConfig.toneVariants.casual}
                    </p>
                  ) : (
                    <textarea
                      rows={4}
                      value={messagingDraft.toneVariants.casual}
                      onChange={(e) =>
                        handleToneVariantChange("casual", e.target.value)
                      }
                      className="mt-2 h-32 w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="card rounded-2xl border border-background-hover/70 p-5 shadow-lg sm:rounded-3xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-dark">
                <MessageCircle size={20} className="text-accent" />
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-textcolor-secondary">
                {faqs.length} active FAQs • Manage common questions and
                responses
              </p>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-textcolor-secondary shadow-inner">
              {totalTimesUsed} plays handled automatically
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="group rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Question */}
                    {!faq.isEditing ? (
                      <p className="text-base font-semibold text-textcolor-default sm:text-lg">
                        {faq.question}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={faq.tempQuestion}
                        onChange={(e) =>
                          setFaqs((prev) =>
                            prev.map((x) =>
                              x.id === faq.id
                                ? { ...x, tempQuestion: e.target.value }
                                : x
                            )
                          )
                        }
                        className="w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                      />
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-blue-100 px-3 py-1 text-gray-700 rounded-xl">{faq.category}</span>
                      <span className="bg-green-100 px-3 py-1 text-gray-700 rounded-xl">
                        Used {faq.timesUsed} times
                      </span>
                    </div>

                    {/* Answer */}
                    {!faq.isEditing ? (
                      <p className="text-sm leading-relaxed text-textcolor-secondary">
                        {faq.answer}
                      </p>
                    ) : (
                      <textarea
                        rows={3}
                        value={faq.tempAnswer}
                        onChange={(e) =>
                          setFaqs((prev) =>
                            prev.map((x) =>
                              x.id === faq.id
                                ? { ...x, tempAnswer: e.target.value }
                                : x
                            )
                          )
                        }
                        className="w-full rounded-2xl border border-primary/30 bg-white/90 px-4 py-3 text-sm text-primary placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/30 transition"
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                        <Clock3 size={14} />
                        Updated {formatDateLabel(faq.updatedAt)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
                        <BarChart3 size={14} />
                        {faq.timesUsed} plays
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full items-center justify-between gap-2 rounded-full bg-white/70 p-1 text-muted shadow-inner sm:w-auto sm:justify-start">
                    {!faq.isEditing ? (
                      <>
                        <button className="rounded-full p-2 transition hover:bg-white hover:text-accent-dark">
                          <Play size={16} />
                        </button>
                        <button
                          className="rounded-full p-2 transition hover:bg-white hover:text-accent-dark"
                          onClick={() => handleEditFaq(faq.id)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button className="rounded-full p-2 text-error transition hover:bg-white hover:text-error-dark">
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="rounded-full p-2 text-success transition hover:bg-white hover:text-success-dark"
                          onClick={() => handleSaveFaq(faq.id)}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          className="rounded-full p-2 text-error transition hover:bg-white hover:text-error-dark"
                          onClick={() => handleCancelFaq(faq.id)}
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={handleCloseCreateAgentModal}
        onSubmit={handleSubmitCreateAgent}
      />
    </div>
  );
};

export default PromptsFaqs;

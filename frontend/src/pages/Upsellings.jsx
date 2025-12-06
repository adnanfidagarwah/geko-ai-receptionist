import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  Trophy,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock4,
  Loader2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetRestaurantsQuery,
  useGetRestaurantUpsellsQuery,
  useGetRestaurantAiSettingsQuery,
  useSaveRestaurantAiSettingsMutation,
} from "../features/api/appApi";
import { selectAuth } from "../features/auth/authSlice";

const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const STATUS_META = {
  accepted: {
    label: "Accepted",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  pitched: {
    label: "Pitched",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Trophy,
  },
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock4,
  },
};

const UpsellingsPage = () => {
  const { token } = useSelector(selectAuth);
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [upsellPromptDraft, setUpsellPromptDraft] = useState("");
  const [promptDirty, setPromptDirty] = useState(false);
  const [promptRestaurantId, setPromptRestaurantId] = useState(null);

  const preferredRestaurantId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      if ((decoded?.orgModel || decoded?.org_type) === "Restaurant") {
        return decoded?.restaurant_id || decoded?.orgId || null;
      }
    } catch (error) {
      console.error("Failed to decode auth token", error);
    }
    return null;
  }, [token]);

  const {
    data: restaurants = [],
    isLoading: restaurantsLoading,
  } = useGetRestaurantsQuery();

  useEffect(() => {
    if (preferredRestaurantId) {
      setActiveRestaurantId(preferredRestaurantId);
    } else if (!activeRestaurantId && restaurants.length) {
      setActiveRestaurantId(restaurants[0].id);
    }
  }, [restaurants, preferredRestaurantId, activeRestaurantId]);

  const activeRestaurant =
    restaurants.find((restaurant) => restaurant.id === activeRestaurantId) ||
    restaurants[0];

  const {
    data: restaurantAiSettings,
    isLoading: aiSettingsLoading,
    isFetching: aiSettingsFetching,
  } = useGetRestaurantAiSettingsQuery(activeRestaurantId, { skip: !activeRestaurantId });

  const [saveRestaurantAiSettings, { isLoading: savePromptLoading }] =
    useSaveRestaurantAiSettingsMutation();

  const savedUpsellPrompt = restaurantAiSettings?.upsellPrompt ?? "";

  useEffect(() => {
    if (!activeRestaurantId) {
      setUpsellPromptDraft("");
      setPromptDirty(false);
      setPromptRestaurantId(null);
      return;
    }

    if (promptRestaurantId === activeRestaurantId && promptDirty) {
      return;
    }

    setUpsellPromptDraft(savedUpsellPrompt);
    setPromptDirty(false);
    setPromptRestaurantId(activeRestaurantId);
  }, [activeRestaurantId, promptRestaurantId, savedUpsellPrompt, promptDirty]);

  const promptInputsDisabled = !activeRestaurantId || aiSettingsLoading;
  const canSavePrompt = Boolean(promptDirty && activeRestaurantId && !savePromptLoading);
  const showPromptSyncing = aiSettingsFetching && !savePromptLoading;

  const {
    data: upsells = [],
    isLoading: upsellsLoading,
    isFetching: upsellsFetching,
  } = useGetRestaurantUpsellsQuery(activeRestaurantId, { skip: !activeRestaurantId });

  const filteredUpsells = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return upsells;
    return upsells.filter((upsell) => {
      const haystack = [
        upsell.offer_label,
        upsell.offer_description,
        upsell.offer_type,
        upsell.status,
        upsell.customer_name,
        upsell.customer_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [upsells, searchTerm]);

  const stats = useMemo(() => {
    const total = upsells.length;
    const accepted = upsells.filter(
      (item) => (item.status || "").toLowerCase() === "accepted",
    ).length;
    const declined = upsells.filter(
      (item) => (item.status || "").toLowerCase() === "declined",
    ).length;
    const pending = upsells.filter(
      (item) => {
        const status = (item.status || "").toLowerCase();
        return status === "pending" || status === "pitched";
      },
    ).length;
    const revenue = upsells.reduce((sum, item) => {
      if ((item.status || "").toLowerCase() !== "accepted") return sum;
      return sum + Number(item.price || 0);
    }, 0);
    const conversion = total ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, declined, pending, conversion, revenue };
  }, [upsells]);

  const badge = (
    <span className="inline-flex items-center gap-2 rounded-xl border border-background-hover bg-white px-4 py-2 text-sm font-medium text-primary-dark shadow-sm">
      {restaurantsLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </>
      ) : (
        activeRestaurant?.name || "Restaurant"
      )}
    </span>
  );

  const renderStatusPill = (statusRaw) => {
    const key = (statusRaw || "").toLowerCase();
    const meta = STATUS_META[key] || STATUS_META.pending;
    const Icon = meta.icon ?? Sparkles;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
      </span>
    );
  };

  const renderTable = () => {
    if (upsellsLoading && !upsells.length) {
      return (
        <div className="flex items-center justify-center rounded-2xl border border-background-hover bg-white/80 p-12 text-primary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading upsells…
        </div>
      );
    }

    if (!upsellsLoading && filteredUpsells.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-background-hover bg-white/70 p-10 text-center text-textcolor-secondary">
          No upsell activity yet. Once agents start pitching add-ons, the log will appear here.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-background-hover bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Linked Order</th>
              <th className="px-4 py-3">Call ID</th>
              <th className="px-4 py-3">Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUpsells.map((upsell) => (
              <tr key={upsell.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-primary-dark">
                    {upsell.offer_label || "Untitled offer"}
                  </p>
                  <p className="text-xs text-textcolor-secondary">
                    {upsell.offer_description || upsell.offer_type || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">
                  <div className="flex flex-col">
                    <span className="font-medium text-primary-dark">{upsell.customer_name || "Guest"}</span>
                    <span className="text-xs">
                      {upsell.customer_phone ? (
                        <a className="text-primary" href={`tel:${upsell.customer_phone}`}>
                          {upsell.customer_phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{renderStatusPill(upsell.status)}</td>
                <td className="px-4 py-3 font-semibold text-primary-dark">
                  {upsell.price ? formatCurrency(upsell.price) : "—"}
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">
                  {upsell.order_id ? (
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">{upsell.order_id.slice(0, 8)}…</code>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-textcolor-secondary">
                  {upsell.call_id || "—"}
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">{formatDateTime(upsell.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleSaveUpsellPrompt = async () => {
    if (!activeRestaurantId) {
      toast.error("Select a restaurant first.");
      return;
    }
    try {
      const response = await saveRestaurantAiSettings({
        restaurantId: activeRestaurantId,
        settings: { upsellPrompt: upsellPromptDraft },
      }).unwrap();
      const agentMessage = response?.agentUpdated
        ? "Upsell prompt saved and agent updated."
        : "Upsell prompt saved.";
      toast.success(agentMessage);
      setPromptDirty(false);
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.error ||
        error?.message ||
        "Failed to save upsell prompt.";
      toast.error(message);
    }
  };

  const handleResetUpsellPrompt = () => {
    setUpsellPromptDraft(savedUpsellPrompt);
    setPromptDirty(false);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Upsell Activity</h1>
          <p className="text-sm text-textcolor-secondary">
            Track every add-on pitch and accepted order from your AI host.
          </p>
        </div>
        {badge}
      </header>

      <section className="rounded-2xl border border-background-hover bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Upselling guidance</p>
            <h2 className="text-lg font-semibold text-primary-dark">Custom prompt</h2>
            <p className="text-sm text-textcolor-secondary">
              Tell your AI host exactly what to pitch or how to describe add-ons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResetUpsellPrompt}
              disabled={!promptDirty || promptInputsDisabled || savePromptLoading}
              className="rounded-xl border border-background-hover px-4 py-2 text-sm font-medium text-primary-dark transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveUpsellPrompt}
              disabled={!canSavePrompt}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {savePromptLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save prompt"
              )}
            </button>
          </div>
        </div>
        <textarea
          value={upsellPromptDraft}
          onChange={(event) => {
            setUpsellPromptDraft(event.target.value);
            setPromptDirty(true);
          }}
          rows={4}
          disabled={promptInputsDisabled}
          className="mt-4 w-full rounded-2xl border border-background-hover px-4 py-3 text-sm text-primary-dark shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-50"
          placeholder="Ex: Offer dessert flights to parties celebrating anniversaries. Mention the chef’s tasting menu when callers ask about date nights."
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-textcolor-secondary">
          <span>
            {promptInputsDisabled
              ? "Select a restaurant to edit its upsell script."
              : "Changes autosave to the cloud once you click Save prompt."}
          </span>
          {showPromptSyncing ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Syncing settings…
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Total pitches</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <TrendingUp className="h-6 w-6 text-primary" /> {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Accepted</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-emerald-600">
            <CheckCircle2 className="h-6 w-6" /> {stats.accepted}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Conversion</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Sparkles className="h-6 w-6 text-primary" /> {stats.conversion}%
          </div>
          <p className="text-xs text-textcolor-secondary">Declined: {stats.declined}</p>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Upsell revenue</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-amber-600">
            <DollarSign className="h-6 w-6" /> {formatCurrency(stats.revenue)}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-background-hover px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            placeholder="Search offers, customers or status"
          />
          {upsellsFetching ? (
            <span className="inline-flex items-center gap-2 text-xs text-textcolor-secondary">
              <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          ) : null}
        </div>
        <div className="mt-4">{renderTable()}</div>
      </div>
    </div>
  );
};

export default UpsellingsPage;

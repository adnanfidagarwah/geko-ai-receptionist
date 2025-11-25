import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Flame,
  Salad,
  CupSoda,
  IceCream,
  Leaf,
  UtensilsCrossed,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetRestaurantsQuery,
  useGetRestaurantMenuQuery,
  useCreateMenuItemMutation,
} from "../features/api/appApi";
import { useSelector } from "react-redux";
import { selectAuth } from "../features/auth/authSlice";
import { jwtDecode } from "jwt-decode";

const CATEGORY_META = {
  Starters: {
    icon: Salad,
    accent: "bg-emerald-100 text-emerald-700",
    gradient: "from-emerald-50 via-white to-emerald-50/70",
  },
  Mains: {
    icon: Flame,
    accent: "bg-orange-100 text-orange-700",
    gradient: "from-orange-50 via-white to-orange-50/70",
  },
  Desserts: {
    icon: IceCream,
    accent: "bg-pink-100 text-pink-700",
    gradient: "from-pink-50 via-white to-pink-50/70",
  },
  Beverages: {
    icon: CupSoda,
    accent: "bg-sky-100 text-sky-700",
    gradient: "from-sky-50 via-white to-sky-50/70",
  },
  PlantBased: {
    icon: Leaf,
    accent: "bg-lime-100 text-lime-700",
    gradient: "from-lime-50 via-white to-lime-50/70",
  },
};

const FEATURE_CALLOUTS = [
  {
    title: "Chef's Tasting Flight",
    detail: "Curated 5-course journey for adventurous tables.",
  },
  {
    title: "Plant-forward Pairings",
    detail: "Bright mains with wine pairings for plant-based diners.",
  },
  {
    title: "Zero-Proof Mixology",
    detail: "Elevated evenings without the alcohol compromise.",
  },
];

const DEFAULT_CATEGORY = "General";

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: DEFAULT_CATEGORY,
  });

  const { token } = useSelector(selectAuth);
  const { data: restaurants = [], isLoading: restaurantsLoading } = useGetRestaurantsQuery();

  const preferredRestaurantId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      if ((decoded?.orgModel || decoded?.org_type) === "Restaurant") {
        return decoded?.restaurant_id || decoded?.orgId || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to decode auth token", error);
      return null;
    }
  }, [token]);

  const scopedRestaurants = useMemo(() => {
    if (preferredRestaurantId) {
      return restaurants.filter((restaurant) => restaurant.id === preferredRestaurantId);
    }
    return restaurants;
  }, [restaurants, preferredRestaurantId]);

  useEffect(() => {
    if (preferredRestaurantId) {
      setActiveRestaurantId(preferredRestaurantId);
      return;
    }
    if (!activeRestaurantId && scopedRestaurants.length) {
      setActiveRestaurantId(scopedRestaurants[0].id);
    }
  }, [scopedRestaurants, activeRestaurantId, preferredRestaurantId]);

  const {
    data: menuItems = [],
    isLoading: menuLoading,
    isFetching: menuFetching,
  } = useGetRestaurantMenuQuery(activeRestaurantId, { skip: !activeRestaurantId });

  const sections = useMemo(() => {
    if (!menuItems.length) return [];
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category || DEFAULT_CATEGORY;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([category, items]) => ({ category, items }));
  }, [menuItems]);

  const defaultCategory = sections[0]?.category || DEFAULT_CATEGORY;

  const availableCategories = useMemo(
    () => sections.map((section) => section.category),
    [sections],
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category || defaultCategory,
    }));
  }, [defaultCategory, activeRestaurantId]);

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sections;
    return sections
      .map((section) => {
        const items = section.items.filter((item) => {
          const haystack = [item.name, item.description, section.category]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        });
        return items.length ? { ...section, items } : null;
      })
      .filter(Boolean);
  }, [sections, searchTerm]);

  const stats = useMemo(() => {
    const totalItems = menuItems.length;
    const priceSum = menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const averagePrice = totalItems ? (priceSum / totalItems).toFixed(2) : "0.00";
    const signatureCount = menuItems.filter((item) =>
      (item.description || "").toLowerCase().includes("signature"),
    ).length;
    return {
      totalItems,
      categories: sections.length,
      averagePrice,
      signatureCount,
    };
  }, [menuItems, sections]);

  const [createMenuItem, { isLoading: createLoading }] = useCreateMenuItemMutation();

  const resetForm = () => {
    setFormData({ name: "", price: "", description: "", category: defaultCategory });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    if (!activeRestaurantId) {
      toast.error("Select a restaurant first.");
      return;
    }
    if (!formData.name.trim() || !formData.price) {
      toast.error("Dish name and price are required.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: formData.category?.trim() || DEFAULT_CATEGORY,
    };

    try {
      await createMenuItem({ restaurantId: activeRestaurantId, item: payload }).unwrap();
      toast.success(`${payload.name} added to ${payload.category}.`);
      handleModalClose();
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "Unable to create menu item.";
      toast.error(message);
    }
  };

  const renderHeaderControls = () => (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col text-sm text-textcolor-secondary">
          <span className="mb-1 font-semibold text-primary-dark">Restaurant</span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-background-hover bg-white px-4 py-2 text-sm font-medium text-primary-dark shadow-sm">
            {restaurantsLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </>
            ) : scopedRestaurants.length ? (
              scopedRestaurants.find((restaurant) => restaurant.id === activeRestaurantId)?.name ||
              scopedRestaurants[0].name
            ) : (
              "No restaurant"
            )}
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search dishes or descriptions…"
            className="w-full rounded-xl border border-background-hover bg-background-card px-10 py-2.5 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        className="btn-primary flex items-center justify-center gap-2 shadow-sm"
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        type="button"
        disabled={!activeRestaurantId}
      >
        <Plus className="h-4 w-4" />
        Add menu item
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-3xl border border-dashed border-background-hover bg-white/70 p-12 text-center shadow-sm">
      <Star className="mx-auto h-10 w-10 text-muted" />
      <p className="mt-4 text-lg font-semibold text-primary-dark">No dishes yet</p>
      <p className="mt-1 text-sm text-textcolor-secondary">
        Start by adding your hero appetizers, mains, or mocktails so the AI host can talk about them.
      </p>
      <button
        type="button"
        className="btn-primary mt-6 inline-flex items-center gap-2"
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        disabled={!activeRestaurantId}
      >
        <Plus className="h-4 w-4" />
        Create the first item
      </button>
    </div>
  );

  if (!restaurantsLoading && !scopedRestaurants.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary-dark">No restaurants found</p>
          <p className="mt-2 text-sm text-textcolor-secondary">
            Sign up a restaurant owner first to start curating menus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background.DEFAULT via-white to-background-hover/70 pb-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:gap-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-6 shadow-xl backdrop-blur">
          <div className="pointer-events-none absolute -top-32 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-dark">
                  <Sparkles className="h-4 w-4" />
                  Menu Curation
                </span>
                <h1 className="text-3xl font-semibold text-primary-dark sm:text-4xl">
                  Shape conversations with dishes that spark excitement
                </h1>
                <p className="text-sm text-textcolor-secondary">
                  Give your AI receptionist live data—seasonal spotlights, dietary cues, and price anchors so they can sell each course effortlessly.
                </p>
              </div>
            </div>
            {renderHeaderControls()}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-background-hover bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active items</p>
                <p className="mt-2 text-3xl font-semibold text-primary-dark">{stats.totalItems}</p>
                <p className="mt-1 text-xs text-textcolor-secondary">Across {stats.categories} curated categories.</p>
              </div>
              <div className="rounded-2xl border border-background-hover bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Signature mentions</p>
                <p className="mt-2 text-3xl font-semibold text-primary-dark">{stats.signatureCount}</p>
                <p className="mt-1 text-xs text-textcolor-secondary">Counted when descriptions mention "signature".</p>
              </div>
              <div className="rounded-2xl border border-background-hover bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg. price point</p>
                <p className="mt-2 text-3xl font-semibold text-primary-dark">${stats.averagePrice}</p>
                <p className="mt-1 text-xs text-textcolor-secondary">Helps set expectations during booking calls.</p>
              </div>
              <div className="rounded-2xl border border-background-hover bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Restaurants synced</p>
                <p className="mt-2 text-3xl font-semibold text-primary-dark">{scopedRestaurants.length}</p>
                <p className="mt-1 text-xs text-textcolor-secondary">Switch above to manage each location.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {menuLoading && !menuItems.length ? (
              <div className="flex items-center justify-center rounded-2xl border border-background-hover bg-white/80 p-12 text-primary">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading menu…
              </div>
            ) : null}

            {!menuLoading && filteredSections.length === 0 ? renderEmptyState() : null}

            {filteredSections.map((section) => {
              const meta = CATEGORY_META[section.category] ?? {};
              const Icon = meta.icon ?? UtensilsCrossed;
              return (
                <div
                  key={section.category}
                  className={`relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br p-6 shadow-lg backdrop-blur ${meta.gradient ?? "from-gray-50 via-white to-gray-50/70"}`}
                >
                  <div className="pointer-events-none absolute -top-16 right-12 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.accent ?? "bg-gray-200 text-gray-700"}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="text-xl font-semibold text-primary-dark">{section.category}</h2>
                          <p className="text-xs text-textcolor-secondary">
                            {section.items.length} item{section.items.length === 1 ? "" : "s"} synced.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary flex items-center gap-2 text-sm shadow-sm"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, category: section.category }));
                          setIsModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add to {section.category}
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {section.items.map((item) => (
                        <div
                          key={item.id || item.name}
                          className="group rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-primary-dark">{item.name}</h3>
                              <p className="text-sm text-textcolor-secondary">
                                {item.description || "No description added yet."}
                              </p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              ${Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-4 text-xs uppercase tracking-wide text-muted">
                            {section.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {menuFetching && menuItems.length ? (
              <div className="flex items-center gap-2 text-sm text-textcolor-secondary">
                <Loader2 className="h-4 w-4 animate-spin" /> Refreshing…
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                  New Dish
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-primary-dark">Add menu highlight</h2>
                <p className="mt-1 text-xs text-textcolor-secondary">
                  These details sync instantly to the AI host and call tools.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-background-hover p-1 text-muted transition hover:text-primary"
                onClick={handleModalClose}
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateItem}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-primary-dark/90">
                  Dish name
                  <input
                    required
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-background-hover bg-background-card px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Smoked Burrata & Embered Tomatoes"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-primary-dark/90">
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-background-hover bg-background-card px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="24.00"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-primary-dark/90 sm:col-span-2">
                  Category
                  <input
                    list="menu-categories"
                    value={formData.category}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-background-hover bg-background-card px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Starters"
                  />
                  <datalist id="menu-categories">
                    {[...new Set([...availableCategories, DEFAULT_CATEGORY, "Seasonal Features"])]
                      .filter(Boolean)
                      .map((category) => (
                        <option key={category} value={category} />
                      ))}
                  </datalist>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm text-primary-dark/90">
                Flavor notes for the AI host
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-background-hover bg-background-card px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Share the textures, cooking method, or sourcing story."
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-secondary sm:w-auto"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary sm:w-auto" disabled={createLoading}>
                  {createLoading ? "Saving…" : "Save menu item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Menu;

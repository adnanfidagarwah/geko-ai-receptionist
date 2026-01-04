import restaurantPromptTemplate from "../prompts/restaurantPromptTemplate.js";
import { renderTemplate } from "./promptContext.js";

const DEFAULT_HOURS = [
  { day: "Monday", open: "17:00", close: "23:00" },
  { day: "Tuesday", open: "17:00", close: "23:00" },
  { day: "Wednesday", open: "17:00", close: "23:00" },
  { day: "Thursday", open: "17:00", close: "23:00" },
  { day: "Friday", open: "17:00", close: "00:00" },
  { day: "Saturday", open: "11:00", close: "00:00" },
  { day: "Sunday", open: "11:00", close: "22:00" },
];

const toCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return value || "market price";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
};

const formatHours = (hours = []) => {
  const source = Array.isArray(hours) && hours.length ? hours : DEFAULT_HOURS;
  return source
    .map((entry) => {
      if (!entry) return null;
      const day = entry.day || entry.label;
      const open = entry.open || entry.open_time || entry.start || "??";
      const close = entry.close || entry.close_time || entry.end || "??";
      const closed = entry.closed || entry.is_closed === true;
      if (!day) return null;
      return `${day}: ${closed ? "Closed" : `${open}–${close}`}`;
    })
    .filter(Boolean)
    .join(" | ");
};

const pickTopMenuItems = (menu = [], limit = 5) => {
  if (!Array.isArray(menu) || !menu.length) {
    return [];
  }
  const sorted = [...menu].sort((a, b) => {
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bCreated - aCreated;
  });
  return sorted.slice(0, limit);
};

const formatMenuHighlights = (menu = []) => {
  const highlights = pickTopMenuItems(menu, 5).map((item) => {
    const name = item.name || "Dish";
    const price = toCurrency(item.price ?? item.default_price);
    const category = item.category || "Chef's selection";
    return `${name} (${category}) — ${price}`;
  });
  if (highlights.length) {
    return highlights.join("; ");
  }
  return "Chef-driven small plates, seasonal mains, and crafted desserts.";
};

const formatSpecials = (specials = []) => {
  if (Array.isArray(specials) && specials.length) {
    return specials.filter(Boolean).join(" | ");
  }
  return "Spotlight rotating seasonal dishes and zero-proof cocktails.";
};

const safeJoin = (items, fallback = "Not provided") => {
  if (!Array.isArray(items) || !items.length) return fallback;
  return items.filter(Boolean).join(", ");
};

const buildLocationLine = (restaurant = {}) => {
  const parts = [restaurant.address, restaurant.city, restaurant.state, restaurant.country].filter(Boolean);
  return parts.length ? parts.join(", ") : restaurant.address || "Local neighborhood";
};

const buildDefaultSettings = (overrides = {}) => ({
  timezone: overrides.timezone || "America/Chicago",
  defaultSeatingMinutes: overrides.defaultSeatingMinutes || 90,
  maxPartySize: overrides.maxPartySize || 8,
  reservationPolicy:
    overrides.reservationPolicy ||
    "We can book up to 30 days out; larger parties may require a manager's approval.",
  cancellationPolicy:
    overrides.cancellationPolicy ||
    "Please cancel or adjust at least 24 hours in advance to avoid a no-show fee.",
  orderPolicy:
    overrides.orderPolicy ||
    "Pickup orders are usually ready in 20 minutes; deliveries depend on courier availability.",
  privateDiningPolicy:
    overrides.privateDiningPolicy ||
    "For 10+ guests we gather details and have a coordinator return the call within one business day.",
  confirmationChannels: overrides.confirmationChannels || "SMS follow-up plus optional email",
  upsellTips:
    overrides.upsellTips ||
    "Mention chef specials, signature cocktails, or dessert samplers when appropriate.",
  callbackPolicy:
    overrides.callbackPolicy ||
    "Collect the caller's name, number, and topic; promise a manager follow-up within one business day.",
  specials: overrides.specials || [],
  hours: overrides.hours || [],
});

export const buildRestaurantPromptContext = ({ restaurant = {}, menu = [], settings = {} }) => {
  const merged = buildDefaultSettings(settings);
  const hoursLine = formatHours(merged.hours);
  const menuHighlights = formatMenuHighlights(menu);
  const locationLine = buildLocationLine(restaurant);

  return {
    AGENT_NAME: restaurant.agent_name || `${restaurant.name || "Restaurant"} Host`,
    BRAND_NAME: restaurant.name || "Your Restaurant",
    RESTAURANT_ID: restaurant.id || "",
    LOCATION: locationLine,
    TIMEZONE: merged.timezone,
    HOURS_SUMMARY: hoursLine,
    DEFAULT_SEATING_MINUTES: merged.defaultSeatingMinutes,
    MAX_PARTY_SIZE: merged.maxPartySize,
    MENU_HIGHLIGHTS: menuHighlights,
    SPECIALS: formatSpecials(merged.specials),
    RESERVATION_POLICY: merged.reservationPolicy,
    CANCELLATION_POLICY: merged.cancellationPolicy,
    ORDER_POLICY: merged.orderPolicy,
    PRIVATE_DINING_POLICY: merged.privateDiningPolicy,
    CONFIRMATION_CHANNELS: merged.confirmationChannels,
    UPSELL_TIPS: merged.upsellTips,
    CALLBACK_POLICY: merged.callbackPolicy,
    SIGNATURE_TALKING_POINTS: menuHighlights,
    CONTACT_NUMBER: restaurant.phone || "the main restaurant line",
  };
};

export const composeRestaurantPrompt = ({ restaurant, menu, settings }) => {
  const context = buildRestaurantPromptContext({ restaurant, menu, settings });
  return renderTemplate(restaurantPromptTemplate, context);
};

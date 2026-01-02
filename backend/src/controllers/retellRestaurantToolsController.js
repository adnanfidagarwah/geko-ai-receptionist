import { supabase } from "../config/supabase.js";
import { retellClient } from "../config/retell.js";
import { extractParameters, normalizeRequestBody } from "../utils/requestHelpers.js";
import { resolveRestaurantContext } from "../utils/restaurantResolver.js";

const respondError = (res, message, code = "BAD_REQUEST") =>
  res.json({ success: false, error_code: code, message });

const parseISODate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const UPSOLD_CATEGORY_KEYWORDS = [
  "add-ons",
  "addons",
  "add ons",
  "add-on",
  "add on",
  "dessert",
  "desserts",
  "signature dessert",
  "signature desserts",
  "sides & add-ons",
];
const normalizeCategory = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isUpsellCategory = (category) => {
  const normalized = normalizeCategory(category);
  if (!normalized) return false;
  return UPSOLD_CATEGORY_KEYWORDS.some(
    (keyword) => normalized === keyword || normalized.includes(keyword),
  );
};

const mapReservation = (row = {}) => ({
  id: row.id,
  guest_name: row.guest_name,
  guest_phone: row.guest_phone,
  guest_email: row.guest_email,
  party_size: row.party_size,
  reservation_time: row.reservation_time,
  duration_minutes: row.duration_minutes,
  status: row.status,
  special_requests: row.special_requests,
});

const findConflicts = (reservations = [], start, durationMinutes) => {
  const targetStart = start.getTime();
  const targetEnd = targetStart + durationMinutes * 60000;
  return reservations.filter((row) => {
    const rowStart = new Date(row.reservation_time).getTime();
    if (Number.isNaN(rowStart)) return false;
    const rowEnd = rowStart + (Number(row.duration_minutes) || durationMinutes) * 60000;
    return Math.max(rowStart, targetStart) < Math.min(rowEnd, targetEnd);
  });
};

const normalizePhoneValue = (value) => {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00") && digits.length > 2) {
    return `+${digits.slice(2)}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return `+${digits}`;
};
const normalizeDigits = (value) =>
  typeof value === "string" && value ? value.replace(/\D+/g, "") : "";
const PHONE_PLACEHOLDER_VALUES = new Set([
  "caller",
  "caller id",
  "caller-id",
  "caller_id",
  "caller number",
  "caller phone",
  "same",
  "same number",
  "same as caller",
  "unknown",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "not provided",
  "not available",
]);
const sanitizePhoneInput = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (PHONE_PLACEHOLDER_VALUES.has(lowered)) return null;
  const digits = normalizeDigits(trimmed);
  if (!digits) return null;
  return trimmed;
};
const pickPhone = (...values) => {
  for (const value of values) {
    const sanitized = sanitizePhoneInput(value);
    if (sanitized) return sanitized;
  }
  return null;
};
const collectPhoneCandidates = (...values) => {
  const set = new Set();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    set.add(trimmed);

    const normalized = normalizePhoneValue(trimmed);
    if (normalized) set.add(normalized);

    const digits = normalizeDigits(trimmed);
    if (digits) {
      set.add(digits);
      if (!digits.startsWith("+")) {
        set.add(`+${digits}`);
      }
      if (digits.length === 11 && digits.startsWith("1")) {
        const stripped = digits.slice(1);
        if (stripped) {
          set.add(stripped);
          set.add(`+${stripped}`);
        }
      }
    }
  });
  return Array.from(set);
};

const loadNearbyReservations = async ({ restaurantId, windowStart, windowEnd }) => {
  const { data, error } = await supabase
    .from("restaurant_reservations")
    .select("id, reservation_time, duration_minutes, status, guest_name, party_size")
    .eq("restaurant_id", restaurantId)
    .neq("status", "cancelled")
    .gte("reservation_time", windowStart.toISOString())
    .lte("reservation_time", windowEnd.toISOString());
  if (error) throw new Error(error.message);
  return data || [];
};

const ensureRestaurantCustomer = async ({ restaurantId, name, phone, email }) => {
  if (!restaurantId) return;
  const normalizedPhone = normalizePhoneValue(phone);
  if (!normalizedPhone) return;
  const now = new Date().toISOString();
  const { data: existing, error } = await supabase
    .from("restaurant_customers")
    .select("id,total_orders")
    .eq("restaurant_id", restaurantId)
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("restaurant_customers")
      .update({
        full_name: name || null,
        email: email || null,
        phone: normalizedPhone,
        last_order_at: now,
        total_orders: Number(existing.total_orders || 0) + 1,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (updateError) throw new Error(updateError.message);
    return existing.id;
  }

  const { error: insertError } = await supabase.from("restaurant_customers").insert([
    {
      restaurant_id: restaurantId,
      full_name: name || null,
      phone: normalizedPhone,
      email: email || null,
      last_order_at: now,
      total_orders: 1,
    },
  ]);
  if (insertError) throw new Error(insertError.message);
  return null;
};

const UPSALE_STATUSES = new Set(["pitched", "accepted", "declined", "pending"]);
const toSafeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : null;
const normalizeUpsellStatus = (status, fallback = "pending") => {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  return UPSALE_STATUSES.has(normalized) ? normalized : fallback;
};

const logRestaurantUpsell = async ({
  restaurantId,
  callId,
  orderId,
  agentId,
  customerName,
  customerPhone,
  payload = {},
  fallbackPrice = null,
  extraMetadata = null,
}) => {
  if (!restaurantId || !payload || typeof payload !== "object") return;
  const baseMetadata = toSafeObject(payload.metadata) || toSafeObject(payload.meta) || null;
  const metadata = baseMetadata ? { ...baseMetadata } : {};
  if (extraMetadata && typeof extraMetadata === "object") {
    Object.assign(metadata, extraMetadata);
  }

  const priceCandidate = Number(payload.price);
  const fallbackPriceCandidate = Number(fallbackPrice);
  const record = {
    restaurant_id: restaurantId,
    call_id: payload.call_id || payload.callId || callId || null,
    order_id: orderId || null,
    session_id:
      payload.session_id ||
      payload.sessionId ||
      payload.cart_id ||
      payload.cartId ||
      payload.upsell_session_id ||
      payload.upsellSessionId ||
      null,
    agent_id: payload.agent_id || payload.agentId || agentId || null,
    offer_label:
      payload.label ||
      payload.offer_label ||
      payload.offerLabel ||
      payload.title ||
      payload.name ||
      (orderId ? "Upsell Order" : null),
    offer_description:
      payload.description || payload.offer_description || payload.offerDescription || payload.details || null,
    offer_type: payload.offer_type || payload.offerType || payload.type || null,
    price: Number.isFinite(priceCandidate)
      ? priceCandidate
      : Number.isFinite(fallbackPriceCandidate)
        ? fallbackPriceCandidate
        : null,
    status: normalizeUpsellStatus(payload.status, orderId ? "accepted" : "pending"),
    customer_name: payload.customer_name || payload.customerName || customerName || null,
    customer_phone: payload.customer_phone || payload.customerPhone || customerPhone || null,
    metadata: Object.keys(metadata).length ? metadata : null,
  };

  try {
    await supabase.from("restaurant_upsells").insert([record]);
  } catch (error) {
    console.warn("Failed to log restaurant upsell", error?.message || error);
  }
};

export async function toolGetRestaurantCustomerByPhone(req, res) {
  try {
    const parameters = extractParameters(req);
    const body = normalizeRequestBody(req);
    const callPayload = body?.call || {};
    const metadataPayload = callPayload?.metadata || body?.metadata || {};
    const callDirection = String(
      callPayload?.direction || metadataPayload?.direction || body?.direction || body?.call?.direction || "",
    ).toLowerCase();

    const preferredPhone =
      callDirection === "outbound"
        ? pickPhone(
            parameters.caller_phone,
            parameters.to_number,
            parameters.toNumber,
            body?.to_number,
            body?.toNumber,
            body?.metadata?.to_number,
            body?.metadata?.toNumber,
            callPayload?.to_number,
            callPayload?.toNumber,
            callPayload?.metadata?.to_number,
            callPayload?.metadata?.toNumber,
            metadataPayload?.to_number,
            metadataPayload?.toNumber,
            metadataPayload?.caller_phone,
            body?.metadata?.caller_phone,
          )
        : pickPhone(
            parameters.caller_phone,
            parameters.from_number,
            parameters.fromNumber,
            body?.from_number,
            body?.fromNumber,
            body?.metadata?.from_number,
            body?.metadata?.fromNumber,
            callPayload?.from_number,
            callPayload?.fromNumber,
            callPayload?.metadata?.from_number,
            callPayload?.metadata?.fromNumber,
            metadataPayload?.from_number,
            metadataPayload?.fromNumber,
            metadataPayload?.caller_phone,
            body?.metadata?.caller_phone,
          );

    const phoneHintValues = [
      parameters.caller_phone,
      parameters.customer_phone,
      parameters.phone,
      parameters.from_number,
      parameters.fromNumber,
      parameters.to_number,
      parameters.toNumber,
      body?.caller_phone,
      body?.customer_phone,
      body?.phone,
      body?.from_number,
      body?.fromNumber,
      body?.to_number,
      body?.toNumber,
      body?.metadata?.caller_phone,
      body?.metadata?.from_number,
      body?.metadata?.fromNumber,
      body?.metadata?.to_number,
      body?.metadata?.toNumber,
      callPayload?.caller_phone,
      callPayload?.from_number,
      callPayload?.fromNumber,
      callPayload?.to_number,
      callPayload?.toNumber,
      callPayload?.metadata?.from_number,
      callPayload?.metadata?.fromNumber,
      callPayload?.metadata?.to_number,
      callPayload?.metadata?.toNumber,
      metadataPayload?.caller_phone,
      metadataPayload?.from_number,
      metadataPayload?.fromNumber,
      metadataPayload?.to_number,
      metadataPayload?.toNumber,
    ]
      .map(sanitizePhoneInput)
      .filter(Boolean);

    const rawCallerPhone = preferredPhone || phoneHintValues[0];
    if (!rawCallerPhone) {
      return respondError(res, "caller_phone is required");
    }

    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const phoneCandidates = collectPhoneCandidates(...phoneHintValues);

    let customerRow = null;
    if (phoneCandidates.length) {
      const { data, error } = await supabase
        .from("restaurant_customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("phone", phoneCandidates)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }
      customerRow = data;
    }

    if (customerRow) {
      return res.json({
        success: true,
        customer: {
          id: customerRow.id || null,
          full_name: customerRow.full_name || customerRow.name || null,
          phone: customerRow.phone || rawCallerPhone,
          email: customerRow.email || null,
          total_orders: customerRow.total_orders || null,
          last_order_at: customerRow.last_order_at || customerRow.updated_at || null,
          notes: customerRow.notes || null,
        },
      });
    }

    const orderSelect = "id, customer_name, customer_phone, delivery_or_pickup, total_amount, updated_at, created_at";
    let orderRow = null;
    if (phoneCandidates.length) {
      const { data, error } = await supabase
        .from("orders")
        .select(orderSelect)
        .eq("restaurant_id", restaurantId)
        .in("customer_phone", phoneCandidates)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }
      orderRow = data;
    }

    if (!orderRow) {
      const digits = normalizeDigits(rawCallerPhone);
      if (digits) {
        const { data, error } = await supabase
          .from("orders")
          .select(orderSelect)
          .eq("restaurant_id", restaurantId)
          .ilike("customer_phone", `%${digits}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && error.code !== "PGRST116") {
          throw new Error(error.message);
        }
        orderRow = data;
      }
    }

    if (orderRow) {
      return res.json({
        success: true,
        customer: {
          id: null,
          full_name: orderRow.customer_name || null,
          phone: orderRow.customer_phone || rawCallerPhone,
          email: null,
          last_order_at: orderRow.updated_at || orderRow.created_at || null,
          last_order_id: orderRow.id || null,
          last_order_total: orderRow.total_amount || null,
          last_order_mode: orderRow.delivery_or_pickup || "pickup",
        },
      });
    }

    return respondError(res, "Customer not found", "NOT_FOUND");
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolGetMenu(req, res) {
  try {
    const parameters = extractParameters(req);
    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, description, price, category, created_at")
      .eq("restaurant_id", restaurantId)
      .order("category", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const catalog = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price ?? 0),
      category: item.category || "General",
    }));

    return res.json({ success: true, menu: catalog });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolCheckTableAvailability(req, res) {
  try {
    const parameters = extractParameters(req);
    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const partySize = Number(parameters.party_size || parameters.covers || 2);
    const durationMinutes = Number(parameters.duration_minutes || 90);
    const reservationTime = parseISODate(parameters.reservation_time || parameters.slot_start);
    if (!reservationTime) {
      return respondError(res, "reservation_time is required in ISO format");
    }

    const searchWindowStart = new Date(reservationTime.getTime() - durationMinutes * 60000);
    const searchWindowEnd = new Date(reservationTime.getTime() + durationMinutes * 60000);
    const nearby = await loadNearbyReservations({
      restaurantId,
      windowStart: searchWindowStart,
      windowEnd: searchWindowEnd,
    });
    const conflicts = findConflicts(nearby, reservationTime, durationMinutes);
    const available = conflicts.length === 0;

    const suggestions = [];
    if (!available) {
      const increment = Number(parameters.suggestion_increment_minutes || 30);
      let cursor = new Date(reservationTime);
      let attempts = 0;
      while (suggestions.length < 3 && attempts < 12) {
        cursor = new Date(cursor.getTime() + increment * 60000);
        attempts += 1;
        const candidateConflicts = findConflicts(nearby, cursor, durationMinutes);
        if (!candidateConflicts.length) {
          suggestions.push({
            start: cursor.toISOString(),
            party_size: partySize,
            duration_minutes: durationMinutes,
          });
        }
      }
    }

    return res.json({
      success: true,
      availability: {
        available,
        party_size: partySize,
        reservation_time: reservationTime.toISOString(),
        duration_minutes: durationMinutes,
        conflicts: conflicts.map(mapReservation),
        suggestions,
      },
    });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolCreateReservation(req, res) {
  try {
    const parameters = extractParameters(req);
    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const reservationTime = parseISODate(parameters.reservation_time || parameters.slot_start);
    if (!reservationTime) {
      return respondError(res, "reservation_time is required in ISO format");
    }

    const guest = parameters.guest || parameters.customer || {};
    const guestName = guest.full_name || guest.name || parameters.guest_name;
    const guestPhone = guest.phone || parameters.guest_phone;
    const guestEmail = guest.email || parameters.guest_email || null;
    const partySize = Number(parameters.party_size || parameters.covers || guest.party_size || 2);
    const durationMinutes = Number(parameters.duration_minutes || 90);

    if (!guestName || !guestPhone) {
      return respondError(res, "guest name and phone are required");
    }

    // quick availability check
    const searchWindowStart = new Date(reservationTime.getTime() - durationMinutes * 60000);
    const searchWindowEnd = new Date(reservationTime.getTime() + durationMinutes * 60000);
    const nearby = await loadNearbyReservations({
      restaurantId,
      windowStart: searchWindowStart,
      windowEnd: searchWindowEnd,
    });
    const conflicts = findConflicts(nearby, reservationTime, durationMinutes);
    if (conflicts.length) {
      return respondError(res, "Requested slot unavailable", "CONFLICT");
    }

    const payload = {
      restaurant_id: restaurantId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail,
      party_size: partySize,
      reservation_time: reservationTime.toISOString(),
      duration_minutes: durationMinutes,
      special_requests: parameters.special_requests || parameters.notes || null,
      status: parameters.status || "confirmed",
      via_call_id: parameters.call_id || parameters.via_call_id || null,
    };

    const { data, error } = await supabase
      .from("restaurant_reservations")
      .insert([payload])
      .select()
      .single();
    if (error) throw new Error(error.message);

    return res.json({ success: true, reservation: mapReservation(data) });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolPlaceOrder(req, res) {
  try {
    const parameters = extractParameters(req);
    const body = normalizeRequestBody(req);
    const callPayload = body?.call || {};
    const metadataPayload = callPayload.metadata || body?.metadata || {};
    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const rawUpsellObject = toSafeObject(parameters.upsell) || toSafeObject(body?.upsell);
    const hasUpsellFlag =
      Boolean(
        parameters.is_upsell ??
          parameters.upsell_order ??
          parameters.isUpsell ??
          body?.is_upsell ??
          body?.upsell_order,
      );
    const collectArray = (...sources) =>
      sources.flatMap((source) => (Array.isArray(source) ? source.filter((item) => item && typeof item === "object") : []));
    const upsellAttempts = collectArray(
      parameters.upsell_attempts,
      parameters.upsellAttempts,
      body?.upsell_attempts,
      body?.upsellAttempts,
    );

    const items = Array.isArray(parameters.items) ? parameters.items : [];
    if (!items.length) {
      return respondError(res, "items array is required");
    }

    const menuItemIds = Array.from(
      new Set(
        items
          .map((item) => item?.menu_item_id || item?.menuItemId)
          .filter((value) => typeof value === "string" && value.trim()),
      ),
    );

    const categoryByMenuId = {};
    if (menuItemIds.length) {
      try {
        const { data: menuRows = [] } = await supabase
          .from("menu_items")
          .select("id, category")
          .in("id", menuItemIds);
        menuRows.forEach((row) => {
          if (row?.id) {
            categoryByMenuId[row.id] = row.category || null;
          }
        });
      } catch (error) {
        console.warn("Failed to load menu categories for upsell inference", error?.message || error);
      }
    }

    const itemsWithCategory = items.map((item) => {
      const explicitCategory =
        item.category ||
        item.Category ||
        item.category_label ||
        item.categoryLabel ||
        null;
      const resolvedCategory =
        explicitCategory || categoryByMenuId[item.menu_item_id] || categoryByMenuId[item.menuItemId] || null;
      return { ...item, __category: resolvedCategory };
    });

    const customer = parameters.customer || {};
    const customerName =
      customer.full_name ||
      customer.name ||
      parameters.customer_name ||
      body?.customer_name ||
      "Guest";

    const findCallId = () =>
      parameters.call_id ||
      parameters.via_call_id ||
      body?.call_id ||
      body?.call?.call_id ||
      body?.call?.id ||
      null;
    const resolveAgentId = () =>
      parameters.agent_id ||
      parameters.agentId ||
      body?.agent_id ||
      body?.agentId ||
      callPayload.agent_id ||
      callPayload.agentId ||
      callPayload.agent?.id ||
      metadataPayload.agent_id ||
      metadataPayload.agentId ||
      null;
    const callId = findCallId();
    const agentId = resolveAgentId();

    const resolveCustomerPhone = async () => {
      const directPhone = pickPhone(
        customer.phone,
        parameters.customer_phone,
        parameters.customerPhone,
        parameters.phone,
        parameters.contact_phone,
        parameters.caller_phone,
        parameters.callerPhone,
        body?.customer_phone,
        body?.caller_phone,
        body?.metadata?.caller_phone,
        body?.metadata?.phone_number,
        body?.call?.customer?.phone,
        body?.call?.metadata?.caller_phone,
      );

      if (directPhone) return directPhone;

      const fromNumber = pickPhone(
        parameters.from_number,
        parameters.fromNumber,
        body?.from_number,
        body?.fromNumber,
        body?.metadata?.from_number,
        body?.metadata?.fromNumber,
        callPayload?.from_number,
        callPayload?.fromNumber,
        callPayload?.metadata?.from_number,
        callPayload?.metadata?.fromNumber,
        metadataPayload?.from_number,
        metadataPayload?.fromNumber,
      );

      const toNumber = pickPhone(
        parameters.to_number,
        parameters.toNumber,
        body?.to_number,
        body?.toNumber,
        callPayload?.to_number,
        callPayload?.toNumber,
        callPayload?.metadata?.to_number,
        callPayload?.metadata?.toNumber,
        metadataPayload?.to_number,
        metadataPayload?.toNumber,
      );

      const callDirection = String(
        callPayload?.direction || metadataPayload?.direction || body?.direction || body?.call?.direction || "",
      ).toLowerCase();

      if (callDirection === "outbound" && toNumber) return toNumber;
      if (callDirection === "inbound" && fromNumber) return fromNumber;

      const phoneCandidate = fromNumber || toNumber || null;
      if (phoneCandidate) return phoneCandidate;

      const callId = findCallId();
      if (callId && retellClient?.call?.retrieve) {
        try {
          const callDetails = await retellClient.call.retrieve(callId);
          const fallbackFrom = sanitizePhoneInput(callDetails?.from_number);
          const fallbackTo = sanitizePhoneInput(callDetails?.to_number);
          if (callDirection === "outbound") return fallbackTo || fallbackFrom || null;
          return fallbackFrom || fallbackTo || null;
        } catch (error) {
          console.warn("Failed to fetch call details for phone fallback", error?.message || error);
        }
      }
      return null;
    };

    const customerPhone = await resolveCustomerPhone();
    const deliveryMode = parameters.delivery_or_pickup || parameters.fulfillment || "pickup";
    const deliveryAddress = parameters.delivery_address || parameters.address || null;

    const totalFromPayload = Number(parameters.total_amount);
    const computedTotal = items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);
      return sum + price * quantity;
    }, 0);
    const totalAmount = Number.isFinite(totalFromPayload) ? totalFromPayload : computedTotal;

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          restaurant_id: restaurantId,
          customer_name: customerName,
          customer_phone: customerPhone,
          items,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          delivery_or_pickup: deliveryMode,
          status: parameters.status || "pending",
          estimated_time: parameters.estimated_time || null,
          via_call_id: parameters.call_id || parameters.via_call_id || null,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (customerPhone) {
      try {
        await ensureRestaurantCustomer({
          restaurantId,
          name: customerName,
          phone: customerPhone,
          email: customer.email || parameters.customer_email || null,
        });
      } catch (customerError) {
        console.warn("Failed to upsert restaurant customer", customerError?.message || customerError);
      }
    }

    const logPromises = [];
    if (upsellAttempts.length) {
      upsellAttempts.forEach((attempt) => {
        logPromises.push(
          logRestaurantUpsell({
            restaurantId,
            callId,
            orderId: null,
            agentId,
            customerName,
            customerPhone,
            payload: attempt,
          }),
        );
      });
    }

    const upsellOrderPayload =
      rawUpsellObject ||
      (hasUpsellFlag
        ? {
            status: "accepted",
            label: parameters.upsell_label || body?.upsell_label || "Upsell Order",
          }
        : null);

    if (upsellOrderPayload) {
      logPromises.push(
        logRestaurantUpsell({
          restaurantId,
          callId,
          orderId: data.id,
          agentId,
          customerName,
          customerPhone,
          payload: upsellOrderPayload,
          fallbackPrice: totalAmount,
          extraMetadata: {
            order_total: totalAmount,
            item_count: items.length,
            delivery_mode: deliveryMode,
            items,
          },
        }),
      );
    }

    if (logPromises.length) {
      await Promise.all(logPromises);
    }

    if (!upsellOrderPayload) {
      const hasPrimaryItems = itemsWithCategory.some((item) => !isUpsellCategory(item.__category));
      const inferredUpsellItems = hasPrimaryItems
        ? itemsWithCategory.filter((item) => isUpsellCategory(item.__category))
        : [];

      if (inferredUpsellItems.length) {
        await Promise.all(
          inferredUpsellItems.map((item) =>
            logRestaurantUpsell({
              restaurantId,
              callId,
              orderId: data.id,
              agentId,
              customerName,
              customerPhone,
              payload: {
                label: item.name || item.offer_label || "Add-on",
                price: item.price,
                status: "accepted",
                metadata: {
                  auto_inferred: true,
                  category: item.__category || null,
                  menu_item_id: item.menu_item_id || item.menuItemId || null,
                },
              },
              extraMetadata: {
                order_total: totalAmount,
                item_count: items.length,
                delivery_mode: deliveryMode,
                items,
              },
            }),
          ),
        );
      }
    }

    return res.json({ success: true, order: data });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

export async function toolGetOrderStatus(req, res) {
  try {
    const parameters = extractParameters(req);
    const { restaurantId } = await resolveRestaurantContext(req, parameters.restaurant_id);
    if (!restaurantId) {
      return respondError(res, "restaurant_id could not be resolved", "BAD_REQUEST");
    }

    const orderId = parameters.order_id || parameters.id;
    const customerPhone = parameters.customer_phone || parameters.phone;
    if (!orderId && !customerPhone) {
      return respondError(res, "order_id or customer_phone is required");
    }

    let query = supabase.from("orders").select("*").eq("restaurant_id", restaurantId);
    if (orderId) {
      query = query.eq("id", orderId);
    } else if (customerPhone) {
      query = query.eq("customer_phone", customerPhone).order("created_at", { ascending: false });
    }
    query = query.limit(1);

    const { data, error } = await query.maybeSingle();
    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }
    if (!data) {
      return respondError(res, "Order not found", "NOT_FOUND");
    }

    return res.json({ success: true, order: data });
  } catch (error) {
    return respondError(res, error.message, "SERVER_ERROR");
  }
}

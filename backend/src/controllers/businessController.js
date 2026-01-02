
import { supabase } from "../config/supabase.js";
import { retellClient } from "../config/retell.js";
import { composeRestaurantPrompt } from "../utils/restaurantPromptComposer.js";
import { buildRetellTools } from "../utils/retell/toolsConfig.js";

const selectRestaurantBaseFields = [
  "id",
  "name",
  "address",
  "phone",
  "agent_id",
  "llm_id",
  "upsell_prompt",
];

const PUBLIC_BASE_RAW =
  process.env.PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  process.env.APP_URL ||
  process.env.PUBLIC_URL ||
  "";
const PUBLIC_BASE = PUBLIC_BASE_RAW.replace(/\/$/, "");

async function rebuildRestaurantPrompt(restaurant, overrideSettings = {}, options = {}) {
  if (!restaurant?.id || !restaurant.llm_id) {
    return { updated: false };
  }

  const { data: menuItems = [], error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,description,price,category,created_at")
    .eq("restaurant_id", restaurant.id)
    .limit(50);

  if (menuError) throw new Error(menuError.message);

  const settings =
    overrideSettings && Object.keys(overrideSettings).length
      ? overrideSettings
      : restaurant.upsell_prompt
        ? { upsellTips: restaurant.upsell_prompt }
        : {};

  const general_prompt = composeRestaurantPrompt({
    restaurant,
    menu: menuItems ?? [],
    settings,
  });

  const updatePayload = { general_prompt };
  const includeTools = options?.includeTools === true;

  if (includeTools) {
    const baseUrl = PUBLIC_BASE || process.env.API_BASE_URL || "http://localhost:3300";
    updatePayload.general_tools = buildRetellTools({
      baseUrl,
      secret: process.env.RETELL_TOOL_SECRET,
      orgType: "Restaurant",
    });
    updatePayload.tool_call_strict_mode = true;
    updatePayload.default_dynamic_variables = {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_phone: restaurant.phone,
    };
  }

  await retellClient.llm.update(restaurant.llm_id, updatePayload);
  return { updated: true, toolsUpdated: includeTools };
}

export async function listRestaurants(req, res) {
  const { data, error } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ restaurants: data });
}

export async function createRestaurant(req, res) {
  const { name, address, phone } = req.body;
  const owner = req.user?.sub;
  const { data, error } = await supabase.from("restaurants").insert([{ owner, name, address, phone }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await supabase.from("memberships").insert([{ user_id: owner, org_model: "Restaurant", org_id: data.id, role: "owner" }]);
  res.json({ restaurant: data });
}

export async function listMenu(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase.from("menu_items").select("*").eq("restaurant_id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data });
}

export async function createMenuItem(req, res) {
  const { id } = req.params;
  const { name, description, price, category } = req.body;
  const { data, error } = await supabase.from("menu_items")
    .insert([{ restaurant_id: id, name, description, price, category }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ item: data });
}

export async function editMenuItem(req, res) {
  const { id, itemId } = req.params;
  const { name, description, price, category } = req.body;
  const { data, error } = await supabase.from("menu_items")
    .update({ name, description, price, category })
    .eq("restaurant_id", id)
    .eq("id", itemId)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ item: data });
}

export async function deleteMenuItem(req, res) {
  const { id, itemId } = req.params;
  
  if (!id || !itemId) {
    return res.status(400).json({ error: "Missing restaurantId or itemId" });
  }
  const { data, error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("restaurant_id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Menu item not found" });
  }
  return res.json({
    message: "Menu item deleted successfully",
    item: data
  });
}

export async function listClinics(req, res) {
  const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ clinics: data });
}

export async function createClinic(req, res) {
  const owner = req.user?.sub;
  const { name, address, phone, services = [] } = req.body;
  const { data: clinic, error } = await supabase.from("clinics").insert([{ owner, name, address, phone }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  if (services.length) {
    const rows = services.map(s => ({ clinic_id: clinic.id, name: s.name, duration_minutes: Number(s.durationMinutes||30), price: Number(s.price||0) }));
    await supabase.from("clinic_services").insert(rows);
  }
  await supabase.from("memberships").insert([{ user_id: owner, org_model: "Clinic", org_id: clinic.id, role: "owner" }]);
  res.json({ clinic });
}

export async function listOrdersByRestaurant(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase.from("orders").select("*").eq("restaurant_id", id).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
}

export async function updateOrder(req, res) {
  const { id: restaurantId, orderId } = req.params;
  const body = req.body || {};

  const allowedStatuses = new Set(["pending", "confirmed", "preparing", "ready", "completed", "cancelled", "out_for_delivery", "delivered"]);
  const allowedFulfillment = new Set(["delivery", "pickup"]);

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, "customer_name")) {
    updates.customer_name = body.customer_name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "customer_phone")) {
    updates.customer_phone = body.customer_phone;
  }

  if (Object.prototype.hasOwnProperty.call(body, "items")) {
    if (!Array.isArray(body.items)) {
      return res.status(400).json({ error: "items must be an array" });
    }
    updates.items = body.items;
  }

  if (Object.prototype.hasOwnProperty.call(body, "total_amount")) {
    const total = Number(body.total_amount);
    if (!Number.isFinite(total)) {
      return res.status(400).json({ error: "total_amount must be numeric" });
    }
    updates.total_amount = total;
  }

  if (Object.prototype.hasOwnProperty.call(body, "delivery_address")) {
    updates.delivery_address = body.delivery_address;
  }

  if (Object.prototype.hasOwnProperty.call(body, "delivery_or_pickup")) {
    const fulfillment = String(body.delivery_or_pickup || "").trim().toLowerCase();
    if (!allowedFulfillment.has(fulfillment)) {
      return res.status(400).json({ error: "delivery_or_pickup must be delivery or pickup" });
    }
    updates.delivery_or_pickup = fulfillment;
  }

  if (Object.prototype.hasOwnProperty.call(body, "estimated_time")) {
    updates.estimated_time = body.estimated_time || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = String(body.status || "").trim().toLowerCase();
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: "Unsupported status value" });
    }
    updates.status = status;
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "No updatable fields provided" });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error?.code === "PGRST116") return res.status(404).json({ error: "Order not found" });
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Order not found" });

  res.json({ order: data });
}

export async function deleteOrder(req, res) {
  const { id: restaurantId, orderId } = req.params;

  if (!restaurantId || !orderId) {
    return res.status(400).json({ error: "Missing restaurantId or orderId" });
  }

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json({
    message: "Order deleted successfully",
    order: data
  });
}

export async function listCustomersByRestaurant(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("restaurant_customers")
    .select("*")
    .eq("restaurant_id", id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ customers: data ?? [] });
}

export async function listUpsellsByRestaurant(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("restaurant_upsells")
    .select("*")
    .eq("restaurant_id", id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ upsells: data ?? [] });
}

export async function listAppointmentsByClinic(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase.from("appointments").select("*").eq("clinic_id", id).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ appointments: data });
}

export async function listPatientsByClinic(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "clinic id is required" });

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ patients: data ?? [] });
}

export async function getRestaurantSettings(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "restaurant id is required" });

  const { data, error } = await supabase
    .from("restaurants")
    .select(selectRestaurantBaseFields.join(","))
    .eq("id", id)
    .single();

  if (error?.code === "PGRST116") return res.status(404).json({ error: "Restaurant not found" });
  if (error) return res.status(400).json({ error: error.message });

  res.json({
    settings: { upsellPrompt: data?.upsell_prompt ?? "" },
    restaurant: {
      id: data?.id,
      name: data?.name,
      agent_id: data?.agent_id,
      llm_id: data?.llm_id,
    },
  });
}

export async function saveRestaurantSettings(req, res) {
  const { id } = req.params;
  const { upsellPrompt } = req.body || {};

  if (!id) return res.status(400).json({ error: "restaurant id is required" });

  const trimmedPrompt =
    typeof upsellPrompt === "string" ? upsellPrompt.trim() : upsellPrompt ?? "";
  const normalizedPrompt = trimmedPrompt ? trimmedPrompt : null;

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select(selectRestaurantBaseFields.join(","))
    .eq("id", id)
    .single();

  if (restaurantError?.code === "PGRST116") {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  if (restaurantError) return res.status(400).json({ error: restaurantError.message });

  let agentUpdated = false;
  if (restaurant.llm_id) {
    try {
      const { updated } = await rebuildRestaurantPrompt(
        { ...restaurant, upsell_prompt: normalizedPrompt },
        normalizedPrompt ? { upsellTips: normalizedPrompt } : {},
      );
      agentUpdated = updated;
    } catch (error) {
      console.error("Failed to update restaurant agent prompt", error?.message || error);
      return res.status(502).json({
        error: "Failed to update agent prompt. Please try again.",
        details: error?.message,
      });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("restaurants")
    .update({ upsell_prompt: normalizedPrompt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,name,upsell_prompt,agent_id,llm_id")
    .single();

  if (updateError) return res.status(400).json({ error: updateError.message });

  res.json({
    settings: { upsellPrompt: updated?.upsell_prompt ?? "" },
    agentUpdated,
    restaurant: {
      id: updated?.id,
      name: updated?.name,
      agent_id: updated?.agent_id,
      llm_id: updated?.llm_id,
    },
  });
}

export async function refreshRestaurantPrompt(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "restaurant id is required" });

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select(selectRestaurantBaseFields.join(","))
    .eq("id", id)
    .single();

  if (error?.code === "PGRST116") {
    return res.status(404).json({ error: "Restaurant not found" });
  }
  if (error) return res.status(400).json({ error: error.message });

  if (!restaurant?.llm_id) {
    return res.status(400).json({ error: "Restaurant is missing llm_id" });
  }

  try {
    const { updated, toolsUpdated } = await rebuildRestaurantPrompt(
      restaurant,
      {},
      { includeTools: true },
    );
    return res.json({
      ok: true,
      updated,
      toolsUpdated,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        agent_id: restaurant.agent_id,
        llm_id: restaurant.llm_id,
      },
    });
  } catch (err) {
    console.error("Failed to refresh restaurant prompt", err?.message || err);
    return res.status(502).json({ error: "Failed to refresh agent prompt", details: err?.message });
  }
}

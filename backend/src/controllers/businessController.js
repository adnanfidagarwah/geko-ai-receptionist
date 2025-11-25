
import { supabase } from "../config/supabase.js";

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

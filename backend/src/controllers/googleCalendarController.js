import { supabase } from "../config/supabase.js";
import { generateGoogleAuthUrl } from "../utils/google/oauth.js";

export const getGoogleCalendarStatus = async (req, res) => {
  try {
    const clinicId = req.params.id;
    if (!clinicId) {
      return res.status(400).json({ error: "clinic_id is required" });
    }

    const { data, error } = await supabase
      .from("clinics")
      .select("name, google_refresh_token, google_calendar_id")
      .eq("id", clinicId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    let connectUrl = null;
    let oauthConfigured = true;
    try {
      connectUrl = generateGoogleAuthUrl(clinicId);
    } catch (err) {
      oauthConfigured = false;
    }

    return res.json({
      clinic_id: clinicId,
      clinic_name: data.name || null,
      connected: Boolean(data.google_refresh_token),
      google_calendar_id: data.google_calendar_id || "primary",
      oauth_configured: oauthConfigured,
      connect_url: connectUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

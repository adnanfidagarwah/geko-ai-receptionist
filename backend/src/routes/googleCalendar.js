// routes/googleCalendar.js
import express from "express";
import { supabase } from "../config/supabase.js";
import { buildOAuthClient, generateGoogleAuthUrl } from "../utils/google/oauth.js";

const router = express.Router();

// 1) Send user to Google consent screen
router.get("/oauth/url", (req, res) => {
  const { clinic_id } = req.query; // pass from dashboard
  if (!clinic_id) return res.status(400).json({ error: "clinic_id is required" });

  try {
    const url = generateGoogleAuthUrl(clinic_id);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2) OAuth callback – save refresh_token + pick calendar
router.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const st = JSON.parse(state || "{}");
    const clinic_id = st.clinic_id;
    if (!clinic_id) return res.status(400).send("Missing clinic_id in state");

    const oAuth2 = buildOAuthClient();
    const { tokens } = await oAuth2.getToken(code);
    // tokens.refresh_token is what we need long term
    if (!tokens.refresh_token) {
      return res.status(400).send("No refresh_token received; try removing app access & reconnect.");
    }

    // Save refresh token to clinic
    const { error } = await supabase
      .from("clinics")
      .update({ google_refresh_token: tokens.refresh_token })
      .eq("id", clinic_id);

    if (error) throw new Error(error.message);

    // Optionally: auto-set calendar_id = 'primary'
    await supabase.from("clinics")
      .update({ google_calendar_id: "primary" })
      .eq("id", clinic_id);

    res.send("Google Calendar connected ✔️ You can close this tab.");
  } catch (e) {
    console.error(e);
    res.status(500).send("OAuth error: " + e.message);
  }
});

export default router;

import { google } from "googleapis";

const ensureGoogleConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3300/google/oauth/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client is not configured (missing client id/secret).");
  }

  return { clientId, clientSecret, redirectUri };
};

export const buildOAuthClient = () => {
  const { clientId, clientSecret, redirectUri } = ensureGoogleConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const generateGoogleAuthUrl = (clinicId) => {
  if (!clinicId) {
    throw new Error("clinic_id is required to generate Google OAuth URL.");
  }
  const client = buildOAuthClient();
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: JSON.stringify({ clinic_id: clinicId }),
  });
};

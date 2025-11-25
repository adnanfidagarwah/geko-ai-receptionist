// utils/gcal.js
import { google } from "googleapis";

export async function getCalendarClient({ clientId, clientSecret, refreshToken }) {
  const oAuth2 = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oAuth2 });
}

export async function createEvent({ oauth, calendarId = "primary", appt }) {
  const cal = await getCalendarClient(oauth);
  const event = {
    summary: appt.title ?? `Appointment: ${appt.patientName}`,
    description: appt.notes ?? "",
    location: appt.location ?? "",
    start: { dateTime: appt.startISO, timeZone: appt.tz || "America/Chicago" },
    end:   { dateTime: appt.endISO,   timeZone: appt.tz || "America/Chicago" },
    attendees: appt.patientEmail ? [{ email: appt.patientEmail, displayName: appt.patientName }] : [],
    reminders: { useDefault: true },
  };
  const { data } = await cal.events.insert({ calendarId, requestBody: event });
  return data; // has .id
}

export async function updateEvent({ oauth, calendarId, eventId, appt }) {
  const cal = await getCalendarClient(oauth);
  const { data } = await cal.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary: appt.title,
      description: appt.notes,
      start: { dateTime: appt.startISO, timeZone: appt.tz },
      end:   { dateTime: appt.endISO,   timeZone: appt.tz },
    },
  });
  return data;
}

export async function deleteEvent({ oauth, calendarId, eventId }) {
  const cal = await getCalendarClient(oauth);
  await cal.events.delete({ calendarId, eventId });
}

export async function isBusy({ oauth, calendarId, startISO, endISO, tz }) {
  const cal = await getCalendarClient(oauth);
  const { data } = await cal.freebusy.query({
    requestBody: {
      timeMin: startISO,
      timeMax: endISO,
      timeZone: tz,
      items: [{ id: calendarId }],
    },
  });
  const periods = data.calendars?.[calendarId]?.busy || [];
  return periods.length > 0;
}

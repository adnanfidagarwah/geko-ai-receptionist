# Setup & Integration Guide

1) Copy environment:
```
cp .env.example .env
```
Fill:
```

JWT_SECRET=change_me
RETELL_API_KEY=your_retell_api_key
PORT=3000
```

2) Install & Run:
```
npm install
npm run dev
```

3) Seed demo data (optional):
```
npm run seed
```

4) Retell Agent
- Configure your Retell Agent with custom tools pointing to these URLs:
  - Book Appointment → POST `{BASE_URL}/retell/functions/bookAppointment`
  - Place Order     → POST `{BASE_URL}/retell/functions/placeOrder`
  - Get Slots       → POST `{BASE_URL}/retell/functions/getAvailableSlots`
- Set your webhook for call events to:
  - `{BASE_URL}/retell/webhooks/call-events`

5) Testing outbound calls
Use `POST /api/calls` with body:
```
{ "to_number": "+1xxxxxxxxxx" }
```
This uses the Retell SDK client (`src/services/retellService.js`).

6) Security
- Add signature verification for webhooks (e.g., via `X-Retell-Signature`).
- Add auth middleware to protect business CRUD routes.
- Add rate limiting & validation in production.

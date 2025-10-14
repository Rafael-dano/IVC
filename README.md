# IVContent

**AI-powered content repurposing & transcription** — turn long-form video or audio into reusable content.  
Live site: **https://www.ivcontent.com**

---

## Tech Stack

- **Frontend**: Vite + React, i18next
- **Backend**: Node.js (Express)
- **DB/Auth**: Supabase (Postgres + Auth)
- **Payments**: Stripe (Subscriptions + One-time/LTD)
- **Analytics**: GA4 (with Consent Mode), Microsoft Clarity, Bing Webmaster Tools
- **Error/UX Analytics**: PostHog (user-consented)
- **Hosting**: Frontend on Vercel, API on Render

---

## Local Development

### 1) Install
pnpm install

### 2) Environment
cp .env.example .env
# Fill in keys (Stripe, Supabase, Sentry, etc.)

### 3) Run
pnpm dev           # frontend (Vite)
pnpm dev:server    # backend (Express)
Frontend served at http://localhost:5173, Backend at http://localhost:5051 (by default).

---

## Environment Variables

### Frontend (Vite)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE (optional; defaults to same-origin)
VITE_GA4_ID (e.g. G-XXXXXXXX)
VITE_CLARITY_ID (e.g. tqXXXX)
VITE_BING_SITE_VERIFICATION (optional, if using meta tag)
VITE_POSTHOG_KEY (if using PostHog)
VITE_POSTHOG_HOST (e.g. https://us.i.posthog.com)

### Backend
secret keys xxxxxxxxxx

---

## CORS & CSP

### CORS allowlist lives in backend/cors.js.
Configure env vars:
SITE_URL, FRONTEND_URL, RENDER_EXTERNAL_URL
CORS_ALLOWLIST (comma-separated exact URLs)
CORS_ALLOW_SUFFIXES (e.g. .vercel.app for previews)

### CSP is delivered by Netlify/Vercel _headers and allows:
Stripe (js.stripe.com, api.stripe.com)
Supabase (*.supabase.co)
PostHog (us.i.posthog.com, us-assets.i.posthog.com)
GA4 (www.googletagmanager.com, www.google-analytics.com)
Clarity (www.clarity.ms, *.clarity.ms)
Sentry (*.sentry.io)
YouTube in frame-src (if embedded on the LTD page)

---

## Payments

Customer Portal (Stripe Billing) created server-side at /api/billing/portal.
Checkouts:
/api/checkout/annual (region-aware)
/api/checkout/lifetime-400 (LTD one-time)
Webhooks (/webhooks/stripe) update profiles.plan, renews_at, and decrement LTD stock.

---

## Data & Privacy

Consent gating for GA4/PostHog/Clarity lives in frontend/src/analytics/consent.js.
Users can disable analytics from Settings.
Delete account (legal erasure): DELETE /api/account cancels Stripe subs, purges related tables, removes profile & Supabase auth user.

---

## Deploy

Frontend (Vercel):
Set Vite env vars in the Project Settings → Environment Variables, enable previews if needed, and ensure domain is added to CORS allowlist.

Backend (Render):
Add all backend env vars, set Auto Deploy from Git, expose port 5051, and configure the Health Check path /health.

---

## Troubleshooting

CORS blocked: check backend/cors.js and logs. Add your preview domain (e.g., https://ivc-*.vercel.app) to CORS_ALLOW_SUFFIXES or CORS_ALLOWLIST.
CSP violations: update _headers to include domains in script-src, connect-src, img-src, frame-src.
Stripe errors: confirm prices exist in Stripe, env var names match, and webhooks are configured.
No analytics events: consent not granted → click “Enable analytics” in Settings and check GA4 Realtime/DebugView.

---

## License

All rights reserved © IVContent.
MIT License
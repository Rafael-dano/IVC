import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./i18n.js";
import * as Sentry from "@sentry/react";
import { HelmetProvider } from "react-helmet-async";
import { initAnalytics } from "./analytics";
import { ensureAnalyticsInitIfConsented, getAnalyticsConsent } from "./analytics/consent";
import { supabase } from "./api/supabaseClient";
import CookieConsent from "./components/CookieConsent";

// ---- Gate Sentry on consent ----
function hasAnalyticsConsent() {
  try {
    const v = getAnalyticsConsent?.();
    if (v === "granted") return true;
  } catch {}
  try {
    const raw = localStorage.getItem("ivc-consent");
    if (!raw) return false;
    if (raw === "accepted" || raw === "granted") return true;
    const obj = JSON.parse(raw);
    return !!(obj?.accepted || obj?.analytics === "granted" || obj?.value === "accepted");
  } catch {}
  return false;
}

function maybeInitSentry() {
  if (window.__sentryInit) return;
  if (!import.meta.env.PROD) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND;
  if (!dsn) return;
  if (!hasAnalyticsConsent()) return;

  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
  window.__sentryInit = true;
}

// Attempt on first load
maybeInitSentry();
// Try again when user accepts cookies
window.addEventListener("ivc:consent-accepted", () => {
  maybeInitSentry();
});

window.Sentry = Sentry;

// Your analytics init remains gated by your consent util
initAnalytics();
ensureAnalyticsInitIfConsented(supabase);

// Console convenience
if (typeof window !== "undefined") {
  window.supabase = supabase;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={<div style={{ padding: 16 }}>Something went wrong. Please refresh.</div>}
      showDialog={false}
    >
      <>
        <App />
        <CookieConsent />
      </>
    </Sentry.ErrorBoundary>
  </StrictMode>
);

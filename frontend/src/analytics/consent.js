// frontend/src/analytics/consent.js
import { initPosthog, identifyFromSupabase } from "./posthog";

const KEY = "consent.analytics"; // "granted" | "denied"

// --- utils ---
export function getAnalyticsConsent() {
  return localStorage.getItem(KEY);
}
export function setAnalyticsConsent(value) {
  localStorage.setItem(KEY, value);
}

// Safe helpers around GA4 & Clarity:
function gaConsentUpdate(mode) {
  // mode: "granted" | "denied"
  const granted = mode === "granted";
  try {
    window.gtag?.("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
      functionality_storage: granted ? "granted" : "denied",
      personalization_storage: granted ? "granted" : "denied",
      security_storage: "granted",
    });
  } catch (e) {
    // no-op
  }
}

function loadClarityOnce(projectId) {
  if (!projectId) return;
  if (window.__clarity_loaded__) return;
  if (window.__clarity_blocked__) return; // set by revoke()
  window.__clarity_loaded__ = true;

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", import.meta?.env?.VITE_CLARITY_ID || ""); // set VITE_CLARITY_ID
}

// --- public API you already use ---
export function ensureAnalyticsInitIfConsented(supabase) {
  try {
    if (getAnalyticsConsent() === "granted") {
      // GA on
      gaConsentUpdate("granted");

      // Clarity only when consented
      loadClarityOnce(import.meta?.env?.VITE_CLARITY_ID);

      // PostHog
      initPosthog();
      identifyFromSupabase(supabase);
    } else {
      // default/denied
      gaConsentUpdate("denied");
    }
  } catch {}
}

export function grantAnalytics(supabase) {
  setAnalyticsConsent("granted");

  // GA on
  gaConsentUpdate("granted");

  // Load Clarity now that user consented
  loadClarityOnce(import.meta?.env?.VITE_CLARITY_ID);

  // PostHog
  initPosthog();
  identifyFromSupabase(supabase);

  alert("Analytics enabled.");
}

export function revokeAnalytics() {
  setAnalyticsConsent("denied");

  // GA off
  gaConsentUpdate("denied");

  // PostHog off
  try {
    window?.posthog?.opt_out_capturing?.();
    window?.posthog?.reset?.();
  } catch {}

  // Prevent future Clarity loads on this page/session
  window.__clarity_blocked__ = true;

  alert("Analytics disabled. Reload to apply.");
}

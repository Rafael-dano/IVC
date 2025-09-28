import { initPosthog, identifyFromSupabase } from "./posthog";

const KEY = "consent.analytics"; // "granted" | "denied"

export function getAnalyticsConsent() {
  return localStorage.getItem(KEY);
}
export function setAnalyticsConsent(value) {
  localStorage.setItem(KEY, value);
}

export function ensureAnalyticsInitIfConsented(supabase) {
  try {
    if (getAnalyticsConsent() === "granted") {
      initPosthog();
      identifyFromSupabase(supabase);
    }
  } catch {}
}

export function grantAnalytics(supabase) {
  setAnalyticsConsent("granted");
  initPosthog();
  identifyFromSupabase(supabase);
}

export function revokeAnalytics() {
  setAnalyticsConsent("denied");
  try {
    window?.posthog?.opt_out_capturing?.();
    window?.posthog?.reset?.();
  } catch {}
}

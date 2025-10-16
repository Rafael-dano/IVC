import { getAnalyticsConsent } from "./consent";

/**
 * Send a GA4 event if analytics consent has been granted.
 * @param {string} name
 * @param {Record<string, any>} [params]
 */
export function sendEvent(name, params = {}) {
  if (!name) return;

  try {
    if (typeof window === "undefined") return;
    if (getAnalyticsConsent() !== "granted") return;
    window.gtag?.("event", name, params);
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("GA sendEvent failed", name, err);
    }
  }
}
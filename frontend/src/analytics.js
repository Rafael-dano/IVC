import posthog from "posthog-js";

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) return;

  // Respect user choice (marketing_opt_in) when you fetch it; for now just init.
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    autocapture: true,
    loaded: () => {
      // Optional: disable if Do-Not-Track
      if (navigator.doNotTrack === "1") posthog.opt_out_capturing();
    },
  });
}

export function track(name, props={}) { try { posthog.capture(name, props); } catch {} }

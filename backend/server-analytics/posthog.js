// backend/server-analytics/posthog.js
import { PostHog } from "posthog-node";

export const ph = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    })
  : null;

// Tiny helper: always add `src: "backend"` to properties
if (ph) {
  const orig = ph.capture.bind(ph);
  ph.capture = (evt) => {
    try {
      const props = { ...(evt?.properties || {}), src: "backend" };
      return orig({ ...evt, properties: props });
    } catch (_) {}
  };
}

// Optional wrapper if you prefer calling this elsewhere
export function phCapture(evt) {
  try { ph?.capture(evt); } catch {}
}

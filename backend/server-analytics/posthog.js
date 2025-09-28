
import { PostHog } from "posthog-node";

export const ph = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    })
  : null;

if (ph) {
  const orig = ph.capture.bind(ph);
  ph.capture = (evt) => {
    try {
      const props = { ...(evt?.properties || {}), src: "backend" };
      return orig({ ...evt, properties: props });
    } catch (_) {}
  };
}

export function phCapture(evt) {
  try { ph?.capture(evt); } catch {}
}

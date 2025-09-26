// frontend/src/analytics/posthog.js
import posthog from "posthog-js";

export function initPosthog() {
  if (!import.meta.env.PROD) return; // only in prod builds
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,        // capture initial pageview
    autocapture: true,             // clicks, etc. (disable if you prefer)
    persistence: "localStorage",
  });

  // Expose for console testing (optional; remove later if you want)
  // @ts-ignore
  window.posthog = posthog;
}

export async function identifyFromSupabase(supabase) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    // Minimal PII: id + email (if your policy allows)
    posthog.identify(user.id, { email: user.email });
  } catch {}
}

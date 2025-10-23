import posthog from "posthog-js";

export function initPosthog() {
  const key  = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

  // Expose for DevTools regardless, so you can run `posthog.capture(...)`
  // @ts-ignore
  window.posthog = posthog;

  // Only fully init in production AND if a key is present
  if (!import.meta.env.PROD || !key) {
    console.info("[PostHog] disabled", {
      prod: !!import.meta.env.PROD,
      hasKey: !!key,
    });
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    autocapture: true,
    persistence: "localStorage",
  });

  console.info("[PostHog] initialized", { host });
}

export async function identifyFromSupabase(supabase) {
  try {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;
    if (!u) return;
    posthog.identify(u.id, { email: u.email });
  } catch {}
}

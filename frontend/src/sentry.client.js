import * as Sentry from "@sentry/browser";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND;
  if (!import.meta.env.PROD || !dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: "production",
  });
}

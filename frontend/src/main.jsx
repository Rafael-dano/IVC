import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./i18n.js";
import * as Sentry from "@sentry/react";
import { initAnalytics } from "./analytics";
import { initPosthog, identifyFromSupabase } from "./analytics/posthog";
import { supabase } from "./api/supabaseClient";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN_FRONTEND) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1, 
    environment: import.meta.env.MODE,
  });
}
window.Sentry = Sentry;
initAnalytics(); 
initPosthog();
identifyFromSupabase(supabase);


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={<div style={{ padding: 16 }}>Something went wrong. Please refresh.</div>}
      showDialog={false}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
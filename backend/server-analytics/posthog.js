// backend/server-analytics/posthog.js
import { PostHog } from "posthog-node";
export const ph = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, { host: process.env.POSTHOG_HOST })
  : null;

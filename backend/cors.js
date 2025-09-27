// backend/cors.js
import cors from "cors";

/** Normalize any value to a clean origin (strip paths/trailing slashes). */
function cleanOrigin(v) {
  if (!v) return "";
  try {
    const u = new URL(v);
    return u.origin.replace(/\/+$/, "");
  } catch {
    return String(v).replace(/\/+$/, "");
  }
}

const raw =
  process.env.CORS_ALLOWLIST ||
  process.env.SITE_URLS || // backward compat
  "";

const ALLOWLIST = new Set(
  raw
    .split(",")
    .map((s) => cleanOrigin(s.trim()))
    .filter(Boolean)
);

export default cors({
  origin(origin, cb) {
    // Allow same-origin / curl / Postman (no Origin header)
    if (!origin) return cb(null, true);
    const o = cleanOrigin(origin);
    if (ALLOWLIST.has(o)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  // Keep your broader set of methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Needed for Supabase bearer tokens
  allowedHeaders: ["Content-Type", "Authorization"],
  // Expose more headers if you ever need them in the browser
  exposedHeaders: [],
  // You’re using Authorization headers (not cookies), so keep this false.
  // If you ever switch to cookies across origins, set to true.
  credentials: false,
  // Cache the preflight on the browser side for a day
  maxAge: 86400,
});

// Optional helper (if you want to echo the allowlist in /__cors)
export function getAllowlist() {
  return Array.from(ALLOWLIST);
}

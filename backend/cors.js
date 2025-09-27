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

const corsMw = cors({
  origin(origin, cb) {
    // Allow same-origin / curl / Postman (no Origin header)
    if (!origin) return cb(null, true);
    const o = cleanOrigin(origin);
    if (ALLOWLIST.has(o)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: [],
  credentials: true,     // 🔴 IMPORTANT: your frontend is using credentials: "include"
  maxAge: 86400,
});

export default corsMw;

// Optional: so /__cors can echo exactly what this file uses
export function getAllowlist() {
  return Array.from(ALLOWLIST);
}

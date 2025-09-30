// cors.js
import cors from "cors";

/** Normalize an origin and strip trailing slashes */
export function cleanOrigin(v) {
  if (!v) return "";
  try {
    const u = new URL(v);
    return u.origin.replace(/\/+$/, "");
  } catch {
    return String(v).replace(/\/+$/, "");
  }
}

/** Build allowlist from env (comma-separated) */
const raw =
  process.env.CORS_ALLOWLIST ||
  process.env.SITE_URLS || 
  "";

const ALLOWLIST = new Set(
  raw
    .split(",")
    .map((s) => cleanOrigin(s.trim()))
    .filter(Boolean)
);

/** Optional: allow any *.vercel.app previews if explicitly enabled */
const ALLOW_ANY_VERCEL_APP =
  String(process.env.CORS_ALLOW_ANY_VERCEL_APP || "").toLowerCase() === "true" ||
  process.env.CORS_ALLOW_ANY_VERCEL_APP === "1";

/** Optional: allow any host that ends with these suffixes (comma-separated), e.g. ".vercel.app" */
const EXTRA_SUFFIXES = (process.env.CORS_ALLOW_SUFFIXES || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function hostMatchesSuffixes(host) {
  return EXTRA_SUFFIXES.some(sfx => host.endsWith(sfx));
}

/** True if the Origin header should be allowed */
export function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server, curl, health checks, etc.
  const o = cleanOrigin(origin);
  if (ALLOWLIST.has(o)) return true;

  try {
    const { hostname } = new URL(o);
    if (ALLOW_ANY_VERCEL_APP && hostname.endsWith(".vercel.app")) return true;
    if (EXTRA_SUFFIXES.length && hostMatchesSuffixes(hostname)) return true;
  } catch {}

  return false;
}

/** CORS middleware using dynamic per-request decision */
const corsMw = cors({
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // ⬇️ omit allowedHeaders so cors reflects Access-Control-Request-Headers dynamically
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

export default corsMw;

/** For your /__cors debug route */
export function getAllowlist() {
  return Array.from(ALLOWLIST);
}

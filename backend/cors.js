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

function ensureProtocol(origin) {
  if (!origin) return "";
  if (/^https?:\/\//i.test(origin)) return origin;
  return `https://${origin}`;
}

/** Build allowlist from env (comma-separated) */
const LIST_VARS = [process.env.CORS_ALLOWLIST, process.env.SITE_URLS].filter(Boolean);

const EXACT_ALLOWLIST = new Set();
const WILDCARD_PATTERNS = new Set();
const WILDCARD_REGEXES = [];

/** Convert a wildcard origin pattern (using "*") to a RegExp */
function wildcardToRegex(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`, "i");
}

function addAllowlistEntry(raw) {
  if (!raw) return;
  const normalized = cleanOrigin(ensureProtocol(raw.trim()));
  if (!normalized) return;

  // Support wildcard patterns like "https://ivc-*.vercel.app" or "*.vercel.app"
  if (normalized.includes("*")) {
    WILDCARD_PATTERNS.add(normalized);
    try {
      WILDCARD_REGEXES.push(wildcardToRegex(normalized));
    } catch (err) {
      console.warn(`Invalid CORS wildcard pattern ignored: ${normalized}`, err);
    }
    return;
  }

  EXACT_ALLOWLIST.add(normalized);
}

LIST_VARS
  .join(",")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .forEach(addAllowlistEntry);

const STATIC_ORIGINS = [
  process.env.SITE_URL,
  process.env.FRONTEND_URL,
  process.env.VITE_SITE_URL,
  process.env.PUBLIC_SITE_URL,
  process.env.RENDER_EXTERNAL_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
];

STATIC_ORIGINS.forEach(addAllowlistEntry);

/** Optional: allow any *.vercel.app previews if explicitly enabled */
const ALLOW_ANY_VERCEL_APP =
  String(process.env.CORS_ALLOW_ANY_VERCEL_APP || "").toLowerCase() === "true" ||
  process.env.CORS_ALLOW_ANY_VERCEL_APP === "1";

/** Optional: allow any host that ends with these suffixes (comma-separated), e.g. ".vercel.app" */
const EXTRA_SUFFIX_SET = new Set(
  (process.env.CORS_ALLOW_SUFFIXES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// Auto-add .vercel.app if your SITE_URL itself is on vercel (handy for preview-heavy setups)
try {
  const siteUrl = process.env.SITE_URL || "";
  if (siteUrl) {
    const { hostname } = new URL(siteUrl);
    if (hostname.endsWith(".vercel.app")) {
      EXTRA_SUFFIX_SET.add(".vercel.app");
    }
  }
} catch {}

const EXTRA_SUFFIXES = Array.from(EXTRA_SUFFIX_SET);

function hostMatchesSuffixes(host) {
  return EXTRA_SUFFIXES.some((sfx) => host.endsWith(sfx));
}

/** True if the Origin header should be allowed */
export function isOriginAllowed(origin) {
  if (!origin) return true;
  const o = cleanOrigin(origin);
  if (EXACT_ALLOWLIST.has(o)) return true;
  if (WILDCARD_REGEXES.some((re) => re.test(o))) return true;

  try {
    const { hostname } = new URL(o);

    // 🔥 HOT-FIX: always allow any *.vercel.app previews
    if (hostname.endsWith(".vercel.app")) return true;

    if (ALLOW_ANY_VERCEL_APP && hostname.endsWith(".vercel.app")) return true;
    if (EXTRA_SUFFIXES.length && hostMatchesSuffixes(hostname)) return true;
  } catch {}

  return false;
}

/** CORS middleware using dynamic per-request decision */
const corsMw = cors({
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    // helpful one-liner in logs to see what was blocked
    console.error(`CORS blocked for origin: ${origin}`);
    cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Reflect request headers automatically
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

export default corsMw;

/** For your /__cors debug route */
export function getAllowlist() {
  return [...EXACT_ALLOWLIST, ...WILDCARD_PATTERNS, ...EXTRA_SUFFIXES, ...(ALLOW_ANY_VERCEL_APP ? ["<any *.vercel.app>"] : [])];
}

// Boot-time visibility (shows exactly what the server is using)
console.log("[CORS] Exact:", [...EXACT_ALLOWLIST]);
console.log("[CORS] Wildcards:", [...WILDCARD_PATTERNS]);
console.log("[CORS] Suffixes:", EXTRA_SUFFIXES);
console.log("[CORS] Allow any *.vercel.app:", ALLOW_ANY_VERCEL_APP);

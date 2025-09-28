import cors from "cors";

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
  process.env.SITE_URLS || 
  "";

const ALLOWLIST = new Set(
  raw
    .split(",")
    .map((s) => cleanOrigin(s.trim()))
    .filter(Boolean)
);

const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const o = cleanOrigin(origin);
    if (ALLOWLIST.has(o)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Debug-Secret", "x-debug-secret"],
  exposedHeaders: [],
  credentials: true,    
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

export default corsMw;

export function getAllowlist() {
  return Array.from(ALLOWLIST);
}

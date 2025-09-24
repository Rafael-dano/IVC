// backend/cors.js (ESM)
import cors from "cors";

const rawList =
  process.env.CORS_ALLOWLIST ||
  process.env.SITE_URLS || // fallback if you had the old name
  "";

const ALLOWLIST = rawList
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default cors({
  origin(origin, cb) {
    // allow server-to-server, curl, Postman (no Origin header)
    if (!origin) return cb(null, true);
    const ok = ALLOWLIST.includes(origin);
    cb(ok ? null : new Error(`CORS blocked for origin: ${origin}`), ok);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

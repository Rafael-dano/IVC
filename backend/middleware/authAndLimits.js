// backend/middleware/authAndLimits.js
import { supabaseAdmin } from "../api/supabaseClient.js";

// Simple limits used by enforceLimits (match your plans)
const PLAN_LIMITS = {
  FREE: 50,
  PRO: 2000,
  LTD_99: 1000,
  LTD_149: 2000,
  LTD_199: 3000,
};

export async function requireUser(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const token = m[1];
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired token" });

    // keep it minimal and consistent everywhere
    req.user = { id: data.user.id, email: data.user.email || null };
    next();
  } catch (e) {
    console.error("requireUser error:", e);
    res.status(500).json({ error: "Auth error" });
  }
}

export async function enforceLimits(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No user" });

    // Plan
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("enforceLimits profile error:", profErr.message);
      return res.status(500).json({ error: "Failed to load plan" });
    }
    const plan = profile?.plan || "FREE";
    const monthlyLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

    // Usage (this month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: usageRows, error: usageErr } = await supabaseAdmin
      .from("usage_events")
      .select("tokens_used, created_at")
      .gte("created_at", monthStart)
      .eq("user_id", userId);

    if (usageErr) {
      console.error("enforceLimits usage error:", usageErr.message);
      return res.status(500).json({ error: "Failed to load usage" });
    }

    const usedTokens = (usageRows || []).reduce((s, r) => s + (r.tokens_used || 0), 0);
    if (usedTokens >= monthlyLimit) {
      return res.status(403).json({
        error: "Usage limit reached. Please upgrade.",
        plan,
        month_tokens_used: usedTokens,
        month_tokens_limit: monthlyLimit,
      });
    }

    req.plan = plan;
    req.month_tokens_used = usedTokens;
    req.month_tokens_limit = monthlyLimit;
    next();
  } catch (e) {
    console.error("enforceLimits error:", e);
    res.status(500).json({ error: "Limit check failed" });
  }
}

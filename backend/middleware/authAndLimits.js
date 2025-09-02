// backend/middleware/authAndLimits.js
import { supabaseAdmin } from "../api/supabaseClient.js";
import { PLANS } from "../plans.js";

export async function requireUser(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

    req.user = data.user; // { id, email, ... }
    next();
  } catch (e) {
    console.error("requireUser error:", e);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function enforceLimits(req, res, next) {
  try {
    const userId = req.user.id;

    // 1) get plan from profiles
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("plan, renews_at")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) {
      console.warn("profile lookup error:", pErr.message);
    }

    const planKey = profile?.plan || "FREE";
    const plan = PLANS[planKey] || PLANS.FREE;

    // 2) get this month's usage
    const { data: usageAgg, error: uErr } = await supabaseAdmin
      .from("usage_monthly")
      .select("requests, tokens")
      .eq("user_id", userId)
      .eq("month", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()) // optional if your view matches
      .maybeSingle();

    const usedRequests = usageAgg?.requests || 0;
    const usedTokens = usageAgg?.tokens || 0;

    if (usedRequests >= plan.monthlyRequests) {
      return res.status(402).json({
        error: "Usage limit reached. Please upgrade for more requests.",
        code: "LIMIT_REQUESTS",
        plan: planKey,
        usedRequests,
        monthlyRequests: plan.monthlyRequests,
      });
    }

    if (usedTokens >= plan.maxTokens) {
      return res.status(402).json({
        error: "Token limit reached. Please upgrade.",
        code: "LIMIT_TOKENS",
        plan: planKey,
        usedTokens,
        maxTokens: plan.maxTokens,
      });
    }

    // Pass plan info to the handler (optional)
    req.plan = { key: planKey, ...plan };
    next();
  } catch (e) {
    console.error("enforceLimits error:", e);
    res.status(500).json({ error: "Limit check failed" });
  }
}

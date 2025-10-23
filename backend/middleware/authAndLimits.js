import { supabaseAdmin } from "../api/supabaseClient.js";
import { isPaidPlan } from "../plans.js";

export const PLAN_LIMITS = {
  FREE: 50,
  PRO: 1500,
  ANNUAL_99: 1500,
  ANNUAL_149: 1500,
  ANNUAL: 1500,
  LTD_400: 1500,
};

export function normalizePlanKey(plan) {
  if (!plan) return "FREE";

  const normalized = String(plan)
    .trim()
    .toUpperCase();

  if (!normalized) return "FREE";

  return normalized.replace(/^([A-Z]+)(\d+)$/, "$1_$2");
}

async function ensureProfileRow(user) {
  try {
    const id = user.id;
    const email = (user.email || "").toLowerCase();
    const display =
      (user.user_metadata?.full_name ||
       user.user_metadata?.name ||
       user.user_metadata?.display_name ||
       null);

    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("id", id)
      .maybeSingle();

    if (pErr) {
      console.warn("ensureProfileRow select error:", pErr.message || pErr);
      return;
    }

    if (!prof) {
      await supabaseAdmin
        .from("profiles")
        .insert({ id, email, display_name: display, plan: "FREE" });
      return;
    }

    if (!prof.email && email) {
      await supabaseAdmin
        .from("profiles")
        .update({ email })
        .eq("id", id);
    }
  } catch (e) {
    console.warn("ensureProfileRow error:", e?.message || e);
  }
}

async function ensureBetaLifecycle(userId, userEmail) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, beta_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const plan = normalizePlanKey(profile?.plan);
    const nowIso = new Date().toISOString();

    if (isPaidPlan(plan)) return;

    if (plan === "BETA_FREE" && profile?.beta_expires_at) {
      if (new Date(profile.beta_expires_at).toISOString() < nowIso) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "FREE", beta_expires_at: null, beta_status: "EXPIRED" })
          .eq("id", userId);
      }
      return;
    }

    if (userEmail && (plan === "FREE" || !plan) && !profile?.beta_expires_at) {
      const { data: signedUp } = await supabaseAdmin
        .from("beta_signups")
        .select("email, approved, beta_status")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

        if (signedUp?.approved === true) {
        const plus30 = new Date();
        plus30.setDate(plus30.getDate() + 30);
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "BETA_FREE",
            beta_expires_at: plus30.toISOString(),
            beta_status: "APPROVED",
          })
          .eq("id", userId);
      }
    }
  } catch (e) {
    console.warn("ensureBetaLifecycle error:", e?.message || e);
  }
}

export async function requireUser(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const token = m[1];
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired token" });

    req.user = { id: data.user.id, email: data.user.email || null };

    await ensureProfileRow(data.user);

    await ensureBetaLifecycle(req.user.id, req.user.email);

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

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("enforceLimits profile error:", profErr.message);
      return res.status(500).json({ error: "Failed to load plan" });
    }
    const plan = normalizePlanKey(profile?.plan);
    const monthlyLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

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
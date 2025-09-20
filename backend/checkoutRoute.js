// backend/checkoutRoute.js
import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";
import { LTD_PRICE_IDS, SUPPORTED_LTD_CURRENCIES } from "./plans.js";


const router = express.Router();

// --- Stripe init & env guards ---
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in backend/.env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// .env needed:
// SITE_URL=http://127.0.0.1:5173     (MUST include http:// or https://)
// STRIPE_PRICE_PRO=price_xxx

function getOrigin() {
  const raw = (process.env.SITE_URL || "").trim();
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error(
      `SITE_URL is invalid: "${raw}". It must include http:// or https://`
    );
  }
  // strip trailing slash
  return raw.replace(/\/+$/, "");
}

const FALLBACK_CURRENCY = "USD";

function resolveLTDPrice(tier, currency) {
  const tierMap = LTD_PRICE_IDS[tier];
  if (!tierMap) {
    return { priceId: null, resolvedCurrency: null };
  }

  const normalizedCurrency = currency?.toUpperCase() ?? FALLBACK_CURRENCY;

  if (!SUPPORTED_LTD_CURRENCIES.includes(normalizedCurrency)) {
    return { priceId: null, resolvedCurrency: normalizedCurrency };
  }

  const resolvedCurrency = tierMap[normalizedCurrency]
    ? normalizedCurrency
    : FALLBACK_CURRENCY;

  const priceId = tierMap[resolvedCurrency] ?? null;

  return { priceId, resolvedCurrency };
}

router.post("/api/checkout", requireUser, async (req, res) => {
  try {
    const userId = req.user.id; // set by requireUser
    const {
            mode = "payment",
            tier = "LTD_99",
            currency = FALLBACK_CURRENCY,
          } = req.body ?? {};
      
          const normalizedMode =
            mode === "subscription" ? "subscription" : "payment";
      
          let priceId = null;
          let metadataTier = tier;
          let resolvedCurrency = FALLBACK_CURRENCY;
      
          if (normalizedMode === "subscription") {
            priceId = process.env.STRIPE_PRICE_PRO;
           metadataTier = "PRO";
            if (!priceId) {
              return res
                .status(500)
                .json({ error: "Subscription price is not configured" });
            }
          } else {
            if (!Object.hasOwn(LTD_PRICE_IDS, tier)) {
              return res.status(400).json({ error: `Unknown tier: ${tier}` });
            }
      
            const result = resolveLTDPrice(tier, currency);
            priceId = result.priceId;
            resolvedCurrency = result.resolvedCurrency ?? FALLBACK_CURRENCY;
      
            if (!priceId) {
              return res.status(400).json({
                error: `Unsupported currency for tier ${tier}: ${currency}`,
              });
            }
          }

    // ✅ Stock check ONLY for LTD tiers (one-time)
    if (normalizedMode === "payment" && metadataTier !== "PRO") {
      const { data: spot, error: spotErr } = await supabaseAdmin
        .from("ltd_spots")
        .select("remaining")
        .eq("tier", tier)
        .maybeSingle();

      if (spotErr) {
        console.error("ltd_spots read error:", spotErr.message);
        return res.status(500).json({ error: "Could not check availability" });
      }

      if (!spot || spot.remaining <= 0) {
        return res.status(409).json({ error: "Sold out" });
      }
    }

    // Build URLs safely
    const origin = getOrigin();
    const success_url = `${origin}/settings?success=true`;
    const cancel_url  = `${origin}/ltd?canceled=true`;

    // Debug log (very helpful while testing)
    console.log("Creating checkout session ->", {
            userId,
            mode: normalizedMode,
            tier,
            requestedCurrency: currency,
            resolvedCurrency,
            priceId,
            success_url,
            cancel_url,
          });

    const session = await stripe.checkout.sessions.create({
      mode: normalizedMode, // "payment" for LTD, "subscription" for PRO
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?success=true`,
      cancel_url:  `${origin}/ltd?canceled=true`,
      metadata: { user_id: userId, tier: metadataTier },
    });    

    return res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout error:", e);
    // surface clear message when SITE_URL is wrong
    if (String(e.message || "").includes("SITE_URL is invalid")) {
      return res.status(500).json({ error: e.message });
    }
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;

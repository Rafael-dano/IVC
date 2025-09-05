// backend/checkoutRoute.js
import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";

const router = express.Router();

// --- Stripe init & env guards ---
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in backend/.env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// .env needed:
// SITE_URL=http://127.0.0.1:5173     (MUST include http:// or https://)
// STRIPE_PRICE_LTD_99=price_xxx
// STRIPE_PRICE_LTD_149=price_xxx
// STRIPE_PRICE_LTD_199=price_xxx
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

function mapPriceId(priceKey) {
  switch (priceKey) {
    case "LTD_99":  return process.env.STRIPE_PRICE_LTD_99;
    case "LTD_149": return process.env.STRIPE_PRICE_LTD_149;
    case "LTD_199": return process.env.STRIPE_PRICE_LTD_199;
    case "PRO":     return process.env.STRIPE_PRICE_PRO;
    default:        return null;
  }
}

router.post("/api/checkout", requireUser, async (req, res) => {
  try {
    const userId = req.user.id; // set by requireUser
    let { mode = "payment", price = "LTD_99" } = req.body;

    // normalize mode to only the two allowed values
    mode = mode === "subscription" ? "subscription" : "payment";

    const priceId = mapPriceId(price);
    if (!priceId) {
      return res.status(400).json({ error: `Invalid price option: ${price}` });
    }

    // ✅ Stock check ONLY for LTD tiers (one-time)
    if (mode === "payment" && price !== "PRO") {
      const { data: spot, error: spotErr } = await supabaseAdmin
        .from("ltd_spots")
        .select("remaining")
        .eq("tier", price)
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
      userId, mode, price, priceId, success_url, cancel_url,
    });

    const session = await stripe.checkout.sessions.create({
      mode, // "payment" for LTD, "subscription" for PRO
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?success=true`,
      cancel_url:  `${origin}/ltd?canceled=true`,
      metadata: { user_id: userId, tier: price },
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

// backend/checkoutRoute.js
import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// .env needed:
// SITE_URL=http://127.0.0.1:5173
// STRIPE_PRICE_LTD_99=price_xxx
// STRIPE_PRICE_LTD_149=price_xxx
// STRIPE_PRICE_LTD_199=price_xxx
// STRIPE_PRICE_PRO=price_xxx

router.post("/api/checkout", requireUser, async (req, res) => {
  try {
    const userId = req.user.id; // from requireUser
    const { mode = "payment", price = "LTD_99" } = req.body;

    const priceId =
      price === "LTD_99"  ? process.env.STRIPE_PRICE_LTD_99  :
      price === "LTD_149" ? process.env.STRIPE_PRICE_LTD_149 :
      price === "LTD_199" ? process.env.STRIPE_PRICE_LTD_199 :
      price === "PRO"     ? process.env.STRIPE_PRICE_PRO     :
      null;

    if (!priceId) {
      return res.status(400).json({ error: "Invalid price option" });
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

    const session = await stripe.checkout.sessions.create({
      mode, // "payment" (LTD tiers) or "subscription" (PRO)
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/settings?success=true`,
      cancel_url:  `${process.env.SITE_URL}/ltd?canceled=true`,
      metadata: { user_id: userId, tier: price }, // used by webhook to update plan & decrement
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout error:", e);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;

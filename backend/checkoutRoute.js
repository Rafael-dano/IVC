
import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in backend/.env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


function getOrigin() {
  const raw = (process.env.SITE_URL || "").trim();
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error(
      `SITE_URL is invalid: "${raw}". It must include http:// or https://`
    );
  }
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
    const userId = req.user.id; 
    let { mode = "payment", price = "LTD_99" } = req.body;

   
    mode = mode === "subscription" ? "subscription" : "payment";

    const priceId = mapPriceId(price);
    if (!priceId) {
      return res.status(400).json({ error: `Invalid price option: ${price}` });
    }

    
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

  
    const origin = getOrigin();
    const success_url = `${origin}/settings?success=true`;
    const cancel_url  = `${origin}/ltd?canceled=true`;

    
    console.log("Creating checkout session ->", {
      userId, mode, price, priceId, success_url, cancel_url,
    });

    const session = await stripe.checkout.sessions.create({
      mode, 
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?success=true`,
      cancel_url:  `${origin}/ltd?canceled=true`,
      metadata: { user_id: userId, tier: price },
    });    

    return res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout error:", e);
    
    if (String(e.message || "").includes("SITE_URL is invalid")) {
      return res.status(500).json({ error: e.message });
    }
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;

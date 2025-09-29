import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing in backend/.env");
}

const stripe = new Stripe(stripeSecretKey);

const PRICE_IDS = {
  LTD_99: process.env.STRIPE_PRICE_LTD_99,
  LTD_149: process.env.STRIPE_PRICE_LTD_149,
  LTD_199: process.env.STRIPE_PRICE_LTD_199,
  PRO: process.env.STRIPE_PRICE_PRO,
};

const TAX_ENABLED = /^(1|true|yes)$/i.test(process.env.STRIPE_TAX_ENABLED || "");

const rawSiteUrl = (process.env.SITE_URL || "").trim();
if (!/^https?:\/\//i.test(rawSiteUrl)) {
  throw new Error("SITE_URL is invalid. It must include http:// or https://");
}

const SITE_URL = rawSiteUrl.replace(/\/+$/, "");
const SUCCESS_URL = `${SITE_URL}/settings?checkout=success`;
const CANCEL_URL = `${SITE_URL}/ltd?checkout=cancelled`;

function sendCheckoutError(res, error, context) {
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }

  const message = error?.raw?.message || error?.message || "Checkout session failed";
  return res.status(400).json({ error: message });
}

async function resolveCustomerOptions(user) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const stripeCustomerId = data?.stripe_customer_id;
  if (stripeCustomerId) {
    return { customer: stripeCustomerId };
  }

  return { customer_email: user.email };
}

function applyTaxIfEnabled(params) {
  if (TAX_ENABLED) {
    params.automatic_tax = { enabled: true };
  }
  return params;
}

router.post("/api/checkout/ltd", requireUser, async (req, res) => {
  try {
    const { tier } = req.body || {};
    const allowedTiers = ["LTD_99", "LTD_149", "LTD_199"];

    if (!allowedTiers.includes(tier)) {
      const error = new Error("Invalid or missing 'tier'.");
      return sendCheckoutError(res, error, "/api/checkout/ltd validation");
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      const error = new Error(`Missing price configuration for tier ${tier}`);
      return sendCheckoutError(res, error, "/api/checkout/ltd price");
    }

    const customerOptions = await resolveCustomerOptions(req.user);

    const sessionParams = applyTaxIfEnabled({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { user_id: req.user.id, tier },
      ...customerOptions,
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({ url: session.url });
  } catch (error) {
    return sendCheckoutError(res, error, "/api/checkout/ltd error");
  }
});

router.post("/api/checkout/pro", requireUser, async (req, res) => {
  try {
    const priceId = PRICE_IDS.PRO;
    if (!priceId) {
      const error = new Error("Missing price configuration for PRO tier");
      return sendCheckoutError(res, error, "/api/checkout/pro price");
    }

    const customerOptions = await resolveCustomerOptions(req.user);

    const sessionParams = applyTaxIfEnabled({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { user_id: req.user.id, tier: "PRO" },
      ...customerOptions,
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({ url: session.url });
  } catch (error) {
    return sendCheckoutError(res, error, "/api/checkout/pro error");
  }
});

export default router;

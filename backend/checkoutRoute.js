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

async function resolveStripeCustomerId(userId) {
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .maybeSingle();

  let customerId = prof?.stripe_customer_id || null;
  if (!customerId) return { customerId: null, email: prof?.email || null };

  try {
    // If this throws resource_missing in the current mode (live), treat as null
    await stripe.customers.retrieve(customerId);
    return { customerId, email: prof?.email || null };
  } catch (e) {
    if (e?.raw?.code === "resource_missing") {
      return { customerId: null, email: prof?.email || null };
    }
    throw e; // other errors bubble up
  }
}

async function ensureStripeCustomerId(userId) {
  const { customerId, email } = await resolveStripeCustomerId(userId);
  if (customerId) return customerId;

  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .maybeSingle();

  const created = await stripe.customers.create({
    email: prof?.email || email || undefined,
    name: prof?.display_name || undefined,
    metadata: { user_id: userId },
  });

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: created.id, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return created.id;
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
    const priceId = process.env[`STRIPE_PRICE_${tier}`]; // e.g. STRIPE_PRICE_LTD_199
    if (!priceId) {
      return res.status(400).json({ error: "Unknown LTD tier" });
    }

    const origin = (process.env.SITE_URL || "").replace(/\/+$/, "");
    const success_url = `${origin}/settings?checkout=success`;
    const cancel_url  = `${origin}/ltd?checkout=cancelled`;

    // ✅ Validate stored customer against current Stripe mode
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);

    const enableTax = /^(1|true|yes)$/i.test(process.env.STRIPE_TAX_ENABLED || "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",            // ensure a Customer always exists after
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      ...(enableTax ? { automatic_tax: { enabled: true } } : {}),
      metadata: { user_id: req.user.id, tier },
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/ltd error", e);
    const msg = e?.raw?.message || e?.message || "Checkout session failed";
    return res.status(400).json({ error: msg });
  }
});

router.post("/api/checkout/pro", requireUser, async (req, res) => {
  try {
    const priceId = process.env.STRIPE_PRICE_PRO;
    if (!priceId) return res.status(400).json({ error: "Missing STRIPE_PRICE_PRO" });

    const origin = (process.env.SITE_URL || "").replace(/\/+$/, "");
    const success_url = `${origin}/settings?checkout=success`;
    const cancel_url  = `${origin}/ltd?checkout=cancelled`;

    // Validate stored customer against current Stripe mode
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);
    const enableTax = /^(1|true|yes)$/i.test(process.env.STRIPE_TAX_ENABLED || "");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // ✅ DO NOT include customer_creation in subscription mode
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      ...(enableTax ? { automatic_tax: { enabled: true } } : {}),
      metadata: { user_id: req.user.id, plan: "PRO" },
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/pro error", e);
    const msg = e?.raw?.message || e?.message || "Checkout session failed";
    return res.status(400).json({ error: msg });
  }
});

router.post("/api/billing/portal", requireUser, async (req, res) => {
  try {
    const customerId = await ensureStripeCustomerId(req.user.id);
    const return_url = `${SITE_URL}/settings`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url,
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("/api/billing/portal error:", e);
    const msg = e?.raw?.message || e?.message || "Could not create billing portal session";
    return res.status(400).json({ error: msg });
  }
});

export default router;

import express from "express";
import Stripe from "stripe";
import { requireUser } from "./middleware/authAndLimits.js";
import { supabaseAdmin } from "./api/supabaseClient.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TAX_ENABLED = /^(1|true|yes)$/i.test(process.env.STRIPE_TAX_ENABLED || "");
const SITE_ORIGIN = (process.env.SITE_URL || "").replace(/\/+$/, "");

function successUrl() { return `${SITE_ORIGIN}/settings?checkout=success`; }
function cancelUrl()  { return `${SITE_ORIGIN}/ltd?checkout=cancelled`; }
function applyTax(obj) { return TAX_ENABLED ? { ...obj, automatic_tax: { enabled: true } } : obj; }

async function resolveStripeCustomerId(userId) {
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .maybeSingle();
    const email = prof?.email || null;
    const id = prof?.stripe_customer_id || null;
    if (!id) return { customerId: null, email };
  try {
    await stripe.customers.retrieve(id);
    return { customerId: id, email };
  } catch (e) {
    if (e?.raw?.code === "resource_missing") return { customerId: null, email };
    throw e;
  }
}

// Region-aware price maps
const PRO_PRICE_BY_REGION = {
  DEFAULT: process.env.STRIPE_PRICE_PRO_USD,
  US: process.env.STRIPE_PRICE_PRO_USD,
  BR: process.env.STRIPE_PRICE_PRO_BRL,
  MX: process.env.STRIPE_PRICE_PRO_MXN,
};
const ANNUAL_PRICE_BY_REGION = {
  DEFAULT: process.env.STRIPE_PRICE_ANNUAL || process.env.STRIPE_PRICE_ANNUAL_USD,
  US: process.env.STRIPE_PRICE_ANNUAL_USD,
  BR: process.env.STRIPE_PRICE_ANNUAL_BRL,
  MX: process.env.STRIPE_PRICE_ANNUAL_MXN,
};
const ANNUAL_PROMO_PRICE_BY_CODE = {
  ANNUAL_99: process.env.STRIPE_PRICE_ANNUAL_PROMO_99 || process.env.STRIPE_PRICE_LTD99,
  ANNUAL_149: process.env.STRIPE_PRICE_ANNUAL_PROMO_149 || process.env.STRIPE_PRICE_LTD149,
};
const DEFAULT_ANNUAL_PROMO_PRICE = process.env.STRIPE_PRICE_ANNUAL_PROMO || null;
const LIFETIME_400_PRICE = process.env.STRIPE_PRICE_LIFETIME_400 || process.env.STRIPE_PRICE_LTD400;

// Monthly PRO
router.post("/api/checkout/pro", requireUser, async (req, res) => {
  try {
    const region = String(req.query.region || req.body?.region || "").toUpperCase();
    const priceId = PRO_PRICE_BY_REGION[region] || PRO_PRICE_BY_REGION.DEFAULT;
    if (!priceId) return res.status(400).json({ error: "Missing PRO prices" });
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);
    const session = await stripe.checkout.sessions.create(applyTax({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl(),
      cancel_url: cancelUrl(),
      automatic_payment_methods: { enabled: true }, // cards + wallets
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      metadata: { user_id: req.user.id, plan: "PRO" },
    }));
    res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/pro error", e);
    res.status(400).json({ error: e?.raw?.message || e?.message || "Checkout failed" });
  }
});

// Regular ANNUAL ($160)
router.post("/api/checkout/annual", requireUser, async (req, res) => {
  try {
    const region = String(req.query.region || req.body?.region || "").toUpperCase();
    const priceId = ANNUAL_PRICE_BY_REGION[region] || ANNUAL_PRICE_BY_REGION.DEFAULT;
    if (!priceId) return res.status(400).json({ error: "Missing ANNUAL prices" });
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);
    const session = await stripe.checkout.sessions.create(applyTax({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl(),
      cancel_url: cancelUrl(),
      automatic_payment_methods: { enabled: true }, // cards + wallets
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      metadata: { user_id: req.user.id, plan: "ANNUAL" },
    }));
    res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/annual error", e);
    res.status(400).json({ error: e?.raw?.message || e?.message || "Checkout failed" });
  }
});

// Limited ANNUAL promos ($99/$149, USD only)
async function handleAnnualPromoCheckout(req, res) {
  try {
    const rawCode = String(req.body?.code || req.body?.tier || "").trim();
    const code = rawCode.toUpperCase();
    const priceId = ANNUAL_PROMO_PRICE_BY_CODE[code] || (!code && DEFAULT_ANNUAL_PROMO_PRICE);
    if (!priceId) return res.status(400).json({ error: "Unknown annual promo code" });
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);
    const session = await stripe.checkout.sessions.create(applyTax({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl(),
      cancel_url: cancelUrl(),
      automatic_payment_methods: { enabled: true }, // cards + wallets
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      metadata: { user_id: req.user.id, plan: "ANNUAL", ...(code ? { code } : {}) },
    }));
    res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/annual-promo error", e);
    res.status(400).json({ error: e?.raw?.message || e?.message || "Checkout failed" });
  }
}

router.post("/api/checkout/annual-promo", requireUser, handleAnnualPromoCheckout);
router.post("/api/checkout/annual/promo", requireUser, handleAnnualPromoCheckout);

// Lifetime $400 one-time
router.post("/api/checkout/lifetime-400", requireUser, async (req, res) => {
  try {
    const priceId = LIFETIME_400_PRICE;
    if (!priceId) return res.status(400).json({ error: "Missing STRIPE_PRICE_LIFETIME_400" });
    const { customerId, email } = await resolveStripeCustomerId(req.user.id);
    const session = await stripe.checkout.sessions.create(applyTax({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl(),
      cancel_url: cancelUrl(),
      automatic_payment_methods: { enabled: true, allow_redirects: "always" },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
      metadata: { user_id: req.user.id, tier: "LTD_400" },
    }));
    res.json({ url: session.url });
  } catch (e) {
    console.error("/api/checkout/lifetime-400 error", e);
    res.status(400).json({ error: e?.raw?.message || e?.message || "Checkout failed" });
  }
});

export default router;

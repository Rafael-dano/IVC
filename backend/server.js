// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";

import openai from "./api/openaiClient.js";
import { supabaseAdmin } from "./api/supabaseClient.js";
import { requireUser, enforceLimits } from "./middleware/authAndLimits.js";
import checkoutRoute from "./checkoutRoute.js";
import { PLANS } from "./plans.js";
import { sendBetaWelcomeEmail, sendPurchaseEmail } from "./email.js";

const app = express();
const PORT = process.env.PORT || 5051;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ----------------------------
   1) Stripe Webhook (raw body) — must be BEFORE express.json()
----------------------------- */
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    console.log("Stripe event:", event.type);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata?.user_id;
          const tier = session.metadata?.tier || "LTD";
          const isLTD = session.mode === "payment";

          // capture Stripe customer id on first checkout
          const customerId = session.customer;
          if (userId && customerId) {
            await supabaseAdmin
              .from("profiles")
              .update({ stripe_customer_id: customerId })
              .eq("id", userId);
          }

          // LTD plan flip + stock decrement
          if (userId && isLTD && session.payment_status === "paid") {
            await supabaseAdmin
              .from("profiles")
              .update({ plan: tier })
              .eq("id", userId);

            await supabaseAdmin.rpc("decrement_spot", { p_tier: tier });
          }

          // 🔔 Purchase email (best-effort; does not block webhook)
          try {
            const buyerEmail = session?.customer_details?.email || null;
            if (buyerEmail) {
              await sendPurchaseEmail({
                to: buyerEmail,
                plan: isLTD ? "LTD" : "PRO",
                tier: session.metadata?.tier || undefined,
              });
            }
          } catch (e) {
            console.warn("sendPurchaseEmail (checkout) failed:", e?.message || e);
          }

          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          let userId = invoice.metadata?.user_id;

          if (!userId && invoice.customer) {
            const { data: prof } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", invoice.customer)
              .maybeSingle();
            userId = prof?.id || null;
          }

          if (userId && invoice.lines?.data?.[0]?.period?.end) {
            const renewsAt = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "PRO", renews_at: renewsAt })
              .eq("id", userId);
          }

          // 🔔 Purchase/renewal email (best-effort)
          try {
            let buyerEmail = null;

            // Prefer Stripe Customer lookup for subscription emails
            if (invoice.customer) {
              try {
                const customer = await stripe.customers.retrieve(invoice.customer);
                buyerEmail = customer?.email || null;
              } catch (e) {
                console.warn("retrieve customer for email failed:", e?.message || e);
              }
            }

            // Fallbacks
            if (!buyerEmail) buyerEmail = invoice.customer_email || null;

            if (!buyerEmail && userId) {
              // only if you store `email` on profiles (optional)
              const { data: profForEmail } = await supabaseAdmin
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .maybeSingle();
              buyerEmail = profForEmail?.email || null;
            }

            if (buyerEmail) {
              await sendPurchaseEmail({
                to: buyerEmail,
                plan: "PRO",
                tier: undefined,
              });
            }
          } catch (e) {
            console.warn("sendPurchaseEmail (invoice.paid) failed:", e?.message || e);
          }

          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          let userId = sub.metadata?.user_id;

          if (!userId && sub.customer) {
            const { data: prof } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", sub.customer)
              .maybeSingle();
            userId = prof?.id || null;
          }

          if (userId) {
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "FREE", renews_at: null })
              .eq("id", userId);
          }
          break;
        }

        default:
          break;
      }

      return res.json({ received: true });
    } catch (e) {
      console.error("❌ Webhook handling error:", e);
      return res.sendStatus(500);
    }
  }
);

app.get("/webhooks/stripe/ping", (_req, res) => {
  res.json({ ok: true, at: "/webhooks/stripe/ping" });
});

/* ----------------------------
   2) Standard middleware (safe AFTER webhook)
----------------------------- */
// app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));  is this the line im supposed to replace with this code 
const allowed = new Set(
  (process.env.SITE_URLS
    ? process.env.SITE_URLS.split(",")
    : [process.env.SITE_URL || "http://127.0.0.1:5173"]
  ).map(s => s.replace(/\/+$/,""))
);

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl / Postman
    if (!origin) return cb(null, true);
    const clean = origin.replace(/\/+$/,"");
    return allowed.has(clean) ? cb(null, true) : cb(new Error("CORS blocked"), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
}));

app.use((err, _req, res, next) => {
  if (err && err.message === "CORS blocked") {
    return res.status(403).json({ error: "CORS blocked" });
  }
  next(err);
});

app.use(morgan("dev"));
app.use(express.json());

const betaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,            // max 5 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/__cors", (_req, res) => {
  res.json({ allowed: Array.from(allowed) });
});


// --- Beta signup (public, writes via admin + optional email) ---
app.post("/api/beta/signup", betaLimiter, async (req, res) => {
  try {
    const { email, name, source } = req.body || {};
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabaseAdmin
      .from("beta_signups")
      .insert({
        email: cleanEmail,
        name: name?.trim() || null,
        source: source || "beta-page",
      });

    // Allow duplicate attempts to be “ok” (23505 = unique violation)
    if (error && error.code !== "23505") {
      console.error("beta signup insert error:", error);
      return res.status(500).json({ error: "Could not save signup" });
    }

    // Optional: send welcome email
    // try {
    //   await sendBetaWelcomeEmail({ to: cleanEmail, name });
    // } catch (e) {
    //   console.warn("welcome email send failed:", e?.message || e);
    // }

    return res.json({ ok: true });
  } catch (e) {
    console.error("/api/beta/signup error:", e);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

/* ----------------------------
   3) Health + Echo
----------------------------- */
app.get("/", (_req, res) => res.send("✅ Backend is working!"));
app.post("/api/echo", (req, res) => res.json({ ok: true, received: req.body }));

/* ----------------------------
   4) Read LTD spots
----------------------------- */
app.get("/api/ltd-spots", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("ltd_spots")
      .select("tier, remaining");

    if (error) {
      console.error("/api/ltd-spots supabase error:", error);
      return res.status(500).json({ error: "Failed to load spots", details: error.message || String(error) });
    }

    const map = Object.fromEntries((data || []).map((r) => [r.tier, r.remaining]));
    return res.json({ spots: map });
  } catch (e) {
    console.error("/api/ltd-spots unexpected:", e);
    return res.status(500).json({ error: "Unexpected server error", details: e?.message || String(e) });
  }
});

/* ----------------------------
   5) Account: /api/me  (plan + usage)
----------------------------- */
app.get("/api/me", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("display_name, plan, renews_at, stripe_customer_id, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) {
      console.warn("/api/me profile error:", pErr.message);
    }

    // usage this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: usageRows, error: uErr } = await supabaseAdmin
      .from("usage_events")
      .select("tokens_used, created_at")
      .gte("created_at", monthStart)
      .eq("user_id", userId);

    if (uErr) {
      console.warn("/api/me usage error:", uErr.message);
    }

    const usedTokens = (usageRows || []).reduce((s, r) => s + (r.tokens_used || 0), 0);

    // limits from shared plans.js
    const planKey = profile?.plan || "FREE";
    const plan = PLANS[planKey] || PLANS.FREE;

    const monthTokensLimit = plan.maxTokens;
    const remaining = Math.max(0, monthTokensLimit - usedTokens);

    res.json({
      user: {
        id: userId,
        display_name: profile?.display_name || null,
        plan: planKey,
        renews_at: profile?.renews_at || null,
        stripe_customer_id: profile?.stripe_customer_id || null,
        created_at: profile?.created_at || null,
      },
      usage: {
        month_tokens_used: usedTokens,
        month_tokens_limit: monthTokensLimit,
        remaining,
        month_start: monthStart,
      },
    });
  } catch (e) {
    console.error("/api/me error:", e);
    res.status(500).json({ error: "Failed to load account" });
  }
});

// --- Billing portal (Stripe) ---
app.post("/api/billing/portal", requireUser, async (req, res) => {
  try {
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", req.user.id)
      .maybeSingle();

    if (!prof?.stripe_customer_id) {
      return res.status(400).json({ error: "No Stripe customer found." });
    }

    const origin = (process.env.SITE_URL || "").replace(/\/+$/, "");
    const portal = await stripe.billingPortal.sessions.create({
      customer: prof.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    res.json({ url: portal.url });
  } catch (e) {
    console.error("/api/billing/portal error:", e);
    res.status(500).json({ error: "Could not create billing portal session" });
  }
});

/* ----------------------------
   7) Checkout + Generate
----------------------------- */
app.use(checkoutRoute);

app.post("/api/generate", requireUser, enforceLimits, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, format } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required (string)" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful content repurposer." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    const text = completion?.choices?.[0]?.message?.content || "";
    const tokensUsed = completion?.usage?.total_tokens ?? 0;

    await supabaseAdmin.from("usage_events").insert({
      user_id: userId,
      tokens_used: tokensUsed,
      prompt: (format || "repurpose").slice(0, 60),
    });

    // legacy counter best-effort
    try {
      const { data: legacy } = await supabaseAdmin
        .from("user_usage")
        .select("count")
        .eq("user_id", userId)
        .maybeSingle();

      const current = legacy?.count ?? 0;
      await supabaseAdmin
        .from("user_usage")
        .upsert(
          { user_id: userId, count: current + 1, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
    } catch {}

    return res.json({ result: text });
  } catch (err) {
    console.error("❌ /api/generate error:", err);
    return res.status(500).json({ error: "Generation failed" });
  }
});

/* ----------------------------
   8) Routes debugger
----------------------------- */
app.get("/__routes", (_req, res) => {
  const routes =
    app._router?.stack
      ?.filter((l) => l.route)
      ?.map((l) => ({
        method: Object.keys(l.route.methods)[0].toUpperCase(),
        path: l.route.path,
      })) || [];
  res.json(routes);
});

/* ----------------------------
   9) Start server
----------------------------- */
app.listen(PORT, () => {
  console.log(
    `✅ Server listening on http://127.0.0.1:${PORT} and http://localhost:${PORT}`
  );
});

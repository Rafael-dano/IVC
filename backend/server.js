// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import Stripe from "stripe";

// ⚠️ IMPORTANT: do not import express.json() before webhook
import openai from "./api/openaiClient.js";
import { supabaseAdmin } from "./api/supabaseClient.js";
import { requireUser, enforceLimits } from "./middleware/authAndLimits.js";
import checkoutRoute from "./checkoutRoute.js";

const app = express();
const PORT = process.env.PORT || 5051;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ----------------------------
   1) Stripe Webhook (raw body)
   Must be mounted BEFORE express.json()
----------------------------- */
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }), // raw body for signature verification
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

          if (userId && isLTD && session.payment_status === "paid") {
            // flip plan
            await supabaseAdmin
              .from("profiles")
              .update({ plan: tier })
              .eq("id", userId);

            // decrement LTD stock
            await supabaseAdmin.rpc("decrement_spot", { p_tier: tier });
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          const userId = invoice.metadata?.user_id; // set metadata when creating the sub
          if (userId && invoice.lines?.data?.[0]?.period?.end) {
            const renewsAt = new Date(
              invoice.lines.data[0].period.end * 1000
            ).toISOString();
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "PRO", renews_at: renewsAt })
              .eq("id", userId);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const userId = sub.metadata?.user_id;
          if (userId) {
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "FREE", renews_at: null })
              .eq("id", userId);
          }
          break;
        }

        default:
          // ignore others
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

// Read remaining LTD spots for each tier
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


/* ----------------------------------------------------
   2) Standard middleware (safe AFTER webhook)
----------------------------------------------------- */
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(morgan("dev"));
app.use(express.json());

/* ----------------------------------------------------
   3) Health + Echo
----------------------------------------------------- */
app.get("/", (_req, res) => res.send("✅ Backend is working!"));
app.post("/api/echo", (req, res) => res.json({ ok: true, received: req.body }));
app.get("/api/ltd-spots", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("ltd_spots")
      .select("tier, remaining");

    if (error) return res.status(500).json({ error: "Failed to load spots" });

    const map = Object.fromEntries((data || []).map(r => [r.tier, r.remaining]));
    res.json({ spots: map });
  } catch (e) {
    console.error("/api/ltd-spots error:", e);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

/* ----------------------------------------------------
   4) Checkout + Generate
----------------------------------------------------- */
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

    // record usage
    await supabaseAdmin.from("usage_events").insert({
      user_id: userId,
      tokens_used: tokensUsed,
      prompt: (format || "repurpose").slice(0, 60),
    });

    // legacy counter (best-effort)
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


/* de-bug section */
// DEBUG: list all registered routes
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

/* ----------------------------------------------------
   5) Start server (listen on both localhost/127.0.0.1)
----------------------------------------------------- */
app.listen(PORT, () => {
  console.log(
    `✅ Server listening on http://127.0.0.1:${PORT} and http://localhost:${PORT}`
  );
});
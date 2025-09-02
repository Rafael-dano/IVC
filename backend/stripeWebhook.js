// backend/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "./api/supabaseClient.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.sendStatus(400);
  }

  // 👇 See events in the `stripe listen` terminal
  console.log("Stripe event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier   = session.metadata?.tier || "LTD";
        const isLTD  = session.mode === "payment"; // one-time

        if (userId && isLTD && session.payment_status === "paid") {
          // ✅ Set plan to the LTD tier purchased
          await supabaseAdmin
            .from("profiles")
            .update({ plan: tier })
            .eq("id", userId);
          await supabaseAdmin.rpc("decrement_spot", { p_tier: tier });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const userId = invoice.metadata?.user_id; // if you include metadata when creating subs
        if (userId) {
          const renewsAt = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
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

    res.json({ received: true });
  } catch (e) {
    console.error("Webhook handling error:", e);
    res.sendStatus(500);
  }
});

export default router;

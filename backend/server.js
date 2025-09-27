// backend/server.js
import "dotenv/config";
import express from "express";
import cors, { getAllowlist } from "./cors.js";
import morgan from "morgan";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import jwtPkg from "jsonwebtoken";
import * as mm from "music-metadata";
import ffmpegPath from "ffmpeg-static";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import openai from "./api/openaiClient.js";
import { supabaseAdmin } from "./api/supabaseClient.js";
import { requireUser, enforceLimits } from "./middleware/authAndLimits.js";
import checkoutRoute from "./checkoutRoute.js";
import { PLANS } from "./plans.js";
import { sendBetaWelcomeEmail, sendPurchaseEmail } from "./email.js";
import { ph } from "./server-analytics/posthog.js";


const app = express();
const PORT = process.env.PORT || 5051;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const execFileAsync = promisify(execFile);
const jwt = jwtPkg.default ?? jwtPkg;
const feedbackLimiter = rateLimit({ windowMs: 60_000, limit: 5 });

if (!process.env.UNSUBSCRIBE_JWT_SECRET) {
  console.error("FATAL: UNSUBSCRIBE_JWT_SECRET is not set. Add it to your .env / hosting env.");
  if ((process.env.NODE_ENV || "development") !== "development") process.exit(1);
}

async function getTranscriptSecondsUsedThisMonth(userId) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data, error } = await supabaseAdmin
    .from("transcript_usage")
    .select("seconds_used, created_at")
    .gte("created_at", monthStart)
    .eq("user_id", userId);

  if (error) {
    console.warn("transcript_usage read error:", error.message || error);
    return 0;
  }
  return (data || []).reduce((s, r) => s + (r.seconds_used || 0), 0);
}

async function getDurationSeconds(filePath) {
  try {
    const meta = await mm.parseFile(filePath, { duration: true });
    const secs = Math.max(0, Math.round(meta.format.duration || 0));
    return secs || 60; // fallback 60s if container hides duration
  } catch {
    return 60;
  }
}

async function transcodeWithFfmpeg(inputPath, outputPath, to = "mp3") {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found. Ensure `ffmpeg-static` is installed.");
  }

  // Choose args
  let args;
  if (to === "mp3") {
    // Extract audio → mp3 (fast, cheap, widely supported)
    args = [
      "-y",
      "-i", inputPath,
      "-vn",                 // no video
      "-acodec", "libmp3lame",
      "-q:a", "2",           // VBR quality (lower is better; 2 ~ high)
      outputPath
    ];
  } else {
    // Full transcode to MP4 (larger files; only use if you truly need video)
    args = [
      "-y",
      "-i", inputPath,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "128k",
      outputPath
    ];
  }

  await execFileAsync(ffmpegPath, args);
  return outputPath;
}


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
              .update({ plan: tier, beta_expires_at: null }) // clear beta on LTD
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
          ph?.capture({
            distinctId: userId || session.customer || "anon",
            event: "purchase_succeeded",
            properties: {
              mode: session.mode,             // "payment" or "subscription"
              amount_total: session.amount_total || null,
              currency: session.currency || null,
              tier,
            },
          });
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
              .update({ plan: "PRO", renews_at: renewsAt, beta_expires_at: null }) // clear beta on PRO
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
          ph?.capture({
            distinctId: userId || invoice.customer || "anon",
            event: "subscription_renewed",
            properties: {
              period_end: invoice.lines?.data?.[0]?.period?.end || null,
            },
          });
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
          ph?.capture({
            distinctId: userId || sub.customer || "anon",
            event: "subscription_canceled",
          });
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

// Remove Express signature
app.disable("x-powered-by");

// If behind Netlify/Render/CF proxy:
app.set("trust proxy", 1);

// Security headers (start conservative so you don't break embeds)
app.use(helmet({
  contentSecurityPolicy: false, // keep off until you whitelist YT, Stripe, etc.
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images/videos if needed
}));

// Prevent HTTP parameter pollution
app.use(hpp());

// gzip/brotli (node will brotli if supported)
app.use(compression());

if (process.env.SENTRY_DSN_BACKEND) {
  const usingV8 = typeof Sentry.expressIntegration === "function";

  if (usingV8) {
    // v8 style
    Sentry.init({
      dsn: process.env.SENTRY_DSN_BACKEND,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration({ app }),
      ],
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || "development",
    });
    // v8 only needs error handler at the end (we add it near the bottom)
  } else {
    // v7 style
    Sentry.init({
      dsn: process.env.SENTRY_DSN_BACKEND,
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || "development",
    });
    app.use(Sentry.Handlers.requestHandler());
    // app.use(Sentry.Handlers.tracingHandler()); // only if using @sentry/tracing
  }
}

app.use((req, _res, next) => {
  if (req.user) {
    Sentry.setUser({ id: req.user.id, email: req.user.email });
    Sentry.setTag("plan", req.user.plan || "unknown");
  }
  next();
});

/* ----------------------------
   2) Standard middleware (safe AFTER webhook)
----------------------------- */
app.use(cors); // uses your ./cors.js allowlist (CORS_ALLOWLIST or SITE_URLS)
app.options("*", cors);
app.use(morgan("dev"));
app.use(express.json());

const betaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,            // max 5 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/__cors", (_req, res) => {
  res.json({ allowed: getAllowlist() });
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
    ph?.capture({
      distinctId: cleanEmail || "anon",
      event: "beta_signup_backend_saved",
    });
    
    return res.json({
      ok: true,
      next: "Please complete the Beta Agreement form to activate access."
    });    
  } catch (e) {
    console.error("/api/beta/signup error:", e);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

// 1) Google Form webhook (unauthed, secret-protected)
//    Calls this after form submit. Grants/queues beta against profile if exists.
app.post("/api/beta/confirm-google", express.json(), async (req, res) => {
  try {
    const { email, agreed, secret } = req.body || {};
    if (!secret || secret !== process.env.BETA_CONFIRM_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    if (!agreed) {
      return res.status(400).json({ error: "Agreement not accepted" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, plan, beta_expires_at")
      .eq("email", cleanEmail) // keep profiles.email in sync
      .maybeSingle();

    if (pErr) {
      console.error("/api/beta/confirm-google profile error:", pErr);
      return res.status(500).json({ error: "Profile lookup failed" });
    }

    if (!prof?.id) {
      // No profile yet — mark as pre-approved so we can grant on first login
      await supabaseAdmin
        .from("beta_signups")
        .upsert({ email: cleanEmail, name: null, source: "beta-form", approved: true }, { onConflict: "email" });
      return res.json({ ok: true, queued: true, detail: "No user yet. Will grant on first login." });
    }

    // Don’t downgrade paid plans
    const plan = String(prof.plan || "FREE").toUpperCase();
    if (plan.startsWith("LTD_") || plan === "PRO") {
      return res.json({ ok: true, plan, detail: "Paid plan detected. No change." });
    }

    const plus30 = new Date(); plus30.setDate(plus30.getDate() + 30);

    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ plan: "BETA_FREE", beta_expires_at: plus30.toISOString(), beta_status: "APPROVED" })
      .eq("id", prof.id);

    if (uErr) {
      console.error("/api/beta/confirm-google update error:", uErr);
      return res.status(500).json({ error: "Could not update plan" });
    }

    return res.json({ ok: true, plan: "BETA_FREE", until: plus30.toISOString() });
  } catch (e) {
    console.error("/api/beta/confirm-google error:", e);
    return res.status(500).json({ error: "Unexpected error" });
  }
});

// 2) Self-activation for logged-in users (idempotent)
//    If they’re approved (beta_signups.approved = true) but still FREE, grant 30 days.
//    If already BETA_FREE, return existing expiry; don’t touch paid plans.
app.post("/api/beta/activate", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email || "").toLowerCase();

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("plan, beta_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const plan = String(prof?.plan || "FREE").toUpperCase();
    if (plan.startsWith("LTD_") || plan === "PRO") {
      return res.json({ ok: true, plan }); // already paid
    }
    if (plan === "BETA_FREE" && prof?.beta_expires_at) {
      return res.json({ ok: true, plan, beta_expires_at: prof.beta_expires_at });
    }

    // gate on approval
    const { data: signedUp } = await supabaseAdmin
      .from("beta_signups")
      .select("approved")
      .eq("email", userEmail)
      .maybeSingle();

    if (!signedUp?.approved) {
      return res.status(403).json({ error: "Not approved yet" });
    }

    const plus30 = new Date(); plus30.setDate(plus30.getDate() + 30);

    ph?.capture({
      distinctId: userId,
      event: "beta_activated",
      properties: { days: 30 },
    });
    
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "BETA_FREE", beta_expires_at: plus30.toISOString(), beta_status: "APPROVED" })
      .eq("id", userId);

    res.json({ ok: true, plan: "BETA_FREE", beta_expires_at: plus30.toISOString() });
  } catch (e) {
    console.error("/api/beta/activate error:", e);
    res.status(500).json({ error: "Could not activate beta" });
  }
});

/* - this is where i am gonna put the video to summary route!! - */
const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB max; adjust if needed
  },
  fileFilter: (_req, file, cb) => {
    const ok =
      /video\/mp4/.test(file.mimetype) ||
      /video\/quicktime/.test(file.mimetype) || // .mov
      /audio\//.test(file.mimetype);
    if (!ok) return cb(new Error("Only .mp4, .mov, or audio files are allowed"));
    cb(null, true);
  },
});

const videoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5, // 5 uploads/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/beta/status", requireUser, async (req, res) => {
  try {
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("plan, beta_expires_at, beta_status, email")
      .eq("id", req.user.id)
      .maybeSingle();

    return res.json({
      ok: true,
      plan: (prof?.plan || "FREE").toUpperCase(),
      beta_expires_at: prof?.beta_expires_at || null,
      beta_status: prof?.beta_status || null,
      email: prof?.email || req.user.email || null,
    });
  } catch (e) {
    console.error("/api/beta/status error:", e);
    res.status(500).json({ error: "Status failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// Upload & Transcribe (with plan enforcement + extension fix + MOV transcode)
// ─────────────────────────────────────────────────────────────

app.post(
  "/api/video/transcribe",
  requireUser,
  videoLimiter,
  upload.single("file"),
  async (req, res) => {
    let tmpPath = null;
    let sendPath = null;
    let transcodedPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user.id;
      const originalName = req.file.originalname || "upload";
      const ext = (path.extname(originalName) || "").toLowerCase();

      // Save paths
      tmpPath = req.file.path;                 // e.g. uploads/abc123 (no extension)
      const initialExt = ext || ".mp4";        // best-guess if the name had no ext
      const namedPath = tmpPath + initialExt;  // give the temp file an extension for probing

      // Rename temp file to include the original (or default) extension
      try {
        await fs.rename(tmpPath, namedPath);
      } catch {
        await fs.copyFile(tmpPath, namedPath);
        await fs.unlink(tmpPath).catch(() => {});
      }
      ph?.capture({
        distinctId: req.user?.id || "anon",
        event: "transcribe_started",
        properties: { ext, route: "/api/video/transcribe" },
      });

      // Decide if we must transcode
      const SUPPORTED = new Set([
        ".flac",".m4a",".mp3",".mp4",".mpeg",".mpga",".oga",".ogg",".wav",".webm"
      ]);

      let inputForApi = namedPath;

      if (ext === ".mov" || !SUPPORTED.has(ext)) {
        // Convert anything unsupported (or .mov) to MP3 for Whisper
        transcodedPath = namedPath.replace(/\.[^/.]+$/, "") + ".mp3";
        await transcodeWithFfmpeg(namedPath, transcodedPath, "mp3");
        inputForApi = transcodedPath;

        // optional: if you really want MP4 instead, swap lines:
        // transcodedPath = namedPath.replace(/\.[^/.]+$/, "") + ".mp4";
        // await transcodeWithFfmpeg(namedPath, transcodedPath, "mp4");
        // inputForApi = transcodedPath;
      }

      // This is the file path we’ll send to OpenAI
      sendPath = inputForApi;

      // --- PLAN ENFORCEMENT (duration + monthly minutes) ---
      const durationSec = await getDurationSeconds(sendPath);

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();

      const planKey = (profile?.plan || "FREE").toUpperCase();
      const plan = PLANS[planKey] || PLANS.FREE;
      const cap = Number(plan.maxTranscriptSeconds || 0);

      const usedSec = await getTranscriptSecondsUsedThisMonth(userId);

      if (cap > 0 && usedSec + durationSec > cap) {
        const remaining = Math.max(0, cap - usedSec);
        return res.status(402).json({
          error: "Transcription limit reached",
          detail: `You have ${Math.floor(remaining/60)} minutes left this month on ${planKey}. This upload is ~${Math.ceil(durationSec/60)} minutes.`,
          plan: planKey,
          remaining_seconds: remaining,
          attempted_seconds: durationSec,
        });
      }

      const lang = (req.body?.lang || "en").toString();

      const stream = (await import("fs")).default.createReadStream(sendPath);

      const transcriptResp = await openai.audio.transcriptions.create({
        file: stream,
        model: "whisper-1",
        language: lang,
        response_format: "json",
        temperature: 0,
      });

      const text =
        transcriptResp?.text ||
        transcriptResp?.results?.text ||
        String(transcriptResp || "").trim();

      if (!text) {
        return res.status(502).json({ error: "Transcription returned empty text" });
      }

      // 5) record usage
      await supabaseAdmin.from("transcript_usage").insert({
        user_id: userId,
        seconds_used: durationSec,
      });

      // 5.5) OPTIONAL: store transcript text for history
      await supabaseAdmin.from("transcripts").insert({
        user_id: userId,
        filename: originalName,
        lang,
        seconds_billed: durationSec,
        text,
      });

      ph?.capture({
        distinctId: req.user?.id || "anon",
        event: "transcribe_succeeded",
        properties: {
          seconds: durationSec,
          approxWords: Math.max(1, Math.round(text.split(/\s+/).length)),
        },
      });
      
      // 6) respond
      return res.json({
        ok: true,
        filename: originalName,
        lang,
        length: text.length,
        approxWords: Math.max(1, Math.round(text.split(/\s+/).length)),
        approxSecondsBilled: durationSec,
        text,
      });

    } catch (e) {
      ph?.capture({
        distinctId: req.user?.id || "anon",
        event: "transcribe_failed",
        properties: {
          message: String(e?.message || "error").slice(0, 120),
        },
      });
      
      console.error("/api/video/transcribe error:", e);
      if (
        String(e?.message || "").includes("Unrecognized file format") ||
        e?.status === 400
      ) {
        return res.status(415).json({
          error:
            "Unrecognized/unsupported file format. Please upload mp4/m4a/mp3/wav/ogg/webm/etc.",
        });
      }
      return res.status(500).json({ error: "Failed to transcribe video" });
    } finally {
      // Clean up temp files
      if (transcodedPath) await fs.unlink(transcodedPath).catch(() => {});
      if (sendPath && sendPath !== transcodedPath) await fs.unlink(sendPath).catch(() => {});
      else if (tmpPath) await fs.unlink(tmpPath).catch(() => {});
    }
  }
);

app.post("/api/feedback", feedbackLimiter, requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, category = "other", rating = null, message } = req.body || {};
    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ error: "Please provide a bit more detail." });
    }

    const { error } = await supabaseAdmin.from("feedback").insert({
      user_id: userId,
      email: email || req.user.email || null,
      category: ["bug","idea","praise","other"].includes(category) ? category : "other",
      rating: rating ?? null,
      message: String(message).trim(),
    });

    if (error) {
      console.error("/api/feedback insert error:", error);
      return res.status(500).json({ error: "Could not save feedback" });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("/api/feedback error:", e);
    res.status(500).json({ error: "Unexpected error" });
  }
});

// --- PostHog smoke test (remove later) ---
app.get("/__ph/test", (_req, res) => {
  ph?.capture({
    distinctId: "smoke",
    event: "ph_server_test",
    properties: { ts: Date.now() },
  });
  res.json({ ok: true });
});

/* ----------------------------
   3) Health + Echo
----------------------------- */
app.get("/", (_req, res) => res.send("✅ Backend is working!"));
app.post("/api/echo", (req, res) => res.json({ ok: true, received: req.body }));

// --- Healthcheck (simple) ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development", time: new Date().toISOString() });
});

app.get("/health", (_req, res) => res.status(200).send("ok"));

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

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=30");

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

    // usage this month (tokens)
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

    // plan limits
    const planKey = (profile?.plan || "FREE").toUpperCase();
    const plan = PLANS[planKey] || PLANS.FREE;

    const monthTokensLimit = Number(plan.maxTokens || 0);
    const remaining = Math.max(0, monthTokensLimit - usedTokens);

    // transcription usage
    const { data: trows, error: terr } = await supabaseAdmin
      .from("transcript_usage")
      .select("seconds_used, created_at")
      .gte("created_at", monthStart)
      .eq("user_id", userId);

    if (terr) {
      console.warn("/api/me transcript_usage error:", terr.message || terr);
    }

    const usedSeconds = (trows || []).reduce((s, r) => s + (r.seconds_used || 0), 0);
    const capSeconds = Number(plan.maxTranscriptSeconds || 0);

    res.set("Cache-Control", "no-store");

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

        // NEW
        transcription_seconds_used: usedSeconds,
        transcription_seconds_limit: capSeconds,
        transcription_minutes_used: Math.round(usedSeconds / 60),
        transcription_minutes_limit: Math.round(capSeconds / 60),
      },
    });
  } catch (e) {
    console.error("/api/me error:", e);
    res.status(500).json({ error: "Failed to load account" });
  }
});

app.get("/api/marketing/prefs", requireUser, async (req, res) => {
  try {
    const { data: prof, error } = await supabaseAdmin
      .from("profiles")
      .select("marketing_opt_in, marketing_opt_out_at, email")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("/api/marketing/prefs error:", error);
      return res.status(500).json({ error: "Failed to load preferences" });
    }

    // Optional: precompute unsubscribe token for your email templates/UI
    let unsubscribe_url = null;
    try {
      const token = jwt.sign(
        { uid: req.user.id, email: prof?.email || req.user.email },
        process.env.UNSUBSCRIBE_JWT_SECRET,
        { expiresIn: "30d" }
      );
      const origin = (process.env.SITE_URL || "").replace(/\/+$/, "");
      unsubscribe_url = `${origin}/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`;
    } catch {}

    res.json({
      ok: true,
      marketing_opt_in: !!prof?.marketing_opt_in,
      marketing_opt_out_at: prof?.marketing_opt_out_at || null,
      unsubscribe_url,
    });
  } catch (e) {
    console.error("/api/marketing/prefs exception:", e);
    res.status(500).json({ error: "Unexpected error" });
  }
});

app.post("/api/marketing/prefs", requireUser, async (req, res) => {
  try {
    const opt = !!req.body?.marketing_opt_in;
    const patch = {
      marketing_opt_in: opt,
      marketing_opt_out_at: opt ? null : new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", req.user.id);

    if (error) {
      console.error("/api/marketing/prefs update error:", error);
      return res.status(500).json({ error: "Failed to update preferences" });
    }
    res.json({ ok: true, ...patch });
  } catch (e) {
    console.error("/api/marketing/prefs exception:", e);
    res.status(500).json({ error: "Unexpected error" });
  }
});

// One-click unsubscribe (link for email footers)
app.get("/api/marketing/unsubscribe", async (req, res) => {
  try {
    const token = req.query?.token;
    if (!token) return res.status(400).send("Missing token");

    let payload;
    try {
      payload = jwt.verify(token, process.env.UNSUBSCRIBE_JWT_SECRET);
    } catch {
      return res.status(400).send("Invalid or expired token");
    }

    const userId = payload?.uid;
    if (!userId) return res.status(400).send("Invalid token payload");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ marketing_opt_in: false, marketing_opt_out_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("/api/marketing/unsubscribe error:", error);
      return res.status(500).send("Failed to update preference");
    }

    const origin = (process.env.SITE_URL || "").replace(/\/+$/, "");
    return res.redirect(`${origin}/settings?unsub=success`);
  } catch (e) {
    console.error("/api/marketing/unsubscribe exception:", e);
    res.status(500).send("Unexpected error");
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

app.get("/__boom", (_req, _res) => {
  throw new Error("Test error: Sentry backend");
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

if (process.env.SENTRY_DSN_BACKEND) {
  const hasV8Err = typeof Sentry.expressErrorHandler === "function";
  if (hasV8Err) {
    app.use(Sentry.expressErrorHandler());     // v8
  } else if (Sentry?.Handlers?.errorHandler) {
    app.use(Sentry.Handlers.errorHandler());   // v7
  }
}

/* ----------------------------
   8.5) JSON 404 + error handler
   (place ABOVE app.listen)
----------------------------- */

// 404 for anything not matched above
app.use((req, res, _next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.path,
  });
});


// Central error handler (JSON)
app.use((err, req, res, _next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  const isProd = (process.env.NODE_ENV || "development") === "production";
  const payload = { error: "Internal Server Error" };
  if (!isProd) {
    payload.details = err?.message || String(err);
    payload.stack = err?.stack;
    payload.path = req.path;
  }

  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json(payload);
});

async function gracefulExit() {
  try { await ph?.shutdown(); } catch {}
  process.exit(0);
}
process.on("SIGTERM", gracefulExit);
process.on("SIGINT", gracefulExit);
/* ----------------------------
   9) Start server
----------------------------- */
app.listen(PORT, () => {
  const publicUrl = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");
  console.log("✅ Server listening on", publicUrl || `:${PORT}`);
});
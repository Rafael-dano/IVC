// backend/email.js
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || null;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendBetaWelcomeEmail({ to, name }) {
  if (!resend) return; // no-op if not configured in .env
  const from = process.env.WELCOME_FROM || "IVContent <no-reply@yourdomain.com>";
  const subject = process.env.WELCOME_SUBJECT || "Welcome to the IVContent Beta 🎉";
  const quickstart = process.env.WELCOME_LINK || "https://your-site.com/quickstart";

  const html = `
    <div style="font-family: system-ui, Arial, sans-serif; line-height:1.5">
      <h2>Welcome${name ? `, ${name}` : ""}!</h2>
      <p>Thanks for joining the IVContent beta. You’re in 🎉</p>
      <p>Start here: <a href="${quickstart}">${quickstart}</a></p>
      <p>We’re excited to have you! — The IVContent Team</p>
    </div>
  `;

  await resend.emails.send({ from, to, subject, html });
}

export async function sendPurchaseEmail({ to, plan, tier }) {
  if (!resend) return;
  const from = process.env.WELCOME_FROM || "IVContent <no-reply@yourdomain.com>";
  const subject = plan === "PRO"
    ? "Your IVContent PRO is active ✅"
    : `Your IVContent ${tier} is active ✅`;

  const html = `
    <div style="font-family: system-ui, Arial, sans-serif; line-height:1.5">
      <h2>You're all set!</h2>
      <p>Your ${plan === "PRO" ? "PRO subscription" : `LTD (${tier})`} is now active.</p>
      <p>Jump back in: <a href="${process.env.SITE_URL || "#"}">${process.env.SITE_URL || "Open IVContent"}</a></p>
      <p>Need help? Reply to this email.</p>
    </div>
  `;

  await resend.emails.send({ from, to, subject, html });
}

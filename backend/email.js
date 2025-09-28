import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "IVContent <no-reply@ivcontent.com>";
const REPLY_TO = process.env.REPLY_TO || undefined;

function ensureResend() {
  if (!resend) throw new Error("Resend not configured (RESEND_API_KEY missing)");
}

function htmlShell(subject, inner) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charSet="utf-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:24px;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111">
          <tr><td>
            ${inner}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
            <p style="font-size:12px;color:#6b7280;margin:0">
              You can manage marketing emails in Settings. Replies go to our team${REPLY_TO ? ` at ${REPLY_TO}` : ""}.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

function textify(str) {
  return str.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, " ");
}

async function send({ to, subject, html }) {
  ensureResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text: textify(html),
    ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
  });
}

export async function sendWelcomeEmail({ to, firstName, siteUrl }) {
  const subject = "Welcome to IVContent 🎉";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>Thanks for signing up for IVContent! 🚀 You’re now part of our early community of creators turning one piece of content into many — in seconds.</p>
    <p><b>Here’s what’s next:</b><br/>
      1️⃣ Keep an eye on your inbox for beta updates.<br/>
      2️⃣ You’ll get early access links as new features roll out.<br/>
      3️⃣ Share your feedback — we’re building this with you.</p>
    <p>We’re so excited to see what you’ll create! If you have any questions or ideas, just hit reply — I read every message.</p>
    <p>Let’s repurpose something great,<br/>Rafael Agredano<br/>Founder, IVContent</p>
  `);
  return send({ to, subject, html: body });
}

export async function sendMembershipThankYouEmail({ to, firstName, accountUrl }) {
  const subject = "You’re in! Your IVContent Membership is Active 🎉";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>Welcome aboard — your IVContent Monthly Membership is officially active! 🙌</p>
    <p>You now have full access to:<br/>
      ✅ All current repurposing tools<br/>
      ✅ Priority feature updates<br/>
      ✅ Member-only tips & content strategies
    </p>
    <p>Your membership renews automatically every month, and you can manage your account anytime here:
      <br/><a href="${accountUrl}" style="color:#6d28d9">${accountUrl}</a>
    </p>
    <p>We’re thrilled to have you in the IVContent family. If you ever have questions, ideas, or feedback, just reply — I’m always listening.</p>
    <p>Let’s make your content work harder for you.<br/>Rafael Agredano<br/>Founder, IVContent</p>
  `);
  return send({ to, subject, html: body });
}

export async function sendLTDThankYouEmail({ to, firstName, loginUrl }) {
  const subject = "You just unlocked IVContent — for life 🎉";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>Huge congrats — you’re now a Lifetime Member of IVContent! 🙌</p>
    <p>That means you get:<br/>
      ✅ Unlimited access to all current tools<br/>
      ✅ Every future update & new feature<br/>
      ✅ Member-only strategies — forever
    </p>
    <p>No renewals, no extra fees. Just lifetime access to make your content go further with less effort.</p>
    <p>You can log in anytime here:<br/>
      <a href="${loginUrl}" style="color:#6d28d9">${loginUrl}</a>
    </p>
    <p>Welcome to the IVContent family — this is going to be fun.<br/>Rafael Agredano<br/>Founder, IVContent</p>
  `);
  return send({ to, subject, html: body });
}

export async function sendReminderLTD({ to, firstName, deadlineDate, ltdUrl }) {
  const subject = "Last chance for Lifetime Access ⏳";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>Our Lifetime Deal is closing soon — and once it’s gone, it’s gone.</p>
    <p>This is your chance to:<br/>
      ✅ Get every IVContent tool, update, and feature — forever<br/>
      ✅ Pay once, never again<br/>
      ✅ Lock in the best deal we’ll ever offer
    </p>
    <p>After <b>${deadlineDate || "the deadline"}</b>, the only way to join will be with a monthly or annual membership.</p>
    <p>👉 Grab your Lifetime Deal now: <a href="${ltdUrl}" style="color:#6d28d9">${ltdUrl}</a></p>
    <p>Don’t miss out — future you will thank you.<br/>Rafael Agredano<br/>Founder, IVContent</p>
  `);
  return send({ to, subject, html: body });
}

export async function sendReminderMonthly({ to, firstName, membershipUrl }) {
  const subject = "Ready to repurpose smarter?";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>You’ve seen what IVContent can do — now it’s time to unlock the full experience.</p>
    <p><b>Choose the plan that works best for you:</b><br/>
      💡 Monthly Membership — Flexible, cancel anytime
    </p>
    <p>Gives you full access to:<br/>
      ✅ All current & future tools<br/>
      ✅ Priority updates<br/>
      ✅ Member-only tips & strategies
    </p>
    <p>👉 Get your plan and start today: <a href="${membershipUrl}" style="color:#6d28d9">${membershipUrl}</a></p>
    <p>Your content is ready for its upgrade — are you?<br/>Rafael Agredano<br/>Founder, IVContent</p>
  `);
  return send({ to, subject, html: body });
}

export async function sendBetaWelcomeEmail({ to, firstName, videoSubmissionUrl, betaEndDate, ltdUrl }) {
  const subject = "🎉 Welcome to the IVContent Beta!";
  const body = htmlShell(subject, `
    <p>Hi ${firstName || ""},</p>
    <p>Thank you for joining the IVContent Beta Program — we’re thrilled to have you on board! 🚀
    Your feedback, creativity, and insights will help shape RepurposeIV into the best content repurposing tool possible.</p>
    <p>As part of the beta, we’re asking participants to:</p>
    <ul>
      <li>Create 2 short promotional videos about your experience using RepurposeIV</li>
      <li>Share 2 social media posts about the tool</li>
      <li>Submit your videos so we can feature them in our marketing (and so you can inspire future users!)</li>
    </ul>
    <p>📤 Submit your videos here: <a href="${videoSubmissionUrl}" style="color:#6d28d9">${videoSubmissionUrl}</a></p>
    <p>Your beta access will remain active until <b>${betaEndDate || "the end of the beta"}</b>, and you’ll have the option to upgrade to our Lifetime Deal at $99 anytime during the beta.</p>
    <p>If you have questions or need assistance, reply directly to this email — we’re here to help.</p>
    <p>Welcome aboard! Let’s make something amazing together.<br/>— The IVContent Team 💡</p>
  `);
  return send({ to, subject, html: body });
}

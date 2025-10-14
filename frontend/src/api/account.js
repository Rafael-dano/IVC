import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";
import { registerCheckoutSession } from "../analytics/gtag";

export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson("/api/me", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  const { url } = await httpJson("/api/billing/portal", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!url) throw new Error("Portal URL missing.");
  window.location.href = url;
}

export async function openAnnualCheckout(region, tracking) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  const payload = region ? { region } : {};
  const resp = await httpJson("/api/checkout/annual", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(payload),
  });
  if (!resp?.url) throw new Error("Checkout URL missing.");
  if (resp.session_id) {
    registerCheckoutSession({
      sessionId: resp.session_id,
      ...(tracking || {}),
    });
  }
  window.location.href = resp.url;
}

export async function openAnnualPromo(code, tracking) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  if (!code) throw new Error("Promo code required.");
  const body = await httpJson("/api/checkout/annual-promo", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ code }),
  });
  if (!body?.url) throw new Error("Checkout URL missing.");
  if (body.session_id) {
    registerCheckoutSession({
      sessionId: body.session_id,
      ...(tracking || {}),
    });
  }
  window.location.href = body.url;
}

export async function openLifetime400() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  const body = await httpJson("/api/checkout/lifetime-400", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!body?.url) throw new Error("Checkout URL missing.");
  if (body.session_id) {
    registerCheckoutSession({
      sessionId: body.session_id,
    });
  }
  window.location.href = body.url;
}

export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson("/api/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}
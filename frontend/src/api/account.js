// frontend/src/api/account.js
import { supabase } from "../api/supabaseClient.js";
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Small helper using fetch directly so we can read error bodies
async function httpJsonRaw(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) }});
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body || {};
}

export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJsonRaw(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const { url } = await httpJsonRaw(`${API_BASE}/api/billing/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!url) throw new Error("Portal URL missing.");
  window.location.href = url;
}

export async function openAnnualCheckout(region) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const body = region ? { region } : {};
  const { url } = await httpJsonRaw(`${API_BASE}/api/checkout/annual`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });

  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function openAnnualPromo(code) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  if (!code) throw new Error("Promo code required.");

  const { url } = await httpJsonRaw(`${API_BASE}/api/checkout/annual-promo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ code }),
  });

  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function openLifetime400() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const { url } = await httpJsonRaw(`${API_BASE}/api/checkout/lifetime-400`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

function redirectToCheckout(envKey) {
  const checkoutUrl = import.meta.env[envKey];
  if (!checkoutUrl) {
    throw new Error(`Checkout link missing. Please configure ${envKey}.`);
  }

  window.location.href = checkoutUrl;
}

export function openAnnualCheckout() {
  redirectToCheckout("VITE_CHECKOUT_ANNUAL");
}

export function openAnnualPromo(tierKey) {
  const lookup = {
    annual_99: "VITE_CHECKOUT_ANNUAL_99",
    annual_149: "VITE_CHECKOUT_ANNUAL_149",
  };

  const envKey = lookup[tierKey];
  if (!envKey) {
    throw new Error("Unknown annual promo tier");
  }

  redirectToCheckout(envKey);
}

export function openLifetime400() {
  redirectToCheckout("VITE_CHECKOUT_LIFETIME_400");
}
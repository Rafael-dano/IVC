// frontend/src/api/account.js
import { supabase } from "../api/supabaseClient.js";

const ENV = (() => {
  if (typeof import.meta !== "undefined" && import.meta?.env) return import.meta.env;
  if (typeof process !== "undefined" && process?.env) return process.env;
  return {};
})();

const API_BASE_RAW = ENV.VITE_API_BASE || ENV.API_BASE || "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, ""); // may be "" to use same-origin /api/*

async function httpJsonRaw(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    const msg = body?.error || body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body || {};
}

async function authed(url, init = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJsonRaw(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${session.access_token}` },
  });
}

export async function fetchMe() {
  return authed(`${API_BASE}/api/me`);
}

export async function openBillingPortal() {
  const { url } = await authed(`${API_BASE}/api/billing/portal`, { method: "POST" });
  if (!url) throw new Error("Portal URL missing.");
  window.location.href = url;
}

/** Monthly PRO — region-aware (US, BR, MX). POST body: { region?: "US"|"BR"|"MX" } */
export async function openProCheckout(region) {
  const body = region ? { region } : {};
  const { url } = await authed(`${API_BASE}/api/checkout/pro`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

/** Regular Annual ($160) — region-aware (US, BR, MX). POST body: { region?: "US"|"BR"|"MX" } */
export async function openAnnualCheckout(region) {
  const body = region ? { region } : {};
  const { url } = await authed(`${API_BASE}/api/checkout/annual`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

/** Limited Annual cohorts (USD only) — code: "ANNUAL_99" | "ANNUAL_149" */
export async function openAnnualPromo(code) {
  if (!code) throw new Error("Promo code required.");
  const { url } = await authed(`${API_BASE}/api/checkout/annual-promo`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

/** Lifetime $400 (USD one-time) */
export async function openLifetime400() {
  const { url } = await authed(`${API_BASE}/api/checkout/lifetime-400`, { method: "POST" });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

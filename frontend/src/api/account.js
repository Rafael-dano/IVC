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

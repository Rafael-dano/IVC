import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";

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

export async function openAnnualCheckout(region) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  const body = region ? { region } : {};
  const { url } = await httpJson("/api/checkout/annual", {
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
  const { url } = await httpJson("/api/checkout/annual-promo", {
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
  const { url } = await httpJson("/api/checkout/lifetime-400", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson("/api/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.ivcontent.com";

export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const res = await fetch(`${API_BASE}/api/billing/portal`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Could not open billing portal");
  window.location.href = body.url;
}

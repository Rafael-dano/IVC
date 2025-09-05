import { supabase } from "../api/supabaseClient.js";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Failed to load account");
  return res.json();
}

export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/api/billing/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Could not open billing portal");
  }
  const { url } = await res.json();
  window.location.href = url;
}

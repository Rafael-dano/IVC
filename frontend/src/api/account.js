// frontend/src/api/account.js
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

// GET /api/me with auth header
export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

// POST /api/billing/portal and redirect
export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const { url } = await httpJson(`${API_BASE}/api/billing/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  window.location.href = url;
}

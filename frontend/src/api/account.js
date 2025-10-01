import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export async function fetchMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");
  return httpJson(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
}

export async function openBillingPortal() {
  const token = (await (await import("./supabaseClient")).supabase.auth.getSession())
    ?.data?.session?.access_token;

  const res = await fetch(`${import.meta.env.VITE_API_BASE || "https://api.ivcontent.com"}/api/billing/portal`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Could not open billing portal");
  window.location.href = body.url;
}

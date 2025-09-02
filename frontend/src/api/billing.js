// frontend/src/api/billing.js
import { supabase } from "../api/supabaseClient.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export async function startCheckout({ price = "LTD", mode = "payment" }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ price, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Checkout failed");
  }
  const { url } = await res.json();
  window.location.href = url; // redirect to Stripe Checkout
}

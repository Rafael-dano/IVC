import { supabase } from "../api/supabaseClient";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window?.location?.origin?.includes("localhost")
    ? "http://127.0.0.1:5051"
    : "https://api.ivcontent.com");

// LTD: tier must be one of your backend plan keys, e.g. LTD_99, LTD_149, LTD_199
export async function startLTDCheckout(tier = "LTD_99") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const r = await fetch(`${API_BASE}/api/checkout/ltd`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tier }), // 👈 pass the string, not a bare variable
  });

  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || "Checkout failed");
  if (!b.url) throw new Error("No checkout URL returned");
  window.location.href = b.url;
}

export async function startProCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const r = await fetch(`${API_BASE}/api/checkout/pro`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error || "Checkout failed");
  if (!b.url) throw new Error("No checkout URL returned");
  window.location.href = b.url;
}

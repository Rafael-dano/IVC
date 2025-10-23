import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "./http.js";

export async function startCheckout({ price = "LTD", mode = "payment" }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in first.");

  const { url } = await httpJson("/api/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ price, mode }),
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url; // redirect to Stripe Checkout
}

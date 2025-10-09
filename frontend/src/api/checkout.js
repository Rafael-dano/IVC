import { supabase } from "../api/supabaseClient";
import { httpJson } from "./http.js";

// LTD: tier must be one of your backend plan keys, e.g. LTD_400
export async function startLTDCheckout(tier = "LTD_400") {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const body = await httpJson("/api/checkout/ltd", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tier }),
  });

  if (!body?.url) throw new Error("No checkout URL returned");
  window.location.href = body.url;
}

export async function startProCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const body = await httpJson("/api/checkout/pro", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!body?.url) throw new Error("No checkout URL returned");
  window.location.href = body.url;
}

import { supabase } from "../api/supabaseClient";
import { httpJson } from "./http.js";
import { registerCheckoutSession } from "../analytics/gtag";

// LTD: tier must be one of your backend plan keys, e.g. LTD_400
export async function startLTDCheckout(tier = "LTD_400", tracking) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const body = await httpJson("/api/checkout/ltd", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tier }),
  });

  if (!body?.url) throw new Error("No checkout URL returned");
  if (body.session_id) {
    registerCheckoutSession({
      sessionId: body.session_id,
      ...(tracking || {}),
    });
  }
  window.location.href = body.url;
}

export async function startProCheckout(tracking) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const body = await httpJson("/api/checkout/pro", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!body?.url) throw new Error("No checkout URL returned");
  if (body.session_id) {
    registerCheckoutSession({
      sessionId: body.session_id,
      ...(tracking || {}),
    });
  }
  window.location.href = body.url;
}
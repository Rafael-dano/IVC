// frontend/src/api/textGeneration.js
import { supabase } from "./supabaseClient.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

/**
 * Back-compat signature: (userId, prompt)
 * - We IGNORE userId; backend derives user from the Supabase access token.
 */
export async function generateContent(_userId, prompt, format = "repurpose") {
  // require a session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in to use this feature.");

  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ✅ send the Supabase access token
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, format }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate content");
  }
  const data = await res.json();
  return data.result;
}

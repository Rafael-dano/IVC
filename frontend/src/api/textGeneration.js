import { supabase } from "./supabaseClient.js";
import { httpJson } from "./http.js";

/**
 * - We IGNORE userId; backend derives user from the Supabase access token.
 */
export async function generateContent(_userId, prompt, format = "repurpose") {
  // require a session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in to use this feature.");

  const data = await httpJson("/api/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, format }),
  });
  
  return data.result;
}

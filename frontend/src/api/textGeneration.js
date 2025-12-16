import { supabase } from "./supabaseClient.js";
import { httpJson } from "./http.js";

/**
 * Backend derives user from Supabase access token.
 * Returns: { result, output, contentItemId, ... }
 */
export async function generateContent(
  _userId,
  prompt,
  format = "repurpose",
  options = {}
) {
  const { saveToVault = false, title = null, projectId = null, meta = {} } = options;

  // require a session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in to use this feature.");

  const data = await httpJson("/api/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt,
      format,
      saveToVault,
      title,
      projectId,
      meta,
    }),
  });

  // Return the full payload so UI can read contentItemId
  return data;
}

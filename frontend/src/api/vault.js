import { supabase } from "./supabaseClient.js";
import { httpJson } from "./http.js";

export async function listVaultItems(limit = 50) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in.");

  return httpJson(`/api/vault?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

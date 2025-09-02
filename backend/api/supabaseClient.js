// backend/api/supabaseClient.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env"
  );
}

// Admin client (server-side only)
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "public" },
});

// 🔁 Back-compat: some files might import { supabase } from this module
// We alias supabase -> supabaseAdmin to avoid breaking imports.
export const supabase = supabaseAdmin;

export default supabaseAdmin;

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing, provide a no-op supabase shim so the app doesn't crash
let supabase;
if (url && anon) {
  supabase = createClient(url, anon);
} else {
  console.warn("⚠️ Supabase env not set on frontend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Using no-op auth shim.");
  supabase = {
    auth: {
      // mimic the API shape, return "no user"
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  };
}

export { supabase };

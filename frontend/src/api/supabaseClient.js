import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing, provide a no-op supabase shim so the app doesn't crash
let supabase;
if (url && anon) {
  supabase = createClient(url, anon);
} else {
  console.warn(
    "⚠️ Supabase env not set on frontend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Using no-op auth shim."
  );
  const notConfiguredError = (method) =>
    new Error(`Supabase auth shim: \`${method}\` requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.`);
  const nullSession = { data: { session: null }, error: null };
  const nullUser = { data: { user: null }, error: null };
  supabase = {
    auth: {
      // mimic the API shape, return "no user"
      getUser: async () => nullUser,
      getSession: async () => nullSession,
      onAuthStateChange: (_callback) => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: notConfiguredError("signInWithPassword"),
      }),
      resetPasswordForEmail: async () => ({
        data: {},
        error: notConfiguredError("resetPasswordForEmail"),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: notConfiguredError("signUp"),
      }),
      updateUser: async () => ({
        data: { user: null },
        error: notConfiguredError("updateUser"),
      }),
    },
  };
}

export { supabase };
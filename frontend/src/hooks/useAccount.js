import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "../api/http.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

async function fetchMeWithRetry(token, attempts = 2) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await httpJson(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
    } catch (e) {
      lastErr = e;
      await new Promise(res => setTimeout(res, 250)); // tiny backoff
    }
  }
  throw lastErr || new Error("fetch /api/me failed");
}

export function useAccount() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (active) { setAccount(null); setLoading(false); }
          return;
        }
        const json = await fetchMeWithRetry(session.access_token, 2);
        if (active) setAccount(json);
      } catch (e) {
        if (active) setError(e.message || "Failed to load account");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  return { loading, account, error };
}


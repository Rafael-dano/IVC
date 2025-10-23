import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../api/supabaseClient.js";

export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let unsub;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data?.session);
      setChecking(false);

      unsub = supabase.auth.onAuthStateChange((_e, session) => {
        setAuthed(!!session);
      }).data?.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  if (checking) return <div className="p-6">Checking session…</div>;
  if (!authed) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

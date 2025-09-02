// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js"; // <-- correct path
import "./Settings.css";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [hasAuth, setHasAuth] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // If your frontend supabaseClient is a shim (no env),
        // getUser() will return { user: null } and that's fine.
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = data?.user || null;
        if (!user) {
          setHasAuth(false);
          setLoading(false);
          return;
        }

        setEmail(user.email || "");

        // Fetch profile (if none, not an error—just empty state)
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profErr) {
          // If table/policies misconfigured, surface minimal info:
          console.warn("profiles select error:", profErr.message);
        }

        if (!cancelled) {
          setDisplayName(profile?.display_name || "");
          setLoading(false);
        }
      } catch (e) {
        console.error("Settings init error:", e);
        setHasAuth(false);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveDisplayName() {
    try {
      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = data?.user;
      if (!user) return alert("Please sign in to edit your settings.");

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName, updated_at: new Date().toISOString() });
      if (error) return alert(error.message);

      alert("✅ Display name saved.");
    } catch (e) {
      console.error("saveDisplayName error:", e);
      alert("Could not save display name.");
    }
  }

  async function changeEmail() {
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) return alert(error.message);
      alert("✅ Check your inbox to confirm the new email.");
    } catch (e) {
      console.error("changeEmail error:", e);
      alert("Could not change email.");
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <p className="opacity-80">Loading settings…</p>
      </div>
    );
  }

  if (!hasAuth) {
    return (
      <div className="max-w-xl mx-auto py-10 space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="opacity-80">You’re not signed in. Please log in to manage your settings.</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-cyan-500 text-black rounded hover:bg-cyan-600"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        <section className="settings-section">
          <label>Display Name</label>
          <input
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
          <button onClick={saveDisplayName} className="settings-btn primary">
            Save
          </button>
        </section>
  
        <section className="settings-section">
          <label>Email</label>
          <input
            className="settings-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="me@example.com"
            type="email"
          />
          <button onClick={changeEmail} className="settings-btn primary">
            Change Email
          </button>
          <p className="settings-footer-note">
            You’ll receive a confirmation email to verify the change.
          </p>
        </section>
  
        <section className="settings-section flex gap-3">
          <button onClick={logout} className="settings-btn secondary">
            Log Out
          </button>
          <button disabled className="settings-btn danger">
            Delete Account (coming soon)
          </button>
        </section>
        
      </div>
      <a
          href="/help"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        ><strong>
          ← Back to Help</strong>
        </a>
    </div>
  );
}





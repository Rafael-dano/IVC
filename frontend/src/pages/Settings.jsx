// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js";
import "./Settings.css";
import { fetchMe, openBillingPortal } from "../api/account.js";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [hasAuth, setHasAuth] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState(null);     // { user: {...}, usage: {...} }
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Ensure user session exists
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = data?.user || null;
        if (!user) {
          if (!cancelled) {
            setHasAuth(false);
            setLoading(false);
          }
          return;
        }

        setEmail(user.email || "");

        // 2) Load profile display_name (optional)
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profErr) console.warn("profiles select error:", profErr.message);
        setDisplayName(profile?.display_name || "");

        // 3) Load account (plan + usage) from backend
        try {
          const me = await fetchMe(); // uses supabase token under the hood
          if (!cancelled) setAccount(me);
        } catch (e) {
          console.warn("fetchMe failed (maybe user has no plan yet):", e.message);
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error("Settings init error:", e);
        if (!cancelled) {
          setHasAuth(false);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function saveDisplayName() {
    try {
      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = data?.user;
      if (!user) return alert("Please sign in to edit your settings.");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });
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

  async function handleOpenPortal() {
    try {
      setPortalBusy(true);
      await openBillingPortal(); // uses token internally
      // will redirect if successful
    } catch (e) {
      alert(e.message || "Could not open billing portal");
    } finally {
      setPortalBusy(false);
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

  const planKey = (account?.user?.plan || "FREE").toLowerCase();
  const hasStripeCustomer = !!account?.user?.stripe_customer_id;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        {/* Account card: plan + usage + portal button */}
        {account && (
          <div className="settings-card">
            <div className="settings-card__row">
              <span className={`badge badge--${planKey}`}>{account.user.plan}</span>

              {/* Show Manage Billing if we know the Stripe customer (PRO or anyone who checked out before) */}
              {hasStripeCustomer && (
                <button
                  className="btn btn--ghost"
                  onClick={handleOpenPortal}
                  disabled={portalBusy}
                  title="Manage your subscription in Stripe"
                >
                  {portalBusy ? "Opening…" : "Manage Billing"}
                </button>
              )}
            </div>

            <div className="settings-card__row">
              <div className="settings-meta">
                <div>
                  <strong>Monthly usage:</strong>{" "}
                  {account.usage.remaining} / {account.usage.month_tokens_limit} tokens left
                </div>
                {account.user.renews_at && (
                  <div>
                    <strong>Renews:</strong>{" "}
                    {new Date(account.user.renews_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
      >
        <strong>← Back to Help</strong>
      </a>
    </div>
  );
}
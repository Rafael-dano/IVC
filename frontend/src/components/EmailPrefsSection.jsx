import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { httpJson } from "../api/http.js";
import "./EmailPrefsSection.css";

export default function EmailPrefsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optIn, setOptIn] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchPrefs() {
    setLoading(true);
    setMessage("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const body = await httpJson("/api/marketing/prefs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOptIn(!!body.marketing_opt_in);
    } catch (e) {
      setMessage(e.message || "Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  }

  async function savePrefs(newValue) {
    setSaving(true);
    setMessage("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const body = await httpJson("/api/marketing/prefs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketing_opt_in: newValue }),
      });
      setMessage(newValue ? "✅ Preferences saved." : "✅ Unsubscribed from newsletters.");
      setOptIn(!!body.marketing_opt_in);
    } catch (e) {
      setMessage(e.message || "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { fetchPrefs(); }, []);

  const busy = loading || saving;
  const statusClass = message
    ? message.trim().startsWith("✅")
      ? "status-success"
      : "status-error"
    : "";

  return (
    <section className="surface-card surface-card--subtle email-prefs">
    <header className="email-prefs__header">
      <h3>Email Preferences</h3>
      <p className="muted-text">
        Choose whether you want to receive product updates, tips, and occasional newsletters. Transactional emails (receipts,
        security notices) may still be sent.
      </p>
    </header>

    {message && <div className={`email-prefs__status ${statusClass}`}>{message}</div>}

    <div className="email-prefs__row">
      <span className="muted-text">Receive product updates & newsletters</span>
        <button
          disabled={busy}
          onClick={() => savePrefs(!optIn)}
          className={`button-secondary email-prefs__toggle ${busy ? "is-loading" : ""}`}
          title={optIn ? "Click to unsubscribe" : "Click to subscribe"}
        >
          {loading ? "Loading…" : saving ? "Saving…" : optIn ? "Unsubscribe" : "Subscribe"}
        </button>
      </div>
    </section>
  );
}
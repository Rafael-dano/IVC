import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { httpJson } from "../api/http.js";

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

  return (
    <section className="bg-white rounded-xl shadow p-6 space-y-3">
      <h3 className="text-lg font-semibold">Email Preferences</h3>
      <p className="text-sm text-gray-600">
        Choose whether you want to receive product updates, tips, and occasional newsletters. Transactional
        emails (receipts, security notices) may still be sent.
      </p>

      {message && <div className="text-sm">{message}</div>}

      <div className="flex items-center justify-between">
        <label className="text-gray-800 font-medium">Receive product updates & newsletters</label>
        <button
          disabled={loading || saving}
          onClick={() => savePrefs(!optIn)}
          className={`px-4 py-2 rounded-md text-white transition ${
            (loading || saving)
              ? "bg-gray-300 cursor-not-allowed"
              : optIn
              ? "bg-gray-700 hover:bg-gray-800"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
          title={optIn ? "Click to unsubscribe" : "Click to subscribe"}
        >
          {loading ? "Loading…" : saving ? "Saving…" : optIn ? "Unsubscribe" : "Subscribe"}
        </button>
      </div>
    </section>
  );
}

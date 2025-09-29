// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js";
import "./Settings.css";
import { fetchMe, openBillingPortal } from "../api/account.js";
import { useTranslation } from "react-i18next";
import EmailPrefsSection from "../components/EmailPrefsSection";
import CompanyBlock from "../components/CompanyBlock";
import { revokeAnalytics } from "../analytics/consent";

export default function Settings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [hasAuth, setHasAuth] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [unsubbed, setUnsubbed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profErr) console.warn("profiles select error:", profErr.message);
        setDisplayName(profile?.display_name || "");

        try {
          const me = await fetchMe();
          if (!cancelled) setAccount(me);
        } catch (e) {
          console.warn("fetchMe failed:", e.message);
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

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("unsub") === "success") {
      setUnsubbed(true);
      // optional: clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("unsub");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function saveDisplayName() {
    try {
      const { data, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = data?.user;
      if (!user) return alert(t("settings.needSignIn"));

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });
      if (error) return alert(error.message);
      alert(t("settings.savedName"));
    } catch (e) {
      console.error("saveDisplayName error:", e);
      alert(t("settings.saveNameError"));
    }
  }

  async function changeEmail() {
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) return alert(error.message);
      alert(t("settings.checkInbox"));
    } catch (e) {
      console.error("changeEmail error:", e);
      alert(t("settings.changeEmailError"));
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
      await openBillingPortal();
    } catch (e) {
      alert(e.message || t("settings.billingPortalError"));
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <p className="opacity-80">{t("settings.loading")}</p>
      </div>
    );
  }

  if (!hasAuth) {
    return (
      <div className="max-w-xl mx-auto py-10 space-y-4">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="opacity-80">{t("settings.notSignedIn")}</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-cyan-500 text-black rounded hover:bg-cyan-600"
        >
          {t("settings.goToLogin")}
        </a>
      </div>
    );
  }

  const planKey = (account?.user?.plan || "FREE").toLowerCase();
  const hasStripeCustomer = !!account?.user?.stripe_customer_id;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">{t("settings.title")}</h1>

        {account && (
          <div className="settings-card">
            <div className="settings-card__row">
              <span className={`badge badge--${planKey}`}>{account.user.plan}</span>
              {hasStripeCustomer && (
                <button
                  className="btn btn--ghost"
                  onClick={handleOpenPortal}
                  disabled={portalBusy}
                  title={t("settings.manageBillingTitle")}
                >
                  {portalBusy ? t("settings.opening") : t("settings.manageBilling")}
                </button>
              )}
            </div>

            <div className="settings-card__row">
              <div className="settings-meta">
                <div>
                  <strong>{t("settings.monthlyUsage")}:</strong>{" "}
                  {account.usage.remaining} / {account.usage.month_tokens_limit} {t("settings.tokensLeft")}
                </div>
                {account.user.renews_at && (
                  <div>
                    <strong>{t("settings.renews")}:</strong>{" "}
                    {new Date(account.user.renews_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {account?.usage && (
          <div className="settings-card">
            <div className="settings-card__row">
              <strong>{t("settings.transcriptionMinutes")}</strong>
            </div>

            {(() => {
              const used = account.usage.transcription_minutes_used ?? 0;
              const limit = account.usage.transcription_minutes_limit ?? 0;
              const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              return (
                <div className="settings-card__row" style={{flexDirection: "column", gap: "8px"}}>
                  <div style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                    <span>{used} / {limit} {t("settings.minUsed")}</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{width: "100%", height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 6}}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e",
                      borderRadius: 6
                    }} />
                  </div>
                  {limit === 0 && (
                    <p className="opacity-80 text-sm">
                      {t("settings.noTranscriptionMinutes")}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <section className="settings-section">
          <label>{t("settings.displayName")}</label>
          <input
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("settings.displayNamePH")}
          />
          <button onClick={saveDisplayName} className="settings-btn primary">
            {t("settings.save")}
          </button>
        </section>

        <section className="settings-section">
          <label>{t("settings.email")}</label>
          <input
            className="settings-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="me@example.com"
            type="email"
          />
          <button onClick={changeEmail} className="settings-btn primary">
            {t("settings.changeEmail")}
          </button>
          <p className="settings-footer-note">
            {t("settings.confirmationNote")}
          </p>
        </section>

        <section className="settings-section flex gap-3">
          <button onClick={logout} className="settings-btn secondary">
            {t("settings.logout")}
          </button>
          <button disabled className="settings-btn danger">
            {t("settings.deleteSoon")}
          </button>
        </section>
      </div>

      <a
        href="/help"
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        <strong>← {t("settings.backToHelp")}</strong>
      </a>
      {unsubbed && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          ✅ You’ve been unsubscribed from marketing emails. You can re-subscribe below anytime.
        </div>
      )}
      <EmailPrefsSection />
      <CompanyBlock />  
      <button
          className="settings-btn secondary"
          onClick={() => { revokeAnalytics(); alert("Analytics disabled. Reload to apply."); }}
        >
          Disable analytics / reset consent
        </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js";
import "./Settings.css";
import { deleteAccount, fetchMe, openBillingPortal } from "../api/account.js";
import { useTranslation } from "react-i18next";
import EmailPrefsSection from "../components/EmailPrefsSection";
import CompanyBlock from "../components/CompanyBlock";
import { revokeAnalytics } from "../analytics/consent";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { isPaid } from "../utils/plan.js";
import { maybeTrackPurchaseFromStorage } from "../analytics/gtag";

export default function Settings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [hasAuth, setHasAuth] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [unsubbed, setUnsubbed] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let replaced = false;

    if (params.get("checkout") === "success") {
      maybeTrackPurchaseFromStorage();
      params.delete("checkout");
      replaced = true;
    }

    if (params.get("unsub") === "success") {
      setUnsubbed(true);
      params.delete("unsub");
      replaced = true;
    }

    if (replaced) {
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

  async function handleDeleteAccount() {
    if (deleteBusy) return;
    const confirmed = window.confirm(t("settings.deleteConfirm"));
    if (!confirmed) return;
    try {
      setDeleteBusy(true);
      await deleteAccount();
      await supabase.auth.signOut();
      alert(t("settings.deleteSuccess"));
      window.location.href = "/";
    } catch (e) {
      console.error("deleteAccount error:", e);
      alert(e?.message || t("settings.deleteError"));
    } finally {
      setDeleteBusy(false);
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

  const planUpper = (account?.user?.plan || "FREE").toUpperCase();
  const planKey = planUpper.toLowerCase();
  const canManageBilling = isPaid(planUpper);

  let mainContent;

  if (loading) {
    mainContent = (
      <section className="surface-card surface-card--subtle">
        <p className="muted-text">{t("settings.loading")}</p>
      </section>
    );
  } else if (!hasAuth) {
    mainContent = (
      <section className="surface-card">
        <p className="muted-text">{t("settings.notSignedIn")}</p>
        <a href="/login" className="button-primary">
          {t("settings.goToLogin")}
        </a>
      </section>
    );
  } else {
    mainContent = (
      <div className="section-stack settings-stack">
        {account && (
          <div className="surface-card settings-card">
            <div className="settings-card__row">
              <span className={`badge badge--${planKey}`}>{account.user.plan}</span>
              {canManageBilling && (
                <button
                  className={`button-ghost ${portalBusy ? "is-loading" : ""}`}
                  onClick={handleOpenPortal}
                  disabled={portalBusy}
                  title={t("settings.manageBillingTitle")}
                >
                  {portalBusy ? t("settings.opening") : t("settings.manageBilling")}
                </button>
              )}
            </div>

            {account?.usage && (
              <div className="settings-card__row settings-card__row--metrics">
                <div>
                <div className="settings-meta">
                    <strong>{t("settings.monthlyUsage")}:</strong>{" "}
                    {account.usage.remaining} / {account.usage.month_tokens_limit} {t("settings.tokensLeft")}
                  </div>
                  {account.user.renews_at && (
                    <div className="settings-meta">
                      <strong>{t("settings.renews")}:</strong>{" "}
                      {new Date(account.user.renews_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              
                {(() => {
                  const used = account.usage.transcription_minutes_used ?? 0;
                  const limit = account.usage.transcription_minutes_limit ?? 0;
                  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                  return (
                    <div className="settings-meter">
                      <div className="settings-meter__labels">
                        <span>{used} / {limit} {t("settings.minUsed")}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="settings-meter__bar">
                        <span
                          className={`settings-meter__fill ${pct > 90 ? "is-critical" : pct > 70 ? "is-warning" : "is-ok"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {limit === 0 && (
                        <p className="muted-text settings-small-note">{t("settings.noTranscriptionMinutes")}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        <section className="surface-card settings-section">
          <label>{t("settings.displayName")}</label>
          <input
            className="input-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("settings.displayNamePH")}
          />
          <button onClick={saveDisplayName} className="button-primary">
            {t("settings.save")}
          </button>
        </section>

        <section className="surface-card settings-section">
          <label>{t("settings.email")}</label>
          <input
            className="input-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="me@example.com"
            type="email"
          />
          <button onClick={changeEmail} className="button-primary">
            {t("settings.changeEmail")}
          </button>
          <p className="settings-footer-note">{t("settings.confirmationNote")}</p>
        </section>

        <section className="surface-card settings-section settings-actions">
          <button onClick={logout} className="button-secondary">
            {t("settings.logout")}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="button-danger"
            disabled={deleteBusy}
          >
            {deleteBusy ? t("settings.deleting") : t("settings.delete")}
          </button>
        </section>

        {unsubbed && (
          <div className="surface-card surface-card--subtle status-success">
            ✅ You’ve been unsubscribed from marketing emails. You can re-subscribe below anytime.
          </div>
        )}

        <EmailPrefsSection />
        <CompanyBlock />

        <button
          className="button-secondary"
          onClick={() => { revokeAnalytics(); alert("Analytics disabled. Reload to apply."); }}
        >
          Disable analytics / reset consent
        </button>
        </div>
    );
  }

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content page-content--narrow section-stack settings-page">
        <header className="page-intro">
          <h1 className="page-title">{t("settings.title")}</h1>
        </header>
        {mainContent}
      </main>
      <Footer />
    </div>
  );
}

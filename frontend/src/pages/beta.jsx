import { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./beta.css";
import { useTranslation } from "react-i18next";
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "../api/http.js";
import posthog from "posthog-js";

const BETA_FORM_URL = import.meta.env.VITE_BETA_FORM_URL;
const BETA_FORM_EMAIL_ENTRY = import.meta.env.VITE_BETA_FORM_EMAIL_ENTRY;

export default function Beta() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [nextMessage, setNextMessage] = useState("");

  const source = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("utm_source") || params.get("source") || "beta-page";
  }, []);

  async function getBetaFormUrl() {
    if (!BETA_FORM_URL || !BETA_FORM_EMAIL_ENTRY) {
      throw new Error(t("beta.formUnavailable"));
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error(userError.message || t("beta.genericError"));
    }

    const email = userData?.user?.email?.trim();
    if (!email) {
      throw new Error(t("beta.noEmail"));
    }

    let formUrl;
    try {
      formUrl = new URL(BETA_FORM_URL);
    } catch {
      throw new Error(t("beta.formUnavailable"));
    }

    formUrl.searchParams.set(BETA_FORM_EMAIL_ENTRY, email);
    if (!formUrl.searchParams.has("usp")) {
      formUrl.searchParams.set("usp", "pp_url");
    }

    return formUrl.toString();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    posthog.capture("beta_signup_submitted", { source });

    setSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(userError.message || t("beta.genericError"));
      }

      const user = userData?.user;
      const cleanEmail = user?.email?.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error(t("beta.noEmail"));
      }

      const displayName =
        (user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.user_metadata?.display_name ||
          "")
          .toString()
          .trim() || null;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const body = await httpJson("/api/beta/signup", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: cleanEmail, name: displayName, source }),
      });

      posthog.capture("beta_signup_succeeded");

      const guidance = body.next ?? t("beta.agreementDefault");
      const formUrl = await getBetaFormUrl();

      setNextMessage(guidance);
      setOk(true);
      window.open(formUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e.message || t("beta.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAgreementRetry() {
    setError("");
    try {
      const formUrl = await getBetaFormUrl();
      window.open(formUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e.message || t("beta.genericError"));
    }
  }

  async function checkOrActivate() {
    setError("");

    posthog.capture("beta_activate_attempt");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      // try activate (idempotent)
      try {
        const actBody = await httpJson("/api/beta/activate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        posthog.capture("beta_activate_succeeded", { plan: actBody?.plan || "unknown" });

        setNextMessage(
          `Your plan is ${actBody.plan}. ${
            actBody.beta_expires_at ? `Beta expires: ${new Date(actBody.beta_expires_at).toLocaleString()}` : ""
          }`
        );
        setOk(true);
        return;
      } catch (e) {
        // activation failed; fall through to status check
      }

      // If not approved yet, show status
      const stBody = await httpJson("/api/beta/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNextMessage(
        `Status: plan ${stBody.plan}${
          stBody.beta_expires_at ? `, beta expires ${new Date(stBody.beta_expires_at).toLocaleString()}` : ""
        }. If you already submitted the form, give it a minute and try Activate again.`
      );
    } catch (e) {
      posthog.capture("beta_activate_failed");
      setError(e.message || "Something went wrong");
    }
  }

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content page-content--narrow section-stack">
        <header className="page-intro">
          <h1 className="page-title">{t("beta.title")}</h1>
          <p className="page-subtitle">{t("beta.sub")}</p>
        </header>

        {!ok ? (
           <form onSubmit={onSubmit} className="surface-card beta-card form-stack">
            <div className="beta-meta">
              {t("beta.source")}: <code>{source}</code>
            </div>

            <p className="beta-note">{t("beta.agreementNotice")}</p>

            {error && <div className="beta-status status-error">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className={`button-primary beta-cta ${submitting ? "is-loading" : ""}`}
            >
              {submitting ? t("beta.submitting") : t("beta.joinCta")}
            </button>
           
            <div className="beta-footnote">{t("beta.privacyNote")}</div>
          </form>
        ) : (
          <div className="surface-card beta-card">
          <div className="beta-celebrate" aria-hidden>🎉</div>
          <h2 className="section-heading">{t("beta.inTitle")}</h2>
          <p className="muted-text">{nextMessage || t("beta.agreementDefault")}</p>
          <div className="button-row">
            <button type="button" className="button-secondary" onClick={handleAgreementRetry}>
              {t("beta.openForm") || "Open form again"}
            </button>
            <button type="button" className="button-ghost" onClick={checkOrActivate}>
              {t("beta.activateCta") || "Activate access"}
            </button>
          </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
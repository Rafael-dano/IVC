import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./beta.css";
import { useTranslation } from "react-i18next";
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "../api/http.js";
import { track } from "../analytics";
import posthog from "posthog-js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";
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

      const body = await httpJson(`${API_BASE}/api/beta/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        const actBody = await httpJson(`${API_BASE}/api/beta/activate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
      const stBody = await httpJson(`${API_BASE}/api/beta/status`, {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans">
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <header className="beta-hero">
          <h1 className="text-4xl font-bold text-purple-700">{t("beta.title")}</h1>
          <p className="text-lg text-gray-700">
            {t("beta.sub")}
          </p>
        </header>

        {!ok ? (
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="text-sm text-gray-500">
              {t("beta.source")}: <code>{source}</code>
            </div>

            <p className="text-sm text-gray-600 bg-purple-50 border border-purple-100 rounded-md px-3 py-2">
              {t("beta.agreementNotice")}
            </p>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-md px-4 py-2 text-white transition
                ${submitting ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              {submitting ? t("beta.submitting") : t("beta.joinCta")}
            </button>

            <div className="text-xs text-gray-500">
              {t("beta.privacyNote")}
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center space-y-4">
            <div className="text-2xl">🎉</div>
            <h2 className="text-xl font-semibold">{t("beta.inTitle")}</h2>
            <p className="text-gray-700">{nextMessage || t("beta.agreementDefault")}</p>

            <button
              type="button"
              onClick={handleAgreementRetry}
              className="w-full rounded-md px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 transition"
            >
              {t("beta.joinCta")}
            </button>

            <button
              type="button"
              onClick={checkOrActivate}
              className="w-full rounded-md px-4 py-2 text-white bg-green-600 hover:bg-green-700 transition"
            >
              {t("beta.activateCta")}
            </button>
            
            <p className="text-sm text-gray-500">{t("beta.agreementReminder")}</p>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <a
              href="/ltd"
              className="inline-block mt-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              ← {t("beta.backToLTD")}
            </a>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

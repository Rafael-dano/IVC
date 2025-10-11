// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "../api/http.js";
import "./Auth.css";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/app";

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function ensureProfile(userFromSignIn = null) {
    try {
      let user = userFromSignIn;
      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user || null;
      }
      if (!user) return;
      const displayName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      const cleanedName = (displayName || "").toString().trim();
      await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: cleanedName || null });
    } catch (err) {
      console.warn("Failed to ensure profile after login:", err?.message || err);
    }
  }

  async function sendWelcomeOnce(sessionFromSignIn = null) {
    try {
      let session = sessionFromSignIn;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session || null;
      }
      const token = session?.access_token;
      if (!token) return;
      // fire-and-forget; server dedupes via welcome_sent_at
      httpJson("/api/email/welcome", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      ensureProfile(signInData?.user);
      // kick off welcome email (non-blocking)
      sendWelcomeOnce(signInData?.session || null);

      setLoading(false);
      navigate(from);
    } catch (err) {
      alert(err.message || t("auth.login.error"));
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!form.email) return alert(t("auth.reset.promptEmailMissing"));
    setSending(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) throw error;
      alert(t("auth.reset.sent"));
    } catch (err) {
      alert(err.message || t("auth.reset.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">{t("auth.login.title")}</div>
          <div className="auth-subtitle">{t("auth.login.subtitle")}</div>
          <Link to="/" className="auth-link">{t("auth.common.backHome")}</Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder={t("auth.common.emailPlaceholder")}
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder={t("auth.common.passwordPlaceholder")}
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? t("auth.login.loading") : t("auth.login.cta")}
          </button>
        </form>

        <div className="auth-row">
          <button
            onClick={handlePasswordReset}
            className="auth-link"
            disabled={sending}
          >
            {sending ? t("auth.reset.sending") : t("auth.reset.link")}
          </button>
          <Link to="/signup" className="auth-link">{t("auth.signup.link")}</Link>
        </div>
      </div>
    </div>
  );
}
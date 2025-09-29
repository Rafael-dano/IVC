// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../api/supabaseClient.js";
import { httpJson } from "../api/http.js";
import "./Auth.css";
import { useTranslation } from "react-i18next";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window?.location?.origin?.includes("localhost")
    ? "http://127.0.0.1:5051"
    : "https://api.ivcontent.com");

export default function Login() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function sendWelcomeOnce() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      // fire-and-forget; server dedupes via welcome_sent_at
      httpJson(`${API_BASE}/api/email/welcome`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      // kick off welcome email (non-blocking)
      sendWelcomeOnce();

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
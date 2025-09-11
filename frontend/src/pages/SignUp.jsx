import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient.js";
import "./Auth.css";
import { useTranslation } from "react-i18next";

export default function SignUp() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { display_name: form.name },
          emailRedirectTo: `${siteUrl}/login`,
        },
      });
      if (error) throw error;

      if (!data.session) {
        alert(t("auth.signup.checkEmail"));
        setLoading(false);
        navigate("/login");
        return;
      }

      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: form.name,
      });

      setLoading(false);
      navigate("/settings");
    } catch (err) {
      alert(err.message || t("auth.signup.error"));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">{t("auth.signup.title")}</div>
          <div className="auth-subtitle">{t("auth.signup.subtitle")}</div>
          <Link to="/" className="auth-link">{t("auth.common.maybeLater")}</Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="text"
            name="name"
            placeholder={t("auth.common.fullNamePlaceholder")}
            value={form.name}
            onChange={handleChange}
            required
          />
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
            {loading ? t("auth.signup.loading") : t("auth.signup.cta")}
          </button>
        </form>

        <div className="auth-footer">
          {t("auth.signup.haveAccount")}{" "}
          <Link to="/login" className="auth-link">{t("auth.login.link")}</Link>
        </div>
      </div>
    </div>
  );
}

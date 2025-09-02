import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../api/supabaseClient.js";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      setLoading(false);
      navigate(from);
    } catch (err) {
      alert(err.message || "Could not log you in.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!form.email) return alert("Enter your email first.");
    setSending(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) throw error;
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      alert(err.message || "Could not send reset email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">Log in to continue</div>
          <Link to="/" className="auth-link">NO Take me Back</Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="auth-row">
          <button
            onClick={handlePasswordReset}
            className="auth-link"
            disabled={sending}
          >
            {sending ? "Sending…" : "Forgot password?"}
          </button>
          <Link to="/signup" className="auth-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

// src/pages/Beta.jsx
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./beta.css";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export default function Beta() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  const source = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("utm_source") || params.get("source") || "beta-page";
  }, []);

  function isValidEmail(v) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError(t("beta.invalidEmail"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/beta/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, name: name.trim() || null, source }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Sign-up failed");
      }
      setOk(true);
      setEmail("");
      setName("");
    } catch (e) {
      setError(e.message || t("beta.genericError"));
    } finally {
      setSubmitting(false);
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

            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("beta.nameOpt")}</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">{t("beta.email")}</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

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
          <div className="bg-white rounded-xl shadow p-6 text-center space-y-3">
            <div className="text-2xl">🎉</div>
            <h2 className="text-xl font-semibold">{t("beta.inTitle")}</h2>
            <p className="text-gray-700">
              {t("beta.inDesc")}
            </p>
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

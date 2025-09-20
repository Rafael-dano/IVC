// src/pages/LTD.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./LTD.css";
import { startCheckout } from "../api/billing.js";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

const TIERS = [
  { key: "LTD_99",  label: "First 99 spots at $99" },
  { key: "LTD_149", label: "Next 149 spots at $149" },
  { key: "LTD_199", label: "Last 199 spots at $199" },
];

const SUPPORTED_LTD_CURRENCIES = [
    "USD",
    "EUR",
    "GBP",
   "CAD",
    "AUD",
    "INR",
    "JPY",
    "BRL",
    "MXN",
    "ZAR",
    "SGD",
    "HKD",
    "SEK",
    "CHF",
    "NZD",
  ];

export default function LTD() {
  const { t, i18n } = useTranslation();
  const [spots, setSpots] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const defaultCurrency = useMemo(() => {
        const parts = (i18n.language || "").split("-");
        const maybeCode = parts.pop()?.toUpperCase();
        return maybeCode && SUPPORTED_LTD_CURRENCIES.includes(maybeCode)
          ? maybeCode
          : "USD";
      }, [i18n.language]);
      const [currency, setCurrency] = useState(defaultCurrency);
      const [isProcessing, setProcessing] = useState(false);
      const [checkoutError, setCheckoutError] = useState("");
    
      useEffect(() => {
        setCurrency(defaultCurrency);
      }, [defaultCurrency]);

  async function loadSpots(signal) {
    try {
      setErr("");
      const res = await fetch(`${API_BASE}/api/ltd-spots`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSpots(json.spots || {});
    } catch (e) {
      if (e.name !== "AbortError") setErr(t("ltd.spotsError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadSpots(ac.signal);
    const id = setInterval(() => loadSpots(ac.signal), 30000);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);

  const onBuy = async (tierKey) => {
    setCheckoutError("");
    setProcessing(true);
    try {
      await startCheckout({
        tier: tierKey,
        mode: "payment",
        currency,
      });
    } catch (e) {
      setCheckoutError(e.message || t("ltd.checkoutFailed"));
      setProcessing(false);
    }
  };

  const onSubscribe = async () => {
    setCheckoutError("");
    setProcessing(true);
    try {
      await startCheckout({ tier: "PRO", mode: "subscription" });
    } catch (e) {
      setCheckoutError(e.message || t("ltd.checkoutFailed"));
      setProcessing(false);
    }
  };

  return (
    <div className="ltd-page">
      <Header />
      <main className="text-center p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">{t("ltd.title")}</h1>
          <p className="text-lg text-gray-700">
            {t("ltd.sub")}
          </p>
        </header>

        <section>
          <a href="/beta" className="ltd-button">{t("ltd.joinBeta")}</a>
        </section>

        <section className="flex flex-col items-center gap-2">
          <label
            htmlFor="ltd-currency"
            className="text-sm font-medium text-gray-700"
          >
            {t("ltd.currencyLabel", { defaultValue: "Currency" })}
          </label>
          <select
            id="ltd-currency"
            className="ltd-select"
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value);
              setCheckoutError("");
            }}
            disabled={isProcessing}
          >
            {SUPPORTED_LTD_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </section>

        {err && <p className="text-sm text-red-600">{t("ltd.errPrefix")} {err}</p>}
        {checkoutError && (
          <p className="text-sm text-red-600">{checkoutError}</p>
        )}

        <section className="ltd-pricing-grid">
          {TIERS.map((tTier) => {
            const remaining = spots[tTier.key];
            const soldOut = typeof remaining === "number" && remaining <= 0;

            return (
              <button
                key={tTier.key}
                className={`ltd-button ${soldOut ? "ltd-button--disabled" : ""}`}
                onClick={() => onBuy(tTier.key)}
                disabled={soldOut || loading || isProcessing}
                title={soldOut ? t("ltd.soldOut") : undefined}
              >
                <div className="ltd-button-title">{tTier.label}</div>
                <div className="ltd-button-sub">
                  {loading ? (
                    <span className="ltd-shimmer">{t("ltd.loadingSpots")}</span>
                  ) : typeof remaining === "number" ? (
                    soldOut ? t("ltd.soldOut") : t("ltd.spotsLeft", { count: remaining })
                  ) : (
                    " "
                  )}
                </div>
              </button>
            );
          })}
        </section>

        <section>
        <button
            className="ltd-button"
            onClick={onSubscribe}
            disabled={isProcessing}
          >
            {t("ltd.goPro")}
          </button>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">{t("ltd.videoTitle")}</h2>
          <div className="mb-6">
            <iframe
              className="w-full h-96 rounded-md"
              src="https://www.youtube.com/embed/VIDEO_ID"
              title="IVContent Quick Start"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

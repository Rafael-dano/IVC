// src/pages/LTD.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./LTD.css";
import { httpJson } from "../api/http.js";
import { useTranslation } from "react-i18next";
import { startLTDCheckout, startProCheckout } from "../api/checkout";
import { openAnnualCheckout } from "../api/account.js";

const TIERS = [
  { key: "LTD_99",  label: "First 99 spots at $99" },
  { key: "LTD_149", label: "Next 149 spots at $149" },
  { key: "LTD_400", label: "Lifetime access 50 spots at $400" },
  { key: "Annual", label: "$160 for Annual membership"}
];

export default function LTD() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadSpots(signal) {
    try {
      setErr("");
      const json = await httpJson("/api/ltd-spots", { signal });
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
    try {
      if (tierKey === "Annual") {
        await openAnnualCheckout();
        return;
      }
      await startLTDCheckout(tierKey); // "LTD_99" | "LTD_149" | "LTD_400"
    } catch (e) {
      alert(e.message || t("ltd.checkoutFailed"));
    }
  };

  const onSubscribe = async () => {
    try {
      await startProCheckout();
    } catch (e) {
      alert(e.message || t("ltd.checkoutFailed"));
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

        {err && <p className="text-sm text-red-600">{t("ltd.errPrefix")} {err}</p>}

        <section className="ltd-pricing-grid">
          {TIERS.map((tTier) => {
            const remaining = spots[tTier.key];
            const soldOut = typeof remaining === "number" && remaining <= 0;

            return (
              <button
                key={tTier.key}
                className={`ltd-button ${soldOut ? "ltd-button--disabled" : ""}`}
                onClick={() => onBuy(tTier.key)}
                disabled={soldOut || loading}
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
          <button className="ltd-button" onClick={onSubscribe}>
            {t("ltd.goPro")}
          </button>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">{t("ltd.videoTitle")}</h2>
          <div className="mb-6">
          <iframe
            loading="lazy"
            className="w-full h-96 rounded-md"
            src="https://www.youtube.com/embed/VIDEO_ID"  // change with real video 
            title="IVContent Quick Start"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

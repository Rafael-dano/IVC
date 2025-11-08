import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./LTD.css";
import { httpJson } from "../api/http.js";
import { useTranslation } from "react-i18next";
import { startLTDCheckout, startProCheckout } from "../api/checkout";
import { openAnnualCheckout, openAnnualPromo } from "../api/account.js";
import { trackSelectPromotion } from "../analytics/gtag";
import { sendEvent } from "../analytics/ga";

const TIERS = [
  {
    key: "ANNUAL_PROMO_99",
    spotKey: "ANNUAL_99",
    label: "First 99 spots at $99 per year, for life",
    analytics: {
      priceTier: "annual_promo_99",
      region: "global",
      offerType: "annual",
      amount: 99,
      value: 99,
      currency: "USD",
    },
    checkout: (tracking) => openAnnualPromo("annual_99", tracking),
  },
  {
    key: "ANNUAL_PROMO_149",
    spotKey: "ANNUAL_149",
    label: "Next 149 spots at $149 per year, for life",
    analytics: {
      priceTier: "annual_promo_149",
      region: "global",
      offerType: "annual",
      amount: 149,
      value: 149,
      currency: "USD",
    },
    checkout: (tracking) => openAnnualPromo("annual_149", tracking),
  },
  {
    key: "LTD_400",
    spotKey: "LTD_400",
    label: "Lifetime access 50 spots at $400",
    analytics: {
      priceTier: "ltd_400",
      region: "global",
      offerType: "ltd",
      amount: 400,
      value: 400,
      currency: "USD",
    },
    checkout: (tracking) => startLTDCheckout("LTD_400", tracking),
  },
  {
    key: "ANNUAL",
    label: "$160 for Annual membership",
    analytics: {
      priceTier: "annual_standard",
      region: "global",
      offerType: "annual",
      amount: 160,
      value: 160,
      currency: "USD",
    },
    checkout: (tracking) => openAnnualCheckout(undefined, tracking),
  },
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

  const onBuy = async (tier) => {
    try {
      if (typeof tier.checkout !== "function") {
        throw new Error("Checkout unavailable");
      }
      const analytics = tier.analytics || {};
      const priceTier = analytics.priceTier || tier.key.toLowerCase();
      const region = analytics.region || "unknown";
      const offerType =
        analytics.offerType || (tier.key.startsWith("LTD") ? "ltd" : "annual");
      sendEvent("ltd_click", {
        variant: tier.key,
        location: "ltd_page",
      });
      sendEvent("begin_checkout", {
        price_tier: priceTier,
        region,
        offer_type: offerType,
        ...(typeof analytics.amount === "number"
          ? { amount: analytics.amount, value: analytics.amount }
          : {}),
        ...(analytics.currency ? { currency: analytics.currency } : {}),
      });
      if (tier.key === "LTD_400") {
        trackSelectPromotion({
          promotion_name: "LTD $400 (50 spots)",
          creative_name: "LTD Landing Hero",
          location_id: "ltd_page",
        });
      }
      await tier.checkout(analytics);
    } catch (e) {
      alert(e.message || t("ltd.checkoutFailed"));
    }
  };

  const onSubscribe = async () => {
    const analytics = {
      priceTier: "pro_monthly",
      region: "global",
      offerType: "pro_monthly",
      amount: 15,
      value: 15,
      currency: "USD",
    };
    try {
      sendEvent("ltd_click", {
        variant: "pro_monthly",
        location: "ltd_page",
      });
      sendEvent("begin_checkout", {
        price_tier: analytics.priceTier,
        region: analytics.region || "unknown",
        offer_type: analytics.offerType,
        amount: analytics.amount,
        value: analytics.amount,
        currency: analytics.currency,
      });
      await startProCheckout(analytics);
    } catch (e) {
      alert(e.message || t("ltd.checkoutFailed"));
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content section-stack">
        <header className="page-intro page-intro--centered">
          <h1 className="page-title">{t("ltd.title")}</h1>
          <p className="page-subtitle page-subtitle--centered">{t("ltd.sub")}</p>
          <a href="/beta" className="button-primary ltd-hero-cta">{t("ltd.joinBeta")}</a>
        </header>

        {err && (
          <div className="status-pill status-error">{t("ltd.errPrefix")} {err}</div>
        )}

        <section className="ltd-grid">
          {TIERS.map((tier) => {
            const spotKey = tier.spotKey || tier.key;
            const remaining = spots[spotKey];
            const soldOut = typeof remaining === "number" && remaining <= 0;

            return (
              <button
                key={tier.key}
                className={`ltd-offer ${soldOut ? "is-disabled" : ""}`}
                onClick={() => onBuy(tier)}
                disabled={soldOut || loading}
                title={soldOut ? t("ltd.soldOut") : undefined}
              >
                <span className="ltd-offer__title">{tier.label}</span>
                <span className="ltd-offer__meta">
                  {loading
                    ? t("ltd.loadingSpots")
                    : typeof remaining === "number"
                      ? soldOut
                        ? t("ltd.soldOut")
                        : t("ltd.spotsLeft", { count: remaining })
                      : " "}
                </span>
              </button>
            );
          })}
        </section>

        <section>
          <button className="button-secondary ltd-hero-cta" onClick={onSubscribe}>
            {t("ltd.goPro")}
          </button>
        </section>

        <section className="surface-card">
          <h2 className="section-heading text-accent-indigo">{t("ltd.videoTitle")}</h2>
          <div className="video-frame">
          <iframe width="560" height="315" src="https://www.youtube.com/embed/xOdU0U_vLjA?si=4OXWYKrv8X9-dvvd" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./LTD.css";
import { startCheckout } from "../api/billing.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

const TIERS = [
  { key: "LTD_99",  label: "First 99 spots at $99" },
  { key: "LTD_149", label: "Next 149 spots at $149" },
  { key: "LTD_199", label: "Last 199 spots at $199" },
];

export default function LTD() {
  const [spots, setSpots] = useState({});        // { LTD_99: number, ... }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadSpots(signal) {
    try {
      setErr("");
      const res = await fetch(`${API_BASE}/api/ltd-spots`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSpots(json.spots || {});
    } catch (e) {
      if (e.name !== "AbortError") setErr("Spots not loading. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadSpots(ac.signal);

    // Optional: auto-refresh every 30s
    const id = setInterval(() => loadSpots(ac.signal), 30000);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);

  const onBuy = async (tierKey) => {
    try {
      await startCheckout({ price: tierKey, mode: "payment" });
    } catch (e) {
      alert(e.message || "Checkout failed");
    }
  };

  const onSubscribe = async () => {
    try {
      await startCheckout({ price: "PRO", mode: "subscription" });
    } catch (e) {
      alert(e.message || "Checkout failed");
    }
  };

  return (
    <div className="ltd-page">
      <Header />
      <main className="text-center p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">Lifetime Deal Access 🚀</h1>
          <p className="text-lg text-gray-700">
            Secure your spot before it's gone! Once a tier sells out, the next one unlocks.
          </p>
        </header>

        <section>
          <a href="/beta" className="ltd-button">Join Beta Till September 30th</a>
        </section>

        {err && (
          <p className="text-sm text-red-600">{err}</p>
        )}

        <section className="ltd-pricing-grid">
          {TIERS.map((t) => {
            const remaining = spots[t.key];
            const soldOut = typeof remaining === "number" && remaining <= 0;

            return (
              <button
                key={t.key}
                className={`ltd-button ${soldOut ? "ltd-button--disabled" : ""}`}
                onClick={() => onBuy(t.key)}
                disabled={soldOut || loading}
                title={soldOut ? "Sold out" : undefined}
              >
                <div className="ltd-button-title">{t.label}</div>

                <div className="ltd-button-sub">
                  {loading ? (
                    <span className="ltd-shimmer">Loading spots…</span>
                  ) : typeof remaining === "number" ? (
                    soldOut ? "Sold out" : `${remaining} spots left`
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
            Go Pro — $13 / month
          </button>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2">Video Walkthrough</h2>
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

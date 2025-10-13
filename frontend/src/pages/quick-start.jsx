// src/pages/quick-start.jsx
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useTranslation } from "react-i18next";

export default function QuickStart() {
  const { t } = useTranslation();

  const steps = [
    t("qs.step1"),
    t("qs.step2"),
    t("qs.step3"),
    t("qs.step4"),
    t("qs.step5"),
    t("qs.step6"),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content page-content--narrow section-stack">
        <header className="page-intro">
          <h1 className="page-title">{t("qs.title")}</h1>
          <p className="page-subtitle">{t("qs.sub")}</p>
        </header>

        <section className="surface-card">
          <h2 className="section-heading text-accent-indigo">{t("qs.videoTitle")}</h2>
          <div className="video-frame">
            <iframe
              loading="lazy"
              className="video-frame__media"
              src="https://www.youtube.com/embed/VIDEO_ID"
              title="IVContent Quick Start"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        {steps.length > 0 && (
          <section className="surface-card surface-card--subtle">
            <h2 className="section-heading text-accent-cyan">{t("qs.stepsTitle")}</h2>
            <ol className="qs-steps">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        <div>
          <a href="/help" className="link-cta">
            ← {t("help.backToHelp")}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

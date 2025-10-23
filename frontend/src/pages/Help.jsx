import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useTranslation } from "react-i18next";
import FeedbackBox from "../components/FeedbackBox.jsx";

export default function Help() {
  const { t } = useTranslation();

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content page-content--narrow section-stack">
        <header className="page-intro">
          <h1 className="page-title">{t("help.getStartedTitle")}</h1>
          <p className="page-subtitle">
            {t("help.getStartedDesc")} {t("help.quickStart")}.
            {" "}
            {t("help.faqDesc")} {t("help.faqLink")}.
          </p>
        </header>

        <section className="surface-card">
          <h2 className="section-heading text-accent-cyan">{t("help.quickStart")}</h2>
          <p className="muted-text">
            {t("help.getStartedDesc")} {" "}
            <a href="/quick-start" className="link-cta">{t("help.quickStart")}</a>.
          </p>
        </section>

        <section className="surface-card">
          <h2 className="section-heading text-accent-amber">{t("help.faqTitle")}</h2>
          <p className="muted-text">
            {t("help.faqDesc")} {" "}
            <a href="/faq" className="link-cta">{t("help.faqLink")}</a>.
          </p>
        </section>

        <section className="surface-card">
          <h2 className="section-heading text-accent-pink">{t("help.contactTitle")}</h2>
          <p className="muted-text">
            {t("help.contactDesc")} {" "}
            <a href="mailto:IVContent.com@gmail.com" className="link-cta">IVContent.com@gmail.com</a>.
          </p>
        </section>

        <section className="surface-card">
          <h2 className="section-heading text-accent-indigo">{t("help.settingsTitle")}</h2>
          <p className="muted-text">
            {t("help.settingsDesc")} {" "}
            <a href="/settings" className="link-cta">{t("help.settingsLink")}</a>.
          </p>
        </section>
     
        <FeedbackBox />
      </main>
      <Footer />
    </div>
  );
}

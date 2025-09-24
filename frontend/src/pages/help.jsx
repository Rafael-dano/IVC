// src/pages/Help.jsx
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useTranslation } from "react-i18next";
import FeedbackBox from "../components/FeedbackBox";

export default function Help() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-2">{t("help.getStartedTitle")}</h2>
          <p>
            {t("help.getStartedDesc")}{" "}
            <a href="/quick-start" className="text-cyan-300 hover:underline"><strong>{t("help.quickStart")}</strong></a>.
          </p>
        </section>

        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-orange-500 mb-2">{t("help.faqTitle")}</h2>
          <p>
            {t("help.faqDesc")}{" "}
            <a href="/faq" className="text-cyan-300 hover:underline"><strong>{t("help.faqLink")}</strong></a>.
          </p>
        </section>

        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-purple-400 mb-2">{t("help.contactTitle")}</h2>
          <p>
            {t("help.contactDesc")}{" "}
            <a href="mailto:IVContent.com@gmail.com" className="text-cyan-300 hover:underline"><strong>IVContent.com@gmail.com</strong></a>.
          </p>
        </section>

        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-orange-500 mb-2">{t("help.settingsTitle")}</h2>
          <p>
            {t("help.settingsDesc")}{" "}
            <a href="/settings" className="text-cyan-300 hover:underline"><strong>{t("help.settingsLink")}</strong></a>.
          </p>
        </section>
        <section><FeedbackBox /></section>
      </main>
      <Footer />
    </div>
  );
}

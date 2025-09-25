// src/pages/FAQ.jsx
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import "../styles/legacy.css";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <div className="page-faq">
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{t("faq.title")}</h1>
        <p className="mb-6 text-gray-700">{t("faq.sub")}</p>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">{t("faq.q1")}</h3>
            <p>{t("faq.a1")}</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">{t("faq.q2")}</h3>
            <p>{t("faq.a2")}</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">{t("faq.q3")}</h3>
            <p>{t("faq.a3")}</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">{t("faq.q4")}</h3>
            <p>{t("faq.a4")}</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">{t("faq.q5")}</h3>
            <p>{t("faq.a5")}</p>
          </div>
        </div>

        <a
          href="/help"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        ><strong>← {t("help.backToHelp")}</strong></a>
      </main>
      <Footer />
    </div>
  );
}

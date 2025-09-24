// src/pages/quick-start.jsx
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useTranslation } from "react-i18next";

export default function QuickStart() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{t("qs.title")}</h1>
        <p className="mb-6 text-gray-700">{t("qs.sub")}</p>

        <h2 className="text-2xl font-semibold mb-2">{t("qs.videoTitle")}</h2>
        <div className="mb-6">
        <iframe
          loading="lazy"
          className="w-full h-96 rounded-md"
          src="https://www.youtube.com/embed/VIDEO_ID" // change with real video 
          title="IVContent Quick Start"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        </div>

        <h2 className="text-2xl font-semibold mb-2">{t("qs.stepsTitle")}</h2>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li>{t("qs.step1")}</li>
          <li>{t("qs.step2")}</li>
          <li>{t("qs.step3")}</li>
          <li>{t("qs.step4")}</li>
          <li>{t("qs.step5")}</li>
          <li>{t("qs.step6")}</li>
        </ol>

        <a
          href="/help"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        ><strong>← {t("help.backToHelp")}</strong></a>
      </main>
      <Footer />
    </div>
  );
}

// src/pages/Landingpage.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {t("landing.heroTitle")}
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          {t("landing.heroSub")}
        </p>
        <Link
          to="/signup"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {t("landing.cta")}
        </Link>
      </section>

      <section className="bg-gray-800 py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-xl font-bold mb-3">{t("landing.f1Title")}</h3>
            <p className="text-gray-400">{t("landing.f1Sub")}</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">{t("landing.f2Title")}</h3>
            <p className="text-gray-400">{t("landing.f2Sub")}</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">{t("landing.f3Title")}</h3>
            <p className="text-gray-400">{t("landing.f3Sub")}</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">{t("landing.testimonialsTitle")}</h2>
        <p className="text-gray-400 italic mb-4">{t("landing.testimonialsSoon1")}</p>
        <p className="text-gray-400 italic">{t("landing.testimonialsSoon2")}</p>
      </section>

      <section className="bg-indigo-600 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">{t("landing.finalTitle")}</h2>
        <Link
          to="/signup"
          className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-100"
        >
          {t("landing.cta")}
        </Link>
      </section>

      <footer className="bg-gray-950 text-gray-400 text-center py-6">
        <p>© {new Date().getFullYear()} {t("landing.footer")}</p>
      </footer>
    </div>
  );
}


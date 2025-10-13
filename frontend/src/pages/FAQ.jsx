import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
  ];

  return (
    <div className="page-shell">
      <Header />
      <main className="page-content page-content--narrow section-stack">
        <header className="page-intro">
          <h1 className="page-title">{t("faq.title")}</h1>
          <p className="page-subtitle">{t("faq.sub")}</p>
        </header>

        <div className="section-stack">
          {faqs.map((item, idx) => (
            <article key={idx} className="surface-card surface-card--subtle faq-card">
              <h3 className="section-heading">{item.question}</h3>
              <p className="muted-text">{item.answer}</p>
            </article>
          ))}
        </div>

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
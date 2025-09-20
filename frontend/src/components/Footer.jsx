// src/components/Footer.jsx
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 text-sm text-center text-gray-500 py-8 border-t border-gray-800">
      <p>
        {t("footer.tagline.prefix")} IV
        <span className="text-cyan-400 font-semibold">Content</span>
        {t("footer.tagline.suffix")}
      </p>

      <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
        {/* HTML Terms page */}
        <a href="/terms" className="hover:underline">
          {t("footer.terms", "Terms of Service")}
        </a>
        <span aria-hidden>•</span>

        {/* PDF Terms */}
        <a
          href="/legal/terms-of-service.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {t("footer.termsPdf", "Terms (PDF)")}
        </a>
        <span aria-hidden>•</span>

        <a href="/privacy" className="hover:underline">
          {t("footer.privacyHtml", "Privacy Policy")}
        </a>

        <span aria-hidden>•</span>

        {/* PDF Privacy */}
        <a
          href="/legal/privacy-policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {t("footer.privacy", "Privacy Policy ")}
        </a>

        {/*
        <span aria-hidden>•</span>
        <a
          href="/legal/beta-program-terms.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {t("footer.betaTerms", "Beta Program Terms")}
        </a>
        */}
      </div>

      <p className="mt-2">
        © {year} {t("footer.copyright", "IVContent. All rights reserved.")}
      </p>
    </footer>
  );
};

export default Footer;


// src/components/Footer.jsx
import { useTranslation } from "react-i18next";
import "./Footer.css";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <p className="app-footer__tagline">
          {t("footer.tagline.prefix")} <span className="app-footer__logo">IVContent</span>
          {t("footer.tagline.suffix")}
        </p>

        <div className="app-footer__links">
          <a href="/terms">{t("footer.terms", "Terms of Service")}</a>
          <span aria-hidden>•</span>
          <a href="/legal/terms-of-service.pdf" target="_blank" rel="noopener noreferrer">
            {t("footer.termsPdf", "Terms (PDF)")}
          </a>
          <span aria-hidden>•</span>
          <a href="/privacy">{t("footer.privacyHtml", "Privacy Policy")}</a>
          <span aria-hidden>•</span>
          <a href="/legal/privacy-policy.pdf" target="_blank" rel="noopener noreferrer">
            {t("footer.privacy", "Privacy Policy ")}
          </a>
        </div>

        <p className="app-footer__copyright">
          © {year} {t("footer.copyright", "IVContent. All rights reserved.")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 text-sm text-center text-gray-500 py-8 border-t border-gray-800">
      <p>
        {t("footer.tagline.prefix")} IV
        <span className="text-cyan-400 font-semibold">Content</span>
        {t("footer.tagline.suffix")}
      </p>
      <p className="mt-2">© {new Date().getFullYear()} {t("footer.copyright")}</p>
    </footer>
  );
};

export default Footer;

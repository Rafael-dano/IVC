// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Load JSON resources
import en_common from "./locales/en/common.json";
import es_common from "./locales/es/common.json";
import hi_common from "./locales/hi/common.json";
import ar_common from "./locales/ar/common.json";
import zh_common from "./locales/zh/common.json";
import ko_common from "./locales/ko/common.json";
import pt_common from "./locales/pt/common.json";
import fr_common from "./locales/fr/common.json";
import de_common from "./locales/de/common.json";
import it_common from "./locales/it/common.json";
import nl_common from "./locales/nl/common.json";
import ja_common from "./locales/ja/common.json";

// Optional: add more namespaces later (e.g., "auth", "dashboard")
const resources = {
  en: { common: en_common },
  es: { common: es_common },
  hi: { common: hi_common },
  ar: { common: ar_common },
  zh: { common: zh_common },   
  ko: { common: ko_common },
  pt: { common: pt_common },
  fr: { common: fr_common },
  de: { common: de_common },
  it: { common: it_common },   
  nl: { common: nl_common },
  ja: { common: ja_common },
};

i18n
  .use(LanguageDetector) // detects from localStorage, navigator, etc.
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en","es","hi","ar","zh","ko","pt","fr","de","it","nl","ja"],
    nonExplicitSupportedLngs: true, // allows zh-CN -> zh, pt-BR -> pt
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "querystring", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });  

export default i18n;

const html = document.documentElement;
html.setAttribute("lang", i18n.language);
html.setAttribute("dir", i18n.dir(i18n.language));
i18n.on("languageChanged", (lng) => {
  html.setAttribute("lang", lng);
  html.setAttribute("dir", i18n.dir(lng));
})
// src/components/LanguageSwitcher.jsx
import { useState } from "react";
import i18n from "i18next";

const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  // add more here later (pt-BR, ja, etc.)
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(i18n.language || "en");

  function change(e) {
    const next = e.target.value;
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem("ui-lang", next);
  }

  return (
    <select
      value={lang}
      onChange={change}
      className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
      title="Language"
    >
      {LANGS.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}

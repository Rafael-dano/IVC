import i18n from "../i18n";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient.js";
import LANGS from "../i18nLangs"; 

export default function LanguageSwitcher() {
  const [code, setCode] = useState(i18n.language || "en");

  useEffect(() => {
    const onChange = (lng) => setCode(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, []);

  async function change(lng) {
    await i18n.changeLanguage(lng);
    document.documentElement.setAttribute("lang", lng);
    document.documentElement.setAttribute("dir", i18n.dir(lng));
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (user) {
        await supabase
          .from("profiles")
          .update({ preferred_language: lng, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch {}
  }

  const langs = Array.isArray(LANGS) && LANGS.length ? LANGS : [{ code: "en", label: "English" }];

  return (
    <select
      className="select-control language-select"
      value={code}
      onChange={(e) => change(e.target.value)}
      title="Language"
    >
      {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}

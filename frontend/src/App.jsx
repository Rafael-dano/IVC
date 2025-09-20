// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from "react";
import i18n from "./i18n";               // make sure this is imported
import { supabase } from "./api/supabaseClient.js"; // you already have this
import Dashboard from './pages/Dashboard.jsx';
import Beta from './pages/beta.jsx';
import LTD from './pages/LTD.jsx';
import Help from './pages/Help.jsx';
import FAQ from './pages/FAQ.jsx';
import QuickStart from "./pages/quick-start.jsx";
import LandingPage from "./pages/Landingpage.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Settings from "./pages/Settings.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx"
import "./i18n.js";

function App() {
  // preferred_language for logged-in users
  useEffect(() => {
    const applyHtmlAttrs = (lng) => {
      document.documentElement.setAttribute("lang", lng || "en");
      document.documentElement.setAttribute("dir", i18n.dir(lng || "en")); // rtl for ar
    };
    applyHtmlAttrs(i18n.language);

    // language change happening
    const onChange = (lng) => applyHtmlAttrs(lng);
    i18n.on("languageChanged", onChange);

    // on mount, if user logged in, load preferred_language and apply it
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .maybeSingle();

        const pref = profile?.preferred_language;
        if (pref && pref !== i18n.language) {
          await i18n.changeLanguage(pref);
          applyHtmlAttrs(pref);
        }
      } catch {}
    })();

    return () => i18n.off("languageChanged", onChange);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/beta" element={<Beta />} />
        <Route path="/ltd" element={<LTD />} />
        <Route path="/help" element={<Help />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/quick-start" element={<QuickStart />} />
        <Route path="/landingPage" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Router>
  );
}

export default App;

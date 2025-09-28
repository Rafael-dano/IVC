import { useEffect, useState } from "react";
import { grantAnalytics, getAnalyticsConsent, setAnalyticsConsent } from "../analytics/consent";
import { supabase } from "../api/supabaseClient";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const v = getAnalyticsConsent();
    if (v !== "granted" && v !== "denied") setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%]
                 rounded-xl shadow-lg bg-gray-900 text-white p-4 md:p-5"
    >
      <div className="text-sm leading-5">
        We use cookies/analytics (PostHog) to improve IVContent. Accept to enable analytics. You can change this later in Settings.
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
          onClick={() => { setAnalyticsConsent("denied"); setShow(false); }}
        >
          Decline
        </button>
        <button
          className="px-3 py-2 rounded-md bg-cyan-400 text-black hover:bg-cyan-300 font-semibold text-sm"
          onClick={() => { grantAnalytics(supabase); setShow(false); }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

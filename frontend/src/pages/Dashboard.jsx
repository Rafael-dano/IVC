// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import RepurposeTool from '../components/RepurposeTool.jsx';
import { fetchMe } from '../api/account.js';
import { isPaid } from '../utils/plan.js';
import { useTranslation } from "react-i18next";
import "./Dashboard.css";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [account, setAccount] = useState(null); // { user, usage }
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchMe().catch(() => null);
        if (mounted) setAccount(me);
      } catch {/* ignore */}
    })();
    return () => { mounted = false; };
  }, []);

  const plan = String(account?.user?.plan || "FREE").toUpperCase();
  const isPaidPlan = isPaid(plan);
  const displayName = account?.user?.display_name?.trim();
  const titleText = isPaidPlan && displayName ? displayName : t("dashboard.title");

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} font-sans`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="dashboard-header">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {titleText}
          </h2>
          <UsageBubble account={account} />
        </div>

        <RepurposeTool />
      </main>

      <Footer />
    </div>
  );
}

function UsageBubble({ account }) {
  if (!account?.user?.plan) return null;

  const plan = String(account.user.plan || "FREE").toUpperCase();
  const tokensLimit = account?.usage?.month_tokens_limit ?? 0;
  const tokensUsed  = account?.usage?.month_tokens_used ?? 0;
  const tokensLeft  = Math.max(0, tokensLimit - tokensUsed);
  const tokensPct   = tokensLimit ? Math.min(100, Math.round((tokensUsed / tokensLimit) * 100)) : 0;

  const minsLimit = account?.usage?.transcription_minutes_limit ?? 0;
  const minsUsed  = account?.usage?.transcription_minutes_used ?? 0;
  const minsLeft  = Math.max(0, minsLimit - minsUsed);
  const minsPct   = minsLimit ? Math.min(100, Math.round((minsUsed / minsLimit) * 100)) : 0;

  const isPaidPlan = isPaid(plan);
  const hasAnyLimit = (tokensLimit > 0) || (minsLimit > 0);

  // FREE (or zero limits): show upgrade nudge
  if (!isPaidPlan || !hasAnyLimit) {
    return (
      <div className="ml-auto shrink-0 rounded-2xl px-4 py-3 bg-white/10 backdrop-blur border border-white/15 shadow-sm">
        <div className="text-xs uppercase tracking-wide opacity-75 mb-1">{plan}</div>
        <div className="text-sm font-medium mb-2">Unlock transcription & higher token limits</div>
        <div className="flex gap-2">
          <a
            href="/LTD"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-cyan-400 text-black text-sm font-semibold hover:bg-cyan-300 transition"
          >
            Upgrade
          </a>
          <a
            href="/settings"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 border border-white/15 transition"
          >
            View Plan
          </a>
        </div>
      </div>
    );
  }

  // Paid bubble with bars
  const Bar = ({ pct }) => (
    <div className="h-1.5 w-full rounded bg-white/15 overflow-hidden">
      <div
        className={`h-1.5 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  return (
    <div className="ml-auto shrink-0 rounded-2xl px-4 py-3 bg-white/10 backdrop-blur border border-white/15 shadow-sm">
      <div className="text-xs uppercase tracking-wide opacity-75 mb-2">{plan}</div>
      <div className="grid grid-cols-2 gap-3 min-w-[320px]">
        <div>
          <div className="text-xs opacity-80 mb-1">Transcription</div>
          <div className="text-[11px] opacity-70 mb-1">{minsUsed} / {minsLimit} mins used</div>
          <Bar pct={minsPct} />
        </div>
        <div>
          <div className="text-xs opacity-80 mb-1">Tokens</div>
          <div className="text-[11px] opacity-70 mb-1">
            {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} used
          </div>
          <Bar pct={tokensPct} />
        </div>
      </div>
    </div>
  );
}

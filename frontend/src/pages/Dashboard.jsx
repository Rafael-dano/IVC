import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import RepurposeTool from "../components/RepurposeTool.jsx";
import { fetchMe } from "../api/account.js";
import { isPaid } from "../utils/plan.js";
import { useTranslation } from "react-i18next";
import "./Dashboard.css";

export default function Dashboard() {
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
    <div className="page-shell dashboard-page">
      <Header />

      <main className="page-content">
        <div className="dashboard-header">
          <h2 className="dashboard-title">
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

  const { t } = useTranslation();

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
      <div className="usage-bubble usage-bubble--free">
        <div className="usage-bubble__plan">{plan}</div>
        <div className="usage-bubble__nudge">{t("dashboard.upgradeNudge") || "Unlock transcription & higher token limits"}</div>
        <div className="usage-bubble__cta">
          <a href="/LTD" className="usage-bubble__btn usage-bubble__btn--primary">
            Upgrade
          </a>
          <a href="/settings" className="usage-bubble__btn usage-bubble__btn--ghost">
            View Plan
          </a>
        </div>
      </div>
    );
  }

  // Paid bubble with bars
  const Bar = ({ pct }) => (
    <div className="usage-bubble__bar">
      <span
        className={`usage-bubble__bar-fill ${pct > 90 ? 'is-critical' : pct > 70 ? 'is-warning' : 'is-ok'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  return (
    <div className="usage-bubble">
      <div className="usage-bubble__plan">{plan}</div>
      <div className="usage-bubble__row">
        <div>
        <div className="usage-bubble__section-title">Transcription</div>
        <div className="usage-bubble__meta">{minsUsed} / {minsLimit} mins used</div>
          <Bar pct={minsPct} />
        </div>
        <div>
          <div className="usage-bubble__section-title">Tokens</div>
          <div className="usage-bubble__meta">
            {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} used
          </div>
          <Bar pct={tokensPct} />
        </div>
      </div>
    </div>
  );
}
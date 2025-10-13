import Navbar from "./Navbar";
import { useAccount } from "../hooks/useAccount.js";
import { openBillingPortal } from "../api/account.js";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { isPaid } from "../utils/plan.js";
import "./Headers.css";

export default function Header() {
  const { t } = useTranslation();
  const { loading, account } = useAccount();
  const planKey = (account?.user?.plan || "FREE").toUpperCase();
  const isPaidPlan = isPaid(planKey);

  const handleBillingClick = () =>
    openBillingPortal().catch((err) => alert(err.message));

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a href="/" className="app-header__brand" aria-label="IVContent home">
          <span className="app-header__mark">IV</span>
          <span className="app-header__name">Content</span>
        </a>

        <div className="app-header__actions">
          {!loading && account && (
            <div className="app-header__account">
              <span className="badge-pill app-header__plan">{planKey}</span>
              {isPaidPlan && (
                <button
                  type="button"
                  className="button-ghost button-ghost--compact"
                  onClick={handleBillingClick}
                  title={t("header.manageBilling")}
                >
                  {t("header.manageBilling")}
                </button>
              )}
            </div>
          )}
          
          <LanguageSwitcher />
          <Navbar />
        </div>
      </div>
    </header>
  );
}

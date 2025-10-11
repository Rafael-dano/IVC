import './Navbar.css';
import { NavLink } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  return (
    <nav className="navbar bg-gray-900/95 text-white px-6 py-3 flex gap-3 justify-center shadow-md">
      <NavLink to="/app" className="pill primary">{t("nav.tool")}</NavLink>
      <NavLink to="/ltd" className="pill primary">{t("nav.ltd")}</NavLink>
      <NavLink to="/help" className="pill primary">{t("nav.help")}</NavLink>
      <NavLink to="/login" className="pill base">{t("nav.login")}</NavLink>
      <NavLink to="/signup" className="pill primary">{t("nav.signup")}</NavLink>
    </nav>
  );
}

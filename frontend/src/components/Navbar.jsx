import "./Navbar.css";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const links = [
  { to: "/app", key: "tool", variant: "primary" },
  { to: "/ltd", key: "ltd", variant: "outline" },
  { to: "/help", key: "help", variant: "ghost" },
  { to: "/login", key: "login", variant: "ghost" },
  { to: "/signup", key: "signup", variant: "primary" },
];

export default function Navbar() {
  const { t } = useTranslation();
  
  return (
    <nav className="app-nav">
      {links.map(({ to, key, variant }) => (
        <NavLink
          key={key}
          to={to}
          className={({ isActive }) =>
            [
              "app-nav__pill",
              `app-nav__pill--${variant}`,
              isActive ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
        >
          {t(`nav.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
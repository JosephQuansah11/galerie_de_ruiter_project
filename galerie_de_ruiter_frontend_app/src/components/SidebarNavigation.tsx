import { Film, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function SidebarNavigation() {
  const { t } = useTranslation();
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark"><Film size={18} /></span><span>Fable<span className="brand-dot">.</span></span></div>
    <div className="workspace-label">{t("workspace")}</div>
    <nav>
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}><LayoutDashboard size={18} />{t("overview")}</NavLink>
      <NavLink to="/library" className={({ isActive }) => isActive ? "active" : ""}><Film size={18} />{t("movieLibrary")}</NavLink>
    </nav>
    <div className="sidebar-bottom"><div className="status"><span className="status-dot" />{t("apiConnected")}</div></div>
  </aside>;
}

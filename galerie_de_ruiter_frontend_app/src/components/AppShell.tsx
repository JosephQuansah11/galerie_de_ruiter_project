import {
  Film,
  LayoutDashboard,
  LogIn,
  LogOut,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, DropdownPanel } from "./UI";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { t } = useTranslation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Film size={18} />
          </span>
          <span>
            Fable<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="workspace-label">{t("workspace")}</div>
        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <LayoutDashboard size={18} />
            {t("overview")}
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Film size={18} />
            {t("movieLibrary")}
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <UserRound size={18} />
            {t("myProfile")}
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/preferences"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <SlidersHorizontal size={18} />
            {t("preferences")}
          </NavLink>
          <div className="status">
            <span className="status-dot" />
            {t("apiConnected")}
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            Fable<span className="brand-dot">.</span>
          </div>
          <div className="topbar-actions">
            {auth.authenticated ? (
              <DropdownPanel
                label={
                  <>
                    <Avatar name={auth.profile?.username} size="small" />
                    {auth.profile?.username ?? t("member")}
                  </>
                }
              >
                <button className="menu-action" onClick={auth.logout}>
                  <LogOut size={15} />
                  {t("signOut")}
                </button>
              </DropdownPanel>
            ) : (
              <>
                <button className="quiet-button" onClick={auth.login}>
                  <LogIn size={16} />
                  {t("signIn")}
                </button>
                <NavLink className="primary-button" to="/register">
                  {t("createAccountButton")}
                </NavLink>
              </>
            )}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

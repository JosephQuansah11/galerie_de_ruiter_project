import { Button } from "@/components/ReactButton";
import { LogIn, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Avatar } from "./Avatar";
import { DropdownPanel } from "./DropdownPanel";

export function AppTopbar() {
  const auth = useAuth();
  const { t } = useTranslation();
  return <header className="topbar">
    <div className="mobile-brand">Fable<span className="brand-dot">.</span></div>
    <div className="topbar-actions">{auth.authenticated ? <DropdownPanel label={<><Avatar name={auth.profile?.username} imageUrl={auth.avatarUrl} size="small" />{auth.profile?.username ?? t("member")}</>}>
      <Button className="menu-action" onClick={auth.logout} text={<><LogOut size={15} />{t("signOut")}</>} />
    </DropdownPanel> : <>
      <Button className="quiet-button" onClick={auth.login} text={<><LogIn size={16} />{t("signIn")}</>} />
      <NavLink className="primary-button" to="/register">{t("createAccountButton")}</NavLink>
    </>}</div>
  </header>;
}

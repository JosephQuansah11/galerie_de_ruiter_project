import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RegistrationForm } from "./RegistrationForm";

export function AuthPage() {
  const { t } = useTranslation();
  return <div className="page auth-page">
    <div className="auth-panel"><RegistrationForm /></div>
    <div className="auth-aside"><UserPlus size={28} /><strong>{t("oneIdentity")}</strong><span>{t("oneIdentityText")}</span></div>
  </div>;
}

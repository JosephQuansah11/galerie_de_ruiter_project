import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/usePageMeta";
import { RegistrationForm } from "./RegistrationForm";

export function AuthPage() {
  const { t } = useTranslation();
  // Registration is a step, not a destination: keep it out of the search results.
  usePageMeta({ title: t("metaRegisterTitle"), canonicalPath: "/register", noindex: true });
  return <div className="page auth-page">
    <div className="auth-panel"><RegistrationForm /></div>
    <div className="auth-aside"><UserPlus size={28} /><strong>{t("oneIdentity")}</strong><span>{t("oneIdentityText")}</span></div>
  </div>;
}

import { Button } from "@/components/ReactButton";
import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { DynamicForm } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";
import type { FormField, UserProfile } from "../../types/types";
import { useTranslation } from "react-i18next";

type Registration = UserProfile & { password: string };
export function AuthPage() {
  const auth = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const fields: FormField<Registration>[] = [
    { name: "username", label: t("username"), required: true },
    { name: "email", label: t("email"), type: "email", required: true },
    { name: "firstName", label: t("firstName"), required: true },
    { name: "lastName", label: t("lastName"), required: true },
    {
      name: "password",
      label: t("password"),
      type: "password",
      required: true,
      placeholder: t("passwordPlaceholder"),
    },
  ];
  const submit = async (registration: Registration) => {
    try {
      await auth.register(registration);
    } catch {
      setError("registrationError");
    }
  };
  return (
    <div className="page auth-page">
      <div className="auth-panel">
        <div className="eyebrow">{t("accountSetup")}</div>
        <h1>{t("createFableAccount")}</h1>
        <p>{t("registerIntro")}</p>
        {error && <div className="notice">{t(error)}</div>}
        <DynamicForm
          fields={fields}
          initialValue={{
            username: "",
            email: "",
            firstName: "",
            lastName: "",
            password: "",
          }}
          submitLabel={t("createAccountButton")}
          onSubmit={submit}
        />
        <Button as="button" className="quiet-button auth-login" onClick={auth.login}>
          <LogIn size={16} />
          {t("alreadyHaveAccount")}
        </Button>
      </div>
      <div className="auth-aside">
        <UserPlus size={28} />
        <strong>{t("oneIdentity")}</strong>
        <span>{t("oneIdentityText")}</span>
      </div>
    </div>
  );
}

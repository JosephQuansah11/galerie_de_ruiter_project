import { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ReactButton";
import { DynamicForm } from "@/components/DynamicForm";
import { useAuth } from "@/context/AuthContext";
import type { FormField, Registration } from "@/types/types";
import { registrationErrorKey } from "./registrationErrorKey";

type Notice = { tone: "error" | "sent"; text: string };

/**
 * Creating an account with an address the visitor can actually open.
 *
 * The form used to take a username and let the auth client invent `@galerie-de-ruiter.be` for it.
 * That works for signing in as the gallery's own `de-ruiter`, whose account was made that way, but
 * it is the wrong default for everyone else: a password reset sent to a mailbox that does not exist
 * cannot be received, let alone answered. The address here is sent to Supabase untouched; the
 * display name is what the account menu and the profile show.
 */
export function RegistrationForm() {
  const auth = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice>();
  const [busy, setBusy] = useState(false);
  const fields: FormField<Registration>[] = [
    { name: "displayName", label: t("displayName"), required: true, autoComplete: "name" },
    { name: "email", label: t("email"), type: "email", required: true, autoComplete: "email" },
    {
      name: "password", label: t("password"), type: "password", required: true,
      autoComplete: "new-password", placeholder: t("passwordPlaceholder"),
    },
  ];
  const submit = async (registration: Registration) => {
    // A second click while the first sign-up is in flight would ask Supabase to send a second
    // confirmation mail, and its rate limit is easy to reach that way.
    if (busy) return;
    setBusy(true);
    setNotice(undefined);
    try {
      // A project that signs the visitor in straight away lands them in the gallery; one that
      // confirms addresses by mail leaves them here, with the address to look for.
      if (await auth.register(registration)) {
        navigate("/", { replace: true });
        return;
      }
      setNotice({ tone: "sent", text: t("registrationCheckInbox", { email: registration.email.trim() }) });
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "";
      const key = registrationErrorKey(code);
      setNotice({
        tone: "error",
        // The code is printed only when it has no sentence of its own: it is what a support
        // question can quote, and it keeps an unfamiliar refusal from looking like a wrong password.
        text: key === "registrationError" && code ? `${t(key)} (${code})` : t(key),
      });
    } finally {
      setBusy(false);
    }
  };
  return <>
    <div className="eyebrow">{t("accountSetup")}</div><h1>{t("createFableAccount")}</h1><p>{t("registerIntro")}</p>
    {notice && <p className={notice.tone === "error" ? "auth-error" : "auth-notice"}
      role={notice.tone === "error" ? "alert" : "status"}>{notice.text}</p>}
    <DynamicForm fields={fields} initialValue={{ email: "", password: "", displayName: "" }}
      submitLabel={t("createAccountButton")} onSubmit={submit} />
    <Button className="quiet-button auth-login" onClick={() => auth.login()} text={<><LogIn size={16} />{t("alreadyHaveAccount")}</>} />
  </>;
}

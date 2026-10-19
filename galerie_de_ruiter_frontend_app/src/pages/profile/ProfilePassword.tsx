import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DynamicForm } from "@/components/DynamicForm";
import { useAuth } from "@/context/AuthContext";
import type { FormField } from "@/types/types";
import { passwordErrorKey } from "./passwordErrorKey";

type PasswordChange = { currentPassword: string; newPassword: string; confirmPassword: string };
type Message = { tone: "ok" | "error"; text: string };

/** What the placeholder promises, and what the form checks before spending a request. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Changing the password of the signed-in account.
 *
 * The current password is not decoration: `changePassword` proves it against Supabase before the
 * new one is written, so a browser someone left unlocked cannot be used to lock its owner out. What
 * the form can check itself - a mistyped confirmation, a short password, the same password again -
 * is checked here, because a round trip to a rate-limited endpoint is worth avoiding.
 */
export function ProfilePassword() {
  const auth = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<Message>();
  const fields: FormField<PasswordChange>[] = [
    { name: "currentPassword", label: t("currentPassword"), type: "password", required: true, autoComplete: "current-password" },
    { name: "newPassword", label: t("newPassword"), type: "password", required: true, autoComplete: "new-password", placeholder: t("passwordPlaceholder") },
    { name: "confirmPassword", label: t("confirmPassword"), type: "password", required: true, autoComplete: "new-password" },
  ];
  const submit = async ({ currentPassword, newPassword, confirmPassword }: PasswordChange) => {
    if (busy) return;
    setMessage(undefined);
    if (newPassword !== confirmPassword) {
      setMessage({ tone: "error", text: t("passwordMismatch") });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage({ tone: "error", text: t("passwordTooWeak") });
      return;
    }
    if (newPassword === currentPassword) {
      setMessage({ tone: "error", text: t("passwordUnchanged") });
      return;
    }
    setBusy(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      // A successful change should not leave the old and new passwords sitting in the inputs.
      setFormKey((key) => key + 1);
      setMessage({ tone: "ok", text: t("passwordChangeSucceeded") });
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "";
      const key = passwordErrorKey(code);
      setMessage({
        tone: "error",
        // The code is printed only when it has no sentence of its own; it is what support can quote.
        text: key === "passwordChangeFailed" && code ? `${t(key)} (${code})` : t(key),
      });
    } finally {
      setBusy(false);
    }
  };
  return <>
    <DynamicForm key={formKey} fields={fields}
      initialValue={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
      submitLabel={t("changePasswordButton")} onSubmit={submit} />
    {message && <p role={message.tone === "ok" ? "status" : "alert"}>{message.text}</p>}
  </>;
}
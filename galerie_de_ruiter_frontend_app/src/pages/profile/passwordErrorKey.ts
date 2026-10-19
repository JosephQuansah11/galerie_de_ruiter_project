/**
 * The form's message key for why Supabase refused a password change.
 *
 * Supabase answers with a machine code ("invalid_credentials", "weak_password"); the form shows the
 * sentence that tells the visitor what to do about it. An unfamiliar code falls back to the generic
 * message, and the form prints the code beside it so a support question can name it.
 */
const MESSAGES: Record<string, string> = {
  invalid_credentials: "passwordCurrentWrong",
  weak_password: "passwordTooWeak",
  same_password: "passwordUnchanged",
  over_request_rate_limit: "passwordRateLimited",
};

export const passwordErrorKey = (code: string): string => MESSAGES[code] ?? "passwordChangeFailed";

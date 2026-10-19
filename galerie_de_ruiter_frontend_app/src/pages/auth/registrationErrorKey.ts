/**
 * The form's message key for why Supabase refused a sign-up.
 *
 * Supabase answers with a machine code ("email_address_invalid", "user_already_exists"); the form
 * shows the sentence that tells the visitor what to do about it. An unfamiliar code falls back to
 * the generic message, and the form prints the code beside it so a support question can name it.
 */
const MESSAGES: Record<string, string> = {
  email_address_invalid: "registrationInvalidEmail",
  gallery_email_not_accepted: "registrationGalleryEmail",
  user_already_exists: "registrationEmailTaken",
  email_exists: "registrationEmailTaken",
  weak_password: "registrationWeakPassword",
  signup_disabled: "registrationDisabled",
  over_email_send_rate_limit: "registrationRateLimited",
  over_request_rate_limit: "registrationRateLimited",
  display_name_required: "registrationDisplayNameRequired",
};

export const registrationErrorKey = (code: string): string => MESSAGES[code] ?? "registrationError";

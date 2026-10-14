import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n, { ensureLanguage } from "@/i18n";
import { languages } from "./languageOptions";
import { LanguageContext } from "./languageContextCore";
export { useLanguage } from "./languageContextCore";
export { languages } from "./languageOptions";
export { LanguageSwitcher } from "./LanguageSwitcher";
type LanguageCode = (typeof languages)[number]["code"];

/**
 * Belgian Dutch is the gallery's home language, so a first-time visitor lands on
 * `Nederlands (België)` instead of English. A stored choice always wins.
 */
export const DEFAULT_LANGUAGE: LanguageCode = "nl-BE";

/** Returns the visitor's saved language, or the Belgian Dutch default. */
function readStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem("galerie-language");
  return languages.some((item) => item.code === stored)
    ? (stored as LanguageCode)
    : DEFAULT_LANGUAGE;
}

export function LanguageProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);
  const selected =
    languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    localStorage.setItem("galerie-language", language);
    document.documentElement.lang = selected.locale;
    // A language that is not in the main bundle has to arrive before the switch, otherwise the
    // page would briefly read in the fallback language.
    void ensureLanguage(language).finally(() => void i18n.changeLanguage(language));
  }, [language, selected.locale]);

  const setLanguage = (nextLanguage: LanguageCode) =>
    setLanguageState(nextLanguage);
  const value = useMemo(
    () => ({
      language,
      locale: selected.locale,
      setLanguage,
      t: (key: string, options?: Record<string, unknown>) =>
        i18n.t(key, options),
    }),
    [language, selected.locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

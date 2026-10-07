import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n from "@/i18n";
import { languages } from "./languageOptions";
import { LanguageContext } from "./languageContextCore";
export { useLanguage } from "./languageContextCore";
export { languages } from "./languageOptions";
export { LanguageSwitcher } from "./LanguageSwitcher";
type LanguageCode = (typeof languages)[number]["code"];

export function LanguageProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [language, setLanguageState] = useState<LanguageCode>(
    () => (localStorage.getItem("galerie-language") as LanguageCode) || "en",
  );
  const selected =
    languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    localStorage.setItem("galerie-language", language);
    document.documentElement.lang = selected.locale;
    void i18n.changeLanguage(language);
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

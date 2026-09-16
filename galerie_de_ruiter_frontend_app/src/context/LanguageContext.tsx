import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import i18n from "@/i18n";

export const languages = [
  { code: "en", label: "English", locale: "en-BE" },
  { code: "fr", label: "French", locale: "fr-BE" },
  { code: "nl-NL", label: "Netherlands Dutch", locale: "nl-NL" },
  { code: "de", label: "German", locale: "de-DE" },
  { code: "nl-BE", label: "Belgian Dutch", locale: "nl-BE" },
] as const;

type LanguageCode = typeof languages[number]["code"];
type LanguageContextValue = {
  language: LanguageCode;
  locale: string;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [language, setLanguageState] = useState<LanguageCode>(() => (localStorage.getItem("galerie-language") as LanguageCode) || "en");
  const selected = languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    localStorage.setItem("galerie-language", language);
    document.documentElement.lang = selected.locale;
    void i18n.changeLanguage(language);
  }, [language, selected.locale]);

  const setLanguage = (nextLanguage: LanguageCode) => setLanguageState(nextLanguage);
  const value = useMemo(() => ({
    language,
    locale: selected.locale,
    setLanguage,
    t: (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
  }), [language, selected.locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

// const languages = [
//   { code: "en", label: "English" },
//   { code: "fr", label: "French" },
//   { code: "nl-NL", label: "Netherlands Dutch" },
//   { code: "de", label: "German" },
//   { code: "nl-BE", label: "Belgian Dutch" },
// ] as const;

export const languages = [
  { code: "en", label: "English", locale: "en-BE" },
  { code: "fr", label: "Français", locale: "fr-BE" },
  { code: "nl-NL", label: "Nederlands (Nederland)", locale: "nl-NL" },
  { code: "de", label: "Deutsch", locale: "de-DE" },
  { code: "nl-BE", label: "Nederlands (België)", locale: "nl-BE" },
] as const;

type LanguageCode = (typeof languages)[number]["code"];
type LanguageContextValue = {
  language: LanguageCode;
  locale: string;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

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

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, locale, setLanguage } = useLanguage();

  const changeLanguage = (code: string) => {
    const selected = languages.find((item) => item.code === code);
    if (!selected) return;
    setLanguage(selected.code);
    void i18n.changeLanguage(selected.code);
    document.documentElement.lang = selected.locale;
  };

  return (
    <select
      value={language}
      onChange={(e) => changeLanguage(e.target.value)}
      aria-label={i18n.t("language")}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

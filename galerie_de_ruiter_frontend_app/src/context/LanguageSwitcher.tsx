import { useTranslation } from "react-i18next";
import { languages, useLanguage } from "./LanguageContext";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();
  // The provider loads the language (it may still be a chunk that has to arrive) and applies it.
  const changeLanguage = (code: string) => {
    const selected = languages.find((item) => item.code === code);
    if (selected) setLanguage(selected.code);
  };
  return <select value={language} onChange={(event) => changeLanguage(event.target.value)}
    aria-label={i18n.t("language")}>
    {languages.map((lang) => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
  </select>;
}

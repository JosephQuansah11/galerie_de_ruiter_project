import { createContext, useContext } from "react";
import type { languages } from "./languageOptions";

type LanguageCode = (typeof languages)[number]["code"];
type LanguageContextValue = {
  language: LanguageCode; locale: string; setLanguage: (language: LanguageCode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};
export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

import i18n, { ensureLanguage } from "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startAnalytics } from "./services/clarity";
import "@/styles/App.scss";

/**
 * The gallery's own language (Belgian Dutch) and English, its fallback, ship with the app. A
 * visitor who saved one of the other languages waits for that language's chunk instead of
 * seeing the fallback language for a moment.
 */
const storedLanguage = localStorage.getItem("galerie-language") ?? "nl-BE";

// A returning visitor who already allowed analytics gets the tag at page start; a first visit
// waits for the banner (see AnalyticsConsent).
startAnalytics();

void ensureLanguage(storedLanguage)
  .then(() => i18n.changeLanguage(storedLanguage))
  .finally(() => createRoot(document.getElementById("root")!).render(<App />));

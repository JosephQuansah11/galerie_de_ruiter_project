import i18n, { ensureLanguage } from "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@/styles/App.scss";
import "@/styles/index.css";

/**
 * The gallery's own language (Belgian Dutch) and English, its fallback, ship with the app. A
 * visitor who saved one of the other languages waits for that language's chunk instead of
 * seeing the fallback language for a moment.
 */
const storedLanguage = localStorage.getItem("galerie-language") ?? "nl-BE";

// The font stylesheet sits in index.html with media="print" so it never blocks the first paint.
// Flipping it here applies it, without the inline handler a Content-Security-Policy would block.
document.getElementById("gallery-fonts")?.setAttribute("media", "all");

void ensureLanguage(storedLanguage)
  .then(() => i18n.changeLanguage(storedLanguage))
  .finally(() => createRoot(document.getElementById("root")!).render(<App />));

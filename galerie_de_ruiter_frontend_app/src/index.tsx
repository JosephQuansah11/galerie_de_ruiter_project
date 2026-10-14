// Must run before any <Canvas> mounts: it filters the three.js console output that
// @react-three/fiber triggers on its own. See the file header for the removal condition.
import "@/services/suppressThreeClockWarning";
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

void ensureLanguage(storedLanguage)
  .then(() => i18n.changeLanguage(storedLanguage))
  .finally(() => createRoot(document.getElementById("root")!).render(<App />));

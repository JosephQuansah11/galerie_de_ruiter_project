// Must run before any <Canvas> mounts: it filters the three.js console output that
// @react-three/fiber triggers on its own. See the file header for the removal condition.
import "@/services/suppressThreeClockWarning";
import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@/styles/App.scss";
import "@/styles/index.css";


createRoot(document.getElementById("root")!).render( <App /> );
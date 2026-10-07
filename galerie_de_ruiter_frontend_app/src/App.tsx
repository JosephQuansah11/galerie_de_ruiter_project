import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppContent } from "./AppContent";
import "@/styles/App.scss";

export default function App() {
  return <ThemeProvider><LanguageProvider><AuthProvider><BrowserRouter><AppContent /></BrowserRouter></AuthProvider></LanguageProvider></ThemeProvider>;
}

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppContent } from "./AppContent";
import "@/styles/App.scss";

export default function App() {
  // The router wraps the auth provider, not the other way round: the provider's sign-in redirect is
  // a route change now, and a hook that reaches the router cannot be used above it.
  return <ThemeProvider><LanguageProvider><BrowserRouter><AuthProvider><AppContent /></AuthProvider></BrowserRouter></LanguageProvider></ThemeProvider>;
}

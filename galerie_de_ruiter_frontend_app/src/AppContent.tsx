import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/auth/LoginPage";
import { AuthPage } from "./pages/auth/AuthPage";
import AboutPage from "./pages/AboutPage";
import { ProtectedLayout } from "./ProtectedLayout";
import ChatPage from "./pages/ChatPage";

export function AppContent() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<AuthPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/*" element={<ProtectedLayout />} />
  </Routes>;
}

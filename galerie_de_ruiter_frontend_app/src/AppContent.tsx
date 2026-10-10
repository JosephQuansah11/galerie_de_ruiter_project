import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/auth/LoginPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { ProtectedLayout } from "./ProtectedLayout";
import ChatPage from "./pages/ChatPage";

/**
 * `/about` lives inside the shell with the other signed-in pages, so it is not listed here.
 */
export function AppContent() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<AuthPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/*" element={<ProtectedLayout />} />
  </Routes>;
}

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PageLoading } from "./components/PageLoading";
import { ProtectedLayout } from "./ProtectedLayout";

/** Sign-in, registration and the concierge chat are fetched when a visitor opens them. */
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const AuthPage = lazy(() => import("./pages/auth/AuthPage").then((module) => ({ default: module.AuthPage })));
const ChatPage = lazy(() => import("./pages/ChatPage"));

/**
 * `/about` lives inside the shell with the other signed-in pages, so it is not listed here.
 */
export function AppContent() {
  return <Suspense fallback={<PageLoading fullScreen />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  </Suspense>;
}

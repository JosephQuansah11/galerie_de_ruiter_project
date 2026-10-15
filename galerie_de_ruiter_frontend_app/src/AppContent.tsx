import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PageLoading } from "./components/PageLoading";
import { ProtectedLayout } from "./ProtectedLayout";

/** Sign-in and registration are fetched when a visitor opens them. */
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const AuthPage = lazy(() => import("./pages/auth/AuthPage").then((module) => ({ default: module.AuthPage })));

/**
 * Sign-in and registration sit outside the application shell. Every other route - the landing
 * page, the gallery story, the map and the concierge chat included - goes through the shell, so
 * the navigation is always there.
 */
export function AppContent() {
  return <Suspense fallback={<PageLoading fullScreen />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  </Suspense>;
}

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
 *
 * Those two routes carry their own `<main>`: the shell is what gives every other page its
 * landmark, and a page whose content is in no landmark is a page a screen reader has to be walked
 * through link by link. The element is bare on purpose - the shell's classes would drag the
 * landing page's layout onto a sign-in panel.
 */
export function AppContent() {
  return <Suspense fallback={<PageLoading fullScreen />}>
    <Routes>
      <Route path="/login" element={<main><LoginPage /></main>} />
      <Route path="/register" element={<main><AuthPage /></main>} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  </Suspense>;
}

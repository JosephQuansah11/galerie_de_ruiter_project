import { lazy } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";

/**
 * Every page is fetched on demand. The shell and the landing page are what the first paint
 * needs; the catalogue, the admin screens and the rest would otherwise all be parsed and
 * executed before anything is on screen, which is what makes the first task on the main
 * thread long. React.lazy needs a default export, hence the `.then` hop for named ones.
 */
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const AntiquesPage = lazy(() => import("./pages/antiques/AntiquesPage"));
const AntiqueDetailPage = lazy(() => import("./pages/antiques/AntiqueDetailPage"));
const AddNewAntique = lazy(() => import("./pages/antiques/AddNewAntique"));
const AntiqueAdminPage = lazy(() => import("./pages/admin/AntiqueAdminPage"));
const CategoryAdminPage = lazy(() => import("./pages/admin/CategoryAdminPage"));
const LocationAdminPage = lazy(() => import("./pages/admin/LocationAdminPage"));
const AboutAdminPage = lazy(() => import("./pages/admin/AboutAdminPage"));
const HomeAdminPage = lazy(() => import("./pages/admin/HomeAdminPage"));
const WishlistPage = lazy(() => import("./pages/shopping/WishlistPage"));
const CartPage = lazy(() => import("./pages/shopping/CartPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const PreferencesPage = lazy(() => import("./pages/preferences/PreferencesPage").then((module) => ({ default: module.PreferencesPage })));

/**
 * Everything behind an account. The dashboard, the concierge chat, the gallery story and the
 * pop-up's address sit deliberately outside this guard, so a visitor can read the gallery before
 * signing in. What an account buys is acting on it: the catalogue, the wishlist, the cart and
 * the profile screens all land here.
 */
function RequireAccount() {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (auth.loading) return <div className="loading-screen">{t("checkingSession")}</div>;
  return auth.authenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
}

export function ProtectedRoutes() {
  return <Routes>
    {/* Open to visitors without an account: the gallery story, where it is, the landing page and
        the concierge chat. Interacting with the collection is what asks for a sign-in. */}
    <Route path="/home" element={<WelcomePage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/map" element={<LocationPage />} />

    {/* Everything else needs a signed-in visitor. */}
    <Route element={<RequireAccount />}>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/antiques" element={<AntiquesPage />} />
      <Route path="/antiques/:id" element={<AntiqueDetailPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/antiques/new" element={<AddNewAntique />} />
      <Route path="/admin/antiques" element={<AntiqueAdminPage />} />
      <Route path="/admin/categories" element={<CategoryAdminPage />} />
      <Route path="/admin/location" element={<LocationAdminPage />} />
      <Route path="/admin/about" element={<AboutAdminPage />} />
      <Route path="/admin/home" element={<HomeAdminPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/cart" element={<CartPage />} />
    </Route>

    {/* The landing page used to live at /dashboard and the chat at /dashboard/chat, and search
        engines have those URLs. They keep working, so the indexed address is not lost. */}
    <Route path="/dashboard" element={<Navigate to="/home" replace />} />
    <Route path="/dashboard/chat" element={<Navigate to="/chat" replace />} />

    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>;
}

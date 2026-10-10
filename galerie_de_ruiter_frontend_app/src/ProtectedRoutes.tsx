import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import WelcomePage from "./pages/WelcomePage";
import ChatPage from "./pages/ChatPage";
import AboutPage from "./pages/AboutPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { PreferencesPage } from "./pages/preferences/PreferencesPage";
import AntiquesPage from "./pages/antiques/AntiquesPage";
import AntiqueDetailPage from "./pages/antiques/AntiqueDetailPage";
import AddNewAntique from "./pages/antiques/AddNewAntique";
import AntiqueAdminPage from "./pages/admin/AntiqueAdminPage";
import CategoryAdminPage from "./pages/admin/CategoryAdminPage";
import LocationAdminPage from "./pages/admin/LocationAdminPage";
import AboutAdminPage from "./pages/admin/AboutAdminPage";
import HomeAdminPage from "./pages/admin/HomeAdminPage";
import WishlistPage from "./pages/shopping/WishlistPage";
import CartPage from "./pages/shopping/CartPage";
import LocationPage from "./pages/LocationPage";

/**
 * Everything behind an account. The dashboard and the concierge chat sit deliberately outside
 * this guard, so a visitor can see the gallery and talk to the assistant before signing in.
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
    {/* Open to visitors without an account. */}
    <Route path="/dashboard" element={<WelcomePage />} />
    <Route path="/dashboard/chat" element={<ChatPage />} />

    {/* Everything else needs a signed-in visitor. */}
    <Route element={<RequireAccount />}>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/preferences" element={<PreferencesPage />} />
      <Route path="/antiques" element={<AntiquesPage />} />
      <Route path="/antiques/:id" element={<AntiqueDetailPage />} />
      <Route path="/admin/antiques/new" element={<AddNewAntique />} />
      <Route path="/admin/antiques" element={<AntiqueAdminPage />} />
      <Route path="/admin/categories" element={<CategoryAdminPage />} />
      <Route path="/admin/location" element={<LocationAdminPage />} />
      <Route path="/admin/about" element={<AboutAdminPage />} />
      <Route path="/admin/home" element={<HomeAdminPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/map" element={<LocationPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}

import { Navigate, Route, Routes } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import ChatPage from "./pages/ChatPage";
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

export function ProtectedRoutes() {
  return <Routes>
    <Route path="/dashboard" element={<WelcomePage />} />
    <Route path="/dashboard/chat" element={<ChatPage />} />
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
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}

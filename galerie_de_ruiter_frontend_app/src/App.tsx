import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { PreferencesPage } from "./pages/preferences/PreferencesPage";
import { ThemeProvider } from "./context/ThemeContext";
import "@/styles/App.scss";
import { Container } from "react-bootstrap";
import { CustomNav } from "@/components/Navigation";
import AddNewAntique from "./pages/antiques/AddNewAntique";
import AntiquesPage from "./pages/antiques/AntiquesPage";
import AntiqueDetailPage from "./pages/antiques/AntiqueDetailPage";
import WishlistPage from "./pages/shopping/WishlistPage";
import CartPage from "./pages/shopping/CartPage";
import { ShoppingProvider } from "./context/ShoppingContext";
import WelcomePage from "./pages/WelcomePage";
import CategoryAdminPage from "./pages/admin/CategoryAdminPage";
import LocationAdminPage from "./pages/admin/LocationAdminPage";
import LocationPage from "./pages/LocationPage";
import { LanguageProvider } from "./context/LanguageContext";
import AntiqueAdminPage from "./pages/admin/AntiqueAdminPage";
import ChatPage from "./pages/ChatPage";
import AboutPage from "./pages/AboutPage";
import AboutAdminPage from "./pages/admin/AboutAdminPage";

function ProtectedLayout() {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (auth.loading)
    return <div className="loading-screen">{t("checkingSession")}</div>;
  if (!auth.authenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <Container className="container-div">
      <CustomNav />
      <ShoppingProvider>
      <main className="app-main main-content">
        <Routes>
          <Route path="/dashboard" element={<WelcomePage />} />
          <Route path="/dashboard/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/antiques" element={<AntiquesPage />} />
          <Route path="/antiques/:id" element={<AntiqueDetailPage />} />
          <Route path="/admin/antiques/new" element={<AddNewAntique />} />
          <Route path="/admin/antiques" element={<AntiqueAdminPage />} />
          <Route path="/admin/categories" element={<CategoryAdminPage />} />
          <Route path="/admin/location" element={<LocationAdminPage />} />
          <Route path="/admin/about" element={<AboutAdminPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/map" element={<LocationPage />} />
        </Routes>
      </main>
      </ShoppingProvider>
    </Container>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

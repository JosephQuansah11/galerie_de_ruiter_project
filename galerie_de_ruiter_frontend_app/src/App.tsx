import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
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

function ProtectedLayout() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading)
    return <div className="loading-screen">Checking your Fable session...</div>;
  if (!auth.authenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <Container className="container-div">
      <CustomNav />
      <main className="app-main main-content">
        <Routes>
          <Route path="/dashboard" element={<AddNewAntique></AddNewAntique>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </Container>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

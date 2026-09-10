
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { PreferencesPage } from "./pages/preferences/PreferencesPage";
import { ThemeProvider } from "./context/ThemeContext";
import "@/styles/App.scss"


function ProtectedLayout() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (auth.loading)
    return <div className="loading-screen">Checking your Fable session...</div>;
  if (!auth.authenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<></>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
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

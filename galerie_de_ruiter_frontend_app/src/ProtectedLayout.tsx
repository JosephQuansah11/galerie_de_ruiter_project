import { Container } from "react-bootstrap";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import { CustomNav } from "@/components/Navigation";
import { ShoppingProvider } from "./context/ShoppingContext";
import { ProtectedRoutes } from "./ProtectedRoutes";

export function ProtectedLayout() {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (auth.loading) return <div className="loading-screen">{t("checkingSession")}</div>;
  if (!auth.authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Container className="container-div">
    <CustomNav />
    <ShoppingProvider><main className="app-main main-content"><ProtectedRoutes /></main></ShoppingProvider>
  </Container>;
}

import { Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context/AuthContext";
import { CustomNav } from "@/components/Navigation";
import { ShoppingProvider } from "./context/ShoppingContext";
import { ProtectedRoutes } from "./ProtectedRoutes";

/**
 * The application shell. It renders for visitors too, because the dashboard and the concierge
 * chat are open to them; the individual routes decide what needs an account.
 */
export function ProtectedLayout() {
  const auth = useAuth();
  const { t } = useTranslation();
  if (auth.loading) return <div className="loading-screen">{t("checkingSession")}</div>;
  return <Container className="container-div">
    <CustomNav />
    <ShoppingProvider><main className="app-main main-content"><ProtectedRoutes /></main></ShoppingProvider>
  </Container>;
}

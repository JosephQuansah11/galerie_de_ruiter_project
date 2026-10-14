import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

/**
 * Shown while a route's own chunk is on its way. `fullScreen` is for the routes that render
 * outside the shell (sign-in, registration, the concierge chat), which have no frame of their own.
 */
export function PageLoading({ fullScreen }: { fullScreen?: boolean }) {
  const { t } = useTranslation();
  return <div className={fullScreen ? "loading-screen" : "catalogue-state"} role="status" aria-live="polite">
    <Spinner animation="border" size="sm" /> {t("loadingPage")}
  </div>;
}

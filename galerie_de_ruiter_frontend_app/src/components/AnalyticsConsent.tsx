import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ReactButton";
import { analyticsAvailable, analyticsChoice, denyAnalytics, grantAnalytics } from "@/services/clarity";

/**
 * The question Clarity needs before it may record anything.
 *
 * It is shown once, on the gallery's own host, when no answer is stored. The answer is remembered
 * and can be changed at any time in Preferences; declining means the vendor tag is never requested,
 * not merely told to behave.
 */
export function AnalyticsConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(analyticsAvailable() && analyticsChoice() === null);
  }, []);

  if (!visible) return null;

  const answer = (granted: boolean) => {
    if (granted) grantAnalytics();
    else denyAnalytics();
    setVisible(false);
  };

  return <aside className="analytics-consent" role="region" aria-label={t("analyticsConsentLabel")}>
    <div className="analytics-consent-copy">
      <strong>{t("analyticsConsentTitle")}</strong>
      <p>{t("analyticsConsentText")}</p>
    </div>
    <div className="analytics-consent-actions">
      <Button className="quiet-button" onClick={() => answer(false)}>{t("analyticsDecline")}</Button>
      <Button className="primary-button" onClick={() => answer(true)}>{t("analyticsAccept")}</Button>
    </div>
  </aside>;
}
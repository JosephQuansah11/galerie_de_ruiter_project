import { useTranslation } from "react-i18next";
import { ANTIQUE_DESCRIPTION_MAX_LENGTH } from "./descriptionLimits";

/**
 * Shows how much of the description allowance is used, so the curator can see the
 * limit instead of discovering it when the save is rejected.
 */
export function DescriptionLimitHint({ value }: { value?: string }) {
  const { t } = useTranslation();
  const used = (value ?? "").length;
  const overLimit = used > ANTIQUE_DESCRIPTION_MAX_LENGTH;
  return <div className={overLimit ? "description-hint is-over" : "description-hint"} role="status">
    <span>{t("descriptionLimitNotice", { max: ANTIQUE_DESCRIPTION_MAX_LENGTH })}</span>
    <strong>
      {t("descriptionCount", { used, max: ANTIQUE_DESCRIPTION_MAX_LENGTH })}
      {overLimit && ` · ${t("descriptionTooLong", { max: ANTIQUE_DESCRIPTION_MAX_LENGTH })}`}
    </strong>
  </div>;
}

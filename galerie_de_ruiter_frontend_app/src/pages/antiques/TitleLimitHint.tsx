import { useTranslation } from "react-i18next";
import { ANTIQUE_TITLE_MAX_WORDS, titleIsTooLong, titleWordCount } from "./titleLimits";

/**
 * Shows how much of the title allowance is used, so a new piece is not rejected only when the
 * save is pressed.
 */
export function TitleLimitHint({ value }: { value?: string }) {
  const { t } = useTranslation();
  const used = titleWordCount(value);
  const overLimit = titleIsTooLong(value);
  return <div className={overLimit ? "description-hint is-over" : "description-hint"} role="status">
    <span>{t("titleLimitNotice", { max: ANTIQUE_TITLE_MAX_WORDS })}</span>
    <strong>
      {t("titleCount", { used, max: ANTIQUE_TITLE_MAX_WORDS })}
      {overLimit && ` · ${t("titleTooLong", { max: ANTIQUE_TITLE_MAX_WORDS })}`}
    </strong>
  </div>;
}

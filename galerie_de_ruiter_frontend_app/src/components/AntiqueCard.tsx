import type { Antique } from "@/types/types";
import { useTranslation } from "react-i18next";

export function AntiqueCard({
  antique,
  onSelect,
}: {
  antique: Antique;
  onSelect?: (antique: Antique) => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="antique-card" onClick={() => onSelect?.(antique)}>
      <div className="poster">
        <span>{antique.title.slice(0, 1)}</span>
        <small>{antique.description ?? t("now")}</small>
      </div>
      <div className="antique-card-body">
        <h3>{antique.title}</h3>
        <p>{antique.description || t("storyWaiting")}</p>
        <div className="antique-meta"><span>★ {antique.rating ?? "—"}</span></div>
      </div>
    </article>
  );
}

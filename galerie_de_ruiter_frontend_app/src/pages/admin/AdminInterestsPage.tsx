import { useEffect, useState } from "react";
import { Alert, Badge, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Mail, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAdminInterests, type AdminInterestGroup } from "@/apis/backend_api";
import { useLanguage } from "@/context/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";
import { InventoryHeading } from "./antiques/InventoryHeading";

/**
 * What visitors marked as interesting, grouped by piece. This is the wishlist's replacement: the
 * visitor's account is attached to every mark, so the gallery can follow up instead of guessing
 * from an anonymous counter.
 */
export default function AdminInterestsPage() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [groups, setGroups] = useState<AdminInterestGroup[]>();
  const [error, setError] = useState(false);
  usePageMeta({ title: t("metaAdminInterestsTitle"), canonicalPath: "/admin/interests", noindex: true });

  useEffect(() => {
    let active = true;
    getAdminInterests()
      .then((value) => { if (active) { setGroups(value); setError(false); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString(locale, { dateStyle: "medium" });
  };

  return <section className="admin-page interests-page">
    <InventoryHeading administration={t("administration")} title={t("adminInterestsTitle")} />
    <p className="admin-intro">{t("adminInterestsIntro")}</p>
    {error && <Alert variant="danger">{t("adminInterestsLoadFailed")}</Alert>}
    {!error && !groups && <div className="catalogue-state">
      <Spinner animation="border" size="sm" /> {t("adminInterestsLoading")}
    </div>}
    {groups && groups.length === 0 && <Alert variant="light">{t("adminInterestsEmpty")}</Alert>}
    {groups && groups.map((group) => <section className="interests-group" key={group.antiqueId}>
      <div className="interests-group-heading">
        {group.imageUrl && <img src={resolveAntiqueThumbnailUrl(group.imageUrl)} alt="" loading="lazy"
          decoding="async" width={96} height={72} />}
        <div>
          <h2>{group.title}</h2>
          <span>{[group.artist, group.category].filter(Boolean).join(" · ") || t("uncategorized")}</span>
        </div>
        <Badge bg="dark" className="interests-count">
          <Users size={14} aria-hidden="true" /> {t("interestsPeopleCount", { count: group.people.length })}
        </Badge>
      </div>
      <ul className="interests-people">
        {group.people.map((person) => <li key={person.userId}>
          <div className="interests-person">
            <strong>{person.name || person.email || t("unknownVisitor")}</strong>
            {person.email && person.email !== person.name
              && <a href={`mailto:${person.email}`}>{person.email}</a>}
          </div>
          <time dateTime={person.addedAt}>{date(person.addedAt)}</time>
          {person.email && <a className="interests-mail" href={`mailto:${person.email}?subject=${
            encodeURIComponent(t("interestEmailSubject", { title: group.title }))}`}>
            <Mail size={15} aria-hidden="true" /> {t("interestsEmailVisitor")}
          </a>}
        </li>)}
      </ul>
      <Link className="interests-piece-link" to={`/antiques/${group.antiqueId}`}>{t("viewPiece")}</Link>
    </section>)}
  </section>;
}

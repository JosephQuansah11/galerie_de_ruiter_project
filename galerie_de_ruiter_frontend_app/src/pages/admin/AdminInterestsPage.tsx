import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { BadgeCheck, Check, Mail, Search, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAdminInterests, setAntiqueSold, type AdminInterestGroup } from "@/apis/backend_api";
import { Button } from "@/components/ReactButton";
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
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string>();
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string>();
  usePageMeta({ title: t("metaAdminInterestsTitle"), canonicalPath: "/admin/interests", noindex: true });

  useEffect(() => {
    let active = true;
    getAdminInterests()
      .then((value) => { if (active) { setGroups(value); setError(false); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle) return groups;
    const matches = (value?: string | null) =>
      Boolean(value && value.toLocaleLowerCase(locale).includes(needle));
    return groups.flatMap((group) => {
      const itemMatches = matches(group.title) || matches(group.artist) || matches(group.category);
      const people = group.people.filter((person) => matches(person.name) || matches(person.email));
      if (!itemMatches && people.length === 0) return [];
      // A search for a visitor narrows the people list; a search for the piece keeps all of them.
      return [{ ...group, people: itemMatches ? group.people : people }];
    });
  }, [groups, query, locale]);

  const markSold = async (group: AdminInterestGroup) => {
    if (!window.confirm(t("confirmMarkInterestSold", { title: group.title }))) return;
    setSavingId(group.antiqueId);
    setActionError(undefined);
    try {
      await setAntiqueSold(group.antiqueId, true);
      setGroups((current) => current?.map((item) =>
        item.antiqueId === group.antiqueId ? { ...item, sold: true } : item));
    } catch {
      setActionError("interestMarkSoldFailed");
    } finally {
      setSavingId(undefined);
    }
  };

  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString(locale, { dateStyle: "medium" });
  };

  return <section className="admin-page interests-page">
    <InventoryHeading administration={t("administration")} title={t("adminInterestsTitle")} />
    <p className="admin-intro">{t("adminInterestsIntro")}</p>
    {error && <Alert variant="danger">{t("adminInterestsLoadFailed")}</Alert>}
    {actionError && <Alert variant="danger">{t(actionError)}</Alert>}
    {!error && groups && groups.length > 0 && <div className="interests-toolbar">
      <label className="interests-search">
        <Search size={17} aria-hidden="true" />
        <input type="search" value={query} aria-label={t("searchInterests")}
          placeholder={t("searchInterests")} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label={t("clearInterestSearch")} onClick={() => setQuery("")}>
          <X size={16} aria-hidden="true" />
        </button>}
      </label>
    </div>}
    {groups && groups.length > 0 && <p className="inventory-result-count" aria-live="polite">
      {t("interestsResultCount", { filtered: filteredGroups.length, total: groups.length })}
    </p>}
    {!error && !groups && <div className="catalogue-state">
      <Spinner animation="border" size="sm" /> {t("adminInterestsLoading")}
    </div>}
    {groups && groups.length === 0 && <Alert variant="light">{t("adminInterestsEmpty")}</Alert>}
    {groups && groups.length > 0 && filteredGroups.length === 0 && <Alert variant="light">
      {t("noInterestsFound", { query: query.trim() })}
    </Alert>}
    {filteredGroups.map((group) => <section className="interests-group" key={group.antiqueId}>
      <div className="interests-group-heading">
        {group.imageUrl && <img src={resolveAntiqueThumbnailUrl(group.imageUrl)} alt="" loading="lazy"
          decoding="async" width={96} height={72} />}
        <div>
          <h2>{group.title}</h2>
          <span>{[group.artist, group.category].filter(Boolean).join(" · ") || t("uncategorized")}</span>
        </div>
        <div className="interests-group-actions">
          <Badge bg="dark" className="interests-count">
            <Users size={14} aria-hidden="true" /> {t("interestsPeopleCount", { count: group.people.length })}
          </Badge>
          {group.sold
            ? <Badge bg="dark" className="interests-sold"><Check size={14} aria-hidden="true" /> {t("sold")}</Badge>
            : <Button as="button" className="btn btn-outline-success btn-sm" type="button"
                disabled={savingId === group.antiqueId} onClick={() => void markSold(group)}>
                {savingId === group.antiqueId
                  ? <Spinner animation="border" size="sm" />
                  : <BadgeCheck size={16} aria-hidden="true" />}
                {t("markInterestSold")}
              </Button>}
        </div>
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

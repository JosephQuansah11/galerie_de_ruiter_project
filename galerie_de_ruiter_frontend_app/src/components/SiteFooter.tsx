import { Instagram } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

/** The gallery's Instagram profile. The footer shows it on every page. */
export const INSTAGRAM_URL = "https://www.instagram.com/galerie_de_ruiter/";

type Profile = { href: string; labelKey: string; icon: LucideIcon };

/**
 * The profiles the gallery actually keeps. Adding another is a line here and a label per language -
 * nothing else in the footer has to know how many there are. They are only the ones that exist: a
 * footer full of accounts the gallery does not have is a set of dead links.
 */
const profiles: Profile[] = [
  { href: INSTAGRAM_URL, labelKey: "footerInstagram", icon: Instagram },
];

type Column = { headingKey: string; links: { href: string; translationKey: string }[] };

/**
 * The grouped links, read the way a footer is read: what the gallery is showing, and the gallery
 * itself. Every one of them is a page a visitor can reach without an account, named with the same
 * translation keys the navigation uses so the two can never disagree.
 */
const columns: Column[] = [
  {
    headingKey: "footerExplore",
    links: [
      { href: "/antiques", translationKey: "browseAntiques" },
      { href: "/chat", translationKey: "navGalleryChat" },
    ],
  },
  {
    headingKey: "footerGallery",
    links: [
      { href: "/about", translationKey: "navAbout" },
      { href: "/map", translationKey: "location" },
    ],
  },
];

/**
 * The footer every page ends with: who the gallery is, the profiles it keeps, the pages a visitor can
 * read without an account, and the year.
 *
 * The address and the opening hours are deliberately not repeated here. They are records the gallery
 * edits on the location screen, and a copy in the footer would be the copy that goes stale - the same
 * reason the static document carries neither. The footer links to the page that holds them instead.
 */
export function SiteFooter() {
  const { t } = useLanguage();
  return <footer className="site-footer">
    <div className="site-footer-top">
      <div className="site-footer-brand">
        <span className="site-footer-wordmark">{t("galleryName")}</span>
        <span className="site-footer-tagline">{t("footerTagline")}</span>
      </div>
      <nav className="site-footer-social" aria-label={t("footerFollow")}>
        <span className="site-footer-heading">{t("footerFollow")}</span>
        <ul className="site-footer-profiles">
          {profiles.map((profile) => <li key={profile.href}>
            <a className="site-footer-profile" href={profile.href} target="_blank" rel="noreferrer">
              <profile.icon size={20} aria-hidden="true" /><span>{t(profile.labelKey)}</span>
            </a>
          </li>)}
        </ul>
      </nav>
    </div>
    <div className="site-footer-columns">
      {columns.map((column) => <nav key={column.headingKey} aria-label={t(column.headingKey)}>
        <span className="site-footer-heading">{t(column.headingKey)}</span>
        {column.links.map((link) => <Link key={link.href} to={link.href}>{t(link.translationKey)}</Link>)}
      </nav>)}
    </div>
    <small className="site-footer-rights">{t("footerRights", { year: new Date().getFullYear() })}</small>
  </footer>;
}

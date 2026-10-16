import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

/** The gallery's Instagram profile, which is what a visitor should be able to find from any page. */
export const INSTAGRAM_URL = "https://www.instagram.com/galerie_de_ruiter/";

/**
 * The destinations a visitor can reach without an account - the same four the navigation shows
 * them, named with the same keys so the two can never disagree about a page.
 */
const footerLinks = [
  { href: "/antiques", translationKey: "browseAntiques" },
  { href: "/chat", translationKey: "navGalleryChat" },
  { href: "/about", translationKey: "navAbout" },
  { href: "/map", translationKey: "location" },
];

/**
 * The footer every page ends with: the four pages a visitor can read without an account, the
 * gallery's Instagram profile, and the year.
 *
 * The address and the opening hours are deliberately not repeated here. They are records the
 * gallery edits on the location screen, and a copy in the footer would be the copy that goes stale
 * - the same reason the static document carries neither (see the README). The footer links to the
 * page that holds them instead.
 */
export function SiteFooter() {
  const { t } = useLanguage();
  return <footer className="site-footer">
    <div className="site-footer-brand">
      <span className="site-footer-wordmark">{t("galleryName")}</span>
      <span className="site-footer-tagline">{t("footerTagline")}</span>
    </div>
    <nav className="site-footer-links" aria-label={t("footerExplore")}>
      <span className="site-footer-heading">{t("footerExplore")}</span>
      {footerLinks.map((link) => <Link key={link.href} to={link.href}>{t(link.translationKey)}</Link>)}
    </nav>
    <div className="site-footer-social">
      <span className="site-footer-heading">{t("footerFollow")}</span>
      <a className="site-footer-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        <Instagram size={18} aria-hidden="true" /><span>{t("footerInstagram")}</span>
      </a>
    </div>
    <small className="site-footer-rights">{t("footerRights", { year: new Date().getFullYear() })}</small>
  </footer>;
}

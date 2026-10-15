import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

/**
 * What a visitor without an account sees where the paging controls would be: the first page of
 * the collection is theirs to read, and everything past it - the other pages, a piece's own page,
 * the basket and the saved pieces - is what an account is for.
 *
 * The link carries this list as the page to come back to, which is the same `from` the route guard
 * passes, so signing in returns the visitor to the collection rather than to the landing page.
 */
export function CatalogueSignInHint() {
  const { t } = useTranslation();
  const location = useLocation();
  return <div className="catalogue-signin">
    <p>{t("collectionSignInHint")}</p>
    <NavLink className="btn btn-dark" to="/login" state={{ from: `${location.pathname}${location.search}` }}>
      <LogIn size={17} /> {t("navSignIn")}
    </NavLink>
  </div>;
}

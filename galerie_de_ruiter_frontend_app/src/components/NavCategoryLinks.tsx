import { LibraryBig } from "lucide-react";
import { NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import type { Category } from "@/models/antiques/Antique";
import { CategoryDropdownGrid } from "./CategoryDropdownGrid";

export function NavCategoryLinks({
  categories,
  hasError,
  onNavigate,
}: {
  categories: Category[];
  hasError: boolean;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <NavDropdown
      title={
        <>
          <LibraryBig className="nav-icon" aria-hidden="true" />
          {t("antiques")}
        </>
      }
      id="antique-categories"
      className="nav-category-dropdown"
      aria-label={t("navAntiquesCategories")}
    >
      <NavDropdown.Item as={Link} to="/antiques" onClick={onNavigate}>
        {t("catalogueNavigation")}
      </NavDropdown.Item>
      {hasError && (
        <NavDropdown.ItemText>
          {t("navCategoriesUnavailable")}
        </NavDropdown.ItemText>
      )}
      <CategoryDropdownGrid categories={categories} onNavigate={onNavigate} />
    </NavDropdown>
  );
}

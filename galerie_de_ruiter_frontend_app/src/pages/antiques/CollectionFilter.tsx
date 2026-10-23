import { Dropdown } from "react-bootstrap";
import type { Category } from "@/models/antiques/Antique";
import { branchItemCount } from "@/models/antiques/categoryBranch";
import { useTranslation } from "react-i18next";

/**
 * The catalogue's category picker, drawn as a tree: every main category is a heading and its
 * subcategories hang indented below it behind a guide line. Reading "Audio - Tv / Decoration" in a
 * flat list made it hard to tell a subcategory from a main one, so the hierarchy is shown instead.
 *
 * Picking a main category filters on its whole branch, so the count beside it is the branch's.
 */
export function CollectionFilter({ categories, category, onSelect }: {
  categories: Category[];
  category: string;
  onSelect: (category: string) => void;
}) {
  const { t } = useTranslation();
  return <div>
    <Dropdown className="collection-filter-dropdown">
      <Dropdown.Toggle variant="outline-secondary">{category || t("allPieces")}</Dropdown.Toggle>
      <Dropdown.Menu className="collection-dropdown-menu">
        <Dropdown.Item as="button" className="collection-dropdown-all" onClick={() => onSelect("")}>{t("allPieces")}</Dropdown.Item>
        <div className="collection-dropdown-grid">{categories.map((item) => <section className="collection-dropdown-group" key={item.id}>
          <Dropdown.Item as="button" className="collection-dropdown-parent" onClick={() => onSelect(item.name)}>
            <span className="collection-dropdown-name">{item.name}</span>
            <span className="collection-dropdown-count">{branchItemCount(item)}</span>
          </Dropdown.Item>
          {(item.children ?? []).length > 0 && <div className="collection-dropdown-children">
            {item.children.map((child) => <Dropdown.Item as="button" className="collection-dropdown-child" key={child.id} onClick={() => onSelect(child.name)}>
              <span className="collection-dropdown-name">{child.name}</span>
              <span className="collection-dropdown-count">{branchItemCount(child)}</span>
            </Dropdown.Item>)}
          </div>}
        </section>)}</div>
      </Dropdown.Menu>
    </Dropdown>
  </div>;
}



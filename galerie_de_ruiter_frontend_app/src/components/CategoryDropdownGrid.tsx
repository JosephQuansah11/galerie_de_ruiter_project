import { NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Category } from "@/models/antiques/Antique";

/**
 * The Antiek menu, drawn as a tree: each main category heads a group and its subcategories hang
 * indented below it, so a subcategory is never mistaken for a main one and no name has to be
 * repeated as "Main / Child".
 */
export function CategoryDropdownGrid({ categories, onNavigate }: { categories: Category[]; onNavigate: () => void }) {
  return <div className="category-dropdown-grid">
    {categories.map((category) => <section className="category-dropdown-group" key={category.id}>
      <CategoryLink category={category} onNavigate={onNavigate} />
      {category.children.length > 0 && <div className="category-dropdown-children">
        {category.children.map((child) => <CategoryLink key={child.id} category={child} child onNavigate={onNavigate} />)}
      </div>}
    </section>)}
  </div>;
}

function CategoryLink({ category, child = false, onNavigate }: {
  category: Category; child?: boolean; onNavigate: () => void;
}) {
  return <NavDropdown.Item as={Link} className={child ? "category-child" : "category-parent"}
    to={`/antiques?category=${encodeURIComponent(category.name)}`} onClick={onNavigate}>
    <span className="category-name">{category.name}</span>
    <span className="category-count">{category.itemCount}</span>
  </NavDropdown.Item>;
}


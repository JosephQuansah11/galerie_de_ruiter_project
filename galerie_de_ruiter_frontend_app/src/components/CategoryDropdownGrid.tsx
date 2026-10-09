import { NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Category } from "@/models/antiques/Antique";

export function CategoryDropdownGrid({ categories, onNavigate }: { categories: Category[]; onNavigate: () => void }) {
  return <div className="category-dropdown-grid">
    {categories.map((category) => <section className="category-dropdown-group" key={category.id}>
      <CategoryLink category={category} onNavigate={onNavigate} />
      {category.children.map((child) => <CategoryLink key={child.id} category={child} child onNavigate={onNavigate} />)}
    </section>)}
  </div>;
}

function CategoryLink({ category, child = false, onNavigate }: { category: Category; child?: boolean; onNavigate: () => void }) {
  return <NavDropdown.Item as={Link} className={child ? "category-child" : "category-parent"}
    to={`/antiques?category=${encodeURIComponent(category.name)}`} onClick={onNavigate}>
    <span>{category.name}</span><span className="category-count">{category.itemCount}</span>
  </NavDropdown.Item>;
}

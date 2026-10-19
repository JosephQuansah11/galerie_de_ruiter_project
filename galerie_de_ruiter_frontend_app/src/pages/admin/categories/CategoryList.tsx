import type { Category } from "@/models/antiques/Antique";
import { CategoryRow } from "./CategoryRow";
import { buildCategoryTree } from "./categoryTree";

type Props = { categories: Category[]; toggle: (category: Category) => void; remove: (id: string) => void };

type BranchProps = Pick<Props, "toggle" | "remove"> & { category: Category; depth: number };

/** One category and the subcategories filed under it, as a nested list. */
function CategoryBranch({ category, depth, toggle, remove }: BranchProps) {
  return <li className="category-tree-node">
    <CategoryRow category={category} depth={depth} toggle={toggle} remove={remove} />
    {category.children.length > 0 && <ul className="category-tree-children">
      {category.children.map((child) => <CategoryBranch key={child.id} category={child} depth={depth + 1}
        toggle={toggle} remove={remove} />)}
    </ul>}
  </li>;
}

export function CategoryList({ categories, toggle, remove }: Props) {
  const roots = buildCategoryTree(categories);
  return <ul className="admin-list category-tree">{roots.map((category) =>
    <CategoryBranch key={category.id} category={category} depth={0} toggle={toggle} remove={remove} />)}</ul>;
}


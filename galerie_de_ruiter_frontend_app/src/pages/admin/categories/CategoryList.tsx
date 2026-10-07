import type { Category } from "@/models/antiques/Antique";
import { CategoryRow } from "./CategoryRow";

type Props = { categories: Category[]; toggle: (category: Category) => void; remove: (id: string) => void };
export function CategoryList({ categories, toggle, remove }: Props) {
  return <div className="admin-list">{categories.map((category) =>
    <CategoryRow key={category.id} category={category} toggle={toggle} remove={remove} />)}</div>;
}

import type { Category } from "@/models/antiques/Antique";

/**
 * Builds one tree from the category list the admin endpoint sends.
 *
 * The endpoint sends every category row so hidden children can still be administered, and it may
 * also nest the visible ones under their parent. Linking by `parentId` gives exactly one node per
 * category; a nested child is only added when there is no flat row for it. That keeps a hidden
 * subcategory in the tree instead of dropping it with the visible-only nesting.
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  const nodes = new Map<string, Category>();
  const order: string[] = [];

  const collect = (category: Category, inheritedParentId?: string | null): void => {
    const existing = nodes.get(category.id);
    if (existing) {
      if (existing.parentId == null && inheritedParentId != null) existing.parentId = inheritedParentId;
      return;
    }
    const node: Category = {
      ...category,
      parentId: category.parentId ?? inheritedParentId ?? null,
      children: [],
    };
    nodes.set(category.id, node);
    order.push(category.id);
    for (const child of category.children ?? []) collect(child, category.id);
  };
  categories.forEach((category) => collect(category));

  // A parent link that loops back on itself would otherwise make a subtree unreachable.
  const cyclic = new Set<string>();
  for (const id of order) {
    const path = new Set<string>();
    let current: string | null = id;
    while (current && nodes.has(current) && !path.has(current)) {
      path.add(current);
      current = nodes.get(current)?.parentId ?? null;
    }
    if (current && path.has(current)) path.forEach((member) => cyclic.add(member));
  }

  const roots: Category[] = [];
  for (const id of order) {
    const node = nodes.get(id)!;
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id && !cyclic.has(node.id) && !cyclic.has(parent.id)) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (items: Category[]): void => {
    items.sort((left, right) =>
      (right.itemCount ?? 0) - (left.itemCount ?? 0)
      || left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
      || left.id.localeCompare(right.id));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

export type CategoryAtDepth = { category: Category; depth: number };

/** The tree as rows, parents before their children, for a select that shows the hierarchy. */
export function flattenCategoryTree(categories: Category[]): CategoryAtDepth[] {
  const rows: CategoryAtDepth[] = [];
  const walk = (items: Category[], depth: number): void => {
    for (const category of items) {
      rows.push({ category, depth });
      walk(category.children, depth + 1);
    }
  };
  walk(buildCategoryTree(categories), 0);
  return rows;
}

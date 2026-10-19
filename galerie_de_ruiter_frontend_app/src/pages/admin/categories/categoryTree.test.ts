import type { Category } from "@/models/antiques/Antique";
import { buildCategoryTree, flattenCategoryTree } from "./categoryTree";

function category(id: string, name: string, itemCount = 0, parentId: string | null = null, children: Category[] = []): Category {
  return { id, name, visible: true, parentId, itemCount, children };
}

describe("the category tree", () => {
  it("links a flat parent and child by parentId", () => {
    const parent = category("p", "Furniture", 5);
    const child = category("c", "Mirrors", 2, "p");

    const roots = buildCategoryTree([parent, child]);

    expect(roots).toHaveLength(1);
    expect(roots[0].name).toBe("Furniture");
    expect(roots[0].children.map((entry) => entry.name)).toEqual(["Mirrors"]);
  });

  it("keeps one copy when the API also nests a child that is in the flat list", () => {
    const child = category("c", "Mirrors", 2, "p");
    const parent = category("p", "Furniture", 5, null, [child]);

    const roots = buildCategoryTree([parent, child]);

    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].id).toBe("c");
  });

  it("reads a legacy nested-only response and gives the child its parentId", () => {
    const parent = category("p", "Furniture", 5, null, [category("c", "Mirrors", 2)]);

    const roots = buildCategoryTree([parent]);

    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0]).toMatchObject({ id: "c", parentId: "p" });
  });

  it("keeps a hidden child that only arrives as a flat row", () => {
    const parent = category("p", "Furniture", 5);
    const hidden = { ...category("c", "Mirrors", 2, "p"), visible: false };

    const roots = buildCategoryTree([parent, hidden]);

    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children[0].visible).toBe(false);
  });

  it("puts an orphan at the root instead of dropping it", () => {
    const roots = buildCategoryTree([category("c", "Mirrors", 2, "missing")]);

    expect(roots.map((entry) => entry.name)).toEqual(["Mirrors"]);
  });

  it("does not recurse forever when two categories point at each other", () => {
    const first = category("a", "First", 1, "b");
    const second = category("b", "Second", 1, "a");

    const roots = buildCategoryTree([first, second]);

    expect(roots.map((entry) => entry.id).sort()).toEqual(["a", "b"]);
    expect(roots.every((entry) => entry.children.length === 0)).toBe(true);
  });

  it("flattens the tree in parent-before-child order for the parent selector", () => {
    const child = category("c", "Mirrors", 2, "p");
    const parent = category("p", "Furniture", 5, null, [child]);

    expect(flattenCategoryTree([parent, child]).map(({ category: entry, depth }) => [entry.name, depth]))
      .toEqual([["Furniture", 0], ["Mirrors", 1]]);
  });

  it("orders each level by piece count and then name", () => {
    const roots = buildCategoryTree([
      category("small", "Small", 1),
      category("large", "Large", 8),
      category("tie-b", "Beta", 2),
      category("tie-a", "Alpha", 2),
    ]);

    expect(roots.map((entry) => entry.name)).toEqual(["Large", "Alpha", "Beta", "Small"]);
  });
});

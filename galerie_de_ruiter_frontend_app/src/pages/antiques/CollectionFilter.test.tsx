import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { CollectionFilter } from "./CollectionFilter";
import type { Category } from "@/models/antiques/Antique";

/** The picker a visitor filters the catalogue with: a tree of main categories and their children. */
const categories: Category[] = [
  {
    id: "c1", name: "Audio - Tv", visible: true, itemCount: 5,
    children: [{ id: "c2", name: "Decoration", visible: true, parentId: "c1", parentName: "Audio - Tv", itemCount: 2, children: [] }],
  },
];

/** Opens the picker; the menu arrives one render later, once the dropdown reports itself shown. */
async function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: i18n.t("allPieces") }));
  await waitFor(() => expect(screen.getByRole("button", { name: /Audio - Tv/ })).toBeInTheDocument());
}

describe("Catalogue category filter", () => {
  it("hangs a subcategory inside its main category's branch, under its own name", async () => {
    renderPage(<CollectionFilter categories={categories} category="" onSelect={jest.fn()} />, { auth: false });

    await openMenu();

    const parent = screen.getByRole("button", { name: /Audio - Tv/ });
    const child = screen.getByRole("button", { name: /Decoration/ });
    // The child hangs under the parent's branch, so the tree shows which category owns it…
    expect(parent.closest(".collection-dropdown-group")).toBe(child.closest(".collection-dropdown-group"));
    expect(child.closest(".collection-dropdown-children")?.previousElementSibling).toBe(parent);
    // …and its name never has to repeat the main category to make that clear.
    expect(screen.queryByText("Audio - Tv / Decoration")).not.toBeInTheDocument();
    // The main category answers for its whole branch, so its count is the branch's: the five pieces
    // filed on the parent row plus the two in the subcategory.
    expect(parent.textContent).toContain("7");
    expect(child.textContent).toContain("2");
  });

  it("filters on the subcategory the visitor picks", async () => {
    const onSelect = jest.fn();
    renderPage(<CollectionFilter categories={categories} category="" onSelect={onSelect} />, { auth: false });

    await openMenu();
    fireEvent.click(screen.getByRole("button", { name: /Decoration/ }));

    expect(onSelect).toHaveBeenCalledWith("Decoration");
  });
});


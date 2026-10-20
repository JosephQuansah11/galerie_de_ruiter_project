import type Antique from "@/models/antiques/Antique";
import type { Category } from "@/models/antiques/Antique";
import { importDifferences } from "./differences";

const categories: Category[] = [
  {
    id: "cat-mirrors", name: "Mirrors", visible: true, itemCount: 1,
    children: [{ id: "cat-wall", name: "Wall mirrors", visible: true, itemCount: 1, children: [] }],
  },
];

const existing = {
  id: "existing-1",
  title: "Carved mirror",
  description: "Late 19th century",
  price: 480,
  category: "Mirrors",
  artist: { id: "artist-1", firstName: "Ada", lastName: "Lovelace" },
} as Antique;

const matching = {
  title: "Carved mirror",
  description: "Late 19th century",
  price: "480",
  artist: { id: "artist-1", firstName: "Ada", lastName: "Lovelace" },
  categoryId: "cat-mirrors",
};

describe("comparing an import with the piece already in the gallery", () => {
  it("finds nothing to ask about when the import says the same thing", () => {
    expect(importDifferences(matching, existing, categories)).toEqual([]);
  });

  it("lists every field where the import differs, with both values", () => {
    const differences = importDifferences({
      title: "Carved  MIRROR!",
      description: "Restored in 2024",
      price: "525.50",
      artist: { id: "artist-2", firstName: "Grace", lastName: "Hopper" },
      categoryId: "cat-wall",
    }, existing, categories);

    expect(differences).toEqual([
      { field: "description", current: "Late 19th century", incoming: "Restored in 2024" },
      { field: "price", current: "480", incoming: "525.50" },
      { field: "artist", current: "Ada Lovelace", incoming: "Grace Hopper" },
      { field: "category", current: "Mirrors", incoming: "Mirrors / Wall mirrors" },
    ]);
  });

  it("treats a blank import field as 'keep what the gallery has', not as a change", () => {
    expect(importDifferences({
      title: "Carved mirror",
      description: "",
      price: "",
      categoryId: "cat-mirrors",
    }, existing, categories)).toEqual([]);
  });

  it("does not ask about a title that only changed case or spacing", () => {
    expect(importDifferences({ ...matching, title: "  Carved  Mirror! " }, existing, categories))
      .toEqual([]);
  });
});

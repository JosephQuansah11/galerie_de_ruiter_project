import type Antique from "@/models/antiques/Antique";
import { existingIndex, matchExisting, titleKey } from "./existingMatching";

const antique = (id: string, title: string) => ({ id, title } as Antique);

describe("matching an imported title to the inventory", () => {
  it("ignores case, accents, punctuation and repeated spaces", () => {
    expect(titleKey("  Étagère  ")).toBe("etagere");
    expect(titleKey("Carved  MIRROR!")).toBe("carved mirror");
  });

  it("matches one existing piece and refuses to guess between two", () => {
    const unique = existingIndex([antique("one", "Carved mirror")]);
    expect(matchExisting(unique, "carved MIRROR")).toEqual({ existing: antique("one", "Carved mirror"), ambiguous: false });

    const duplicate = existingIndex([antique("one", "Carved mirror"), antique("two", "Carved Mirror")]);
    expect(matchExisting(duplicate, "Carved mirror")).toEqual({ existing: undefined, ambiguous: true });
  });
});

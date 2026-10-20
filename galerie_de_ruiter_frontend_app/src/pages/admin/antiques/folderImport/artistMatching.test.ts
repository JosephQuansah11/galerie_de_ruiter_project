import type { Designer } from "@/models/antiques/Antique";
import {
  artistNameParts,
  designerForName,
  designerIndex,
  designerKeys,
  designerName,
  splitTitleArtist,
} from "./artistMatching";

function designer(id: string, firstName: string, lastName: string, middleName?: string): Designer {
  return { id, firstName, lastName, middleName };
}

describe("reading the artist from a title folder", () => {
  it("takes the name after the last 'by'", () => {
    expect(splitTitleArtist("Stoel by John Doe")).toEqual({ title: "Stoel", artistName: "John Doe" });
    expect(splitTitleArtist("Stoel BY John Doe")).toEqual({ title: "Stoel", artistName: "John Doe" });
    expect(splitTitleArtist("Boek over kunst by Jan van Eyck")).toEqual({
      title: "Boek over kunst", artistName: "Jan van Eyck",
    });
    expect(splitTitleArtist("A perfect chaos of impressions by Eddy Van Gestel")).toEqual({
      title: "A perfect chaos of impressions", artistName: "Eddy Van Gestel",
    });
    expect(splitTitleArtist("Silvereye by Guido Argentini")).toEqual({
      title: "Silvereye", artistName: "Guido Argentini",
    });
  });

  it("takes an artist followed by a dash", () => {
    expect(splitTitleArtist("Luc Tuymans -")).toEqual({ title: "", artistName: "Luc Tuymans" });
    // A single word before the dash is a title, not a person.
    expect(splitTitleArtist("Stoel -")).toEqual({ title: "Stoel -" });
  });

  it("leaves a folder without a usable name alone", () => {
    expect(splitTitleArtist("Stoel")).toEqual({ title: "Stoel" });
    expect(splitTitleArtist("Stoel by 2024")).toEqual({ title: "Stoel by 2024" });
    expect(splitTitleArtist("The Book by the Sea")).toEqual({ title: "The Book by the Sea" });
    expect(splitTitleArtist("Stoel by een hele lange naam die geen naam is"))
      .toEqual({ title: "Stoel by een hele lange naam die geen naam is" });
  });

  it("splits a name the designer API can create", () => {
    expect(artistNameParts("John Doe")).toEqual({ firstName: "John", lastName: "Doe" });
    expect(artistNameParts("Jan van Eyck")).toEqual({ firstName: "Jan", lastName: "van Eyck" });
    expect(artistNameParts("Prince")).toBeUndefined();
  });
});

describe("matching a folder's artist to the directory", () => {
  it("writes an artist's name the way the gallery does", () => {
    expect(designerName(designer("1", "Ada", "Lovelace", "King"))).toBe("Ada King Lovelace");
    expect(designerKeys(designer("1", "Ada", "Lovelace", "King")))
      .toEqual(["Ada King Lovelace", "Ada Lovelace"]);
  });

  it("finds the same person regardless of case and spacing", () => {
    const index = designerIndex([
      designer("ada", "Ada", "Lovelace"),
      designer("jan", "Jan", "van Eyck"),
    ]);

    expect(designerForName(index, "  ada   lovelace ")?.id).toBe("ada");
    expect(designerForName(index, "Jan van Eyck")?.id).toBe("jan");
    expect(designerForName(index, "Someone Else")).toBeUndefined();
  });
});

import i18n from "@/i18n";
import { cityFromAddress, titleWithCity } from "./pageTitle";

describe("cityFromAddress", () => {
  it("takes the city from the address the location page shows", () => {
    expect(cityFromAddress("Groenselstraat 48 , Waasmunster")).toBe("Waasmunster");
    expect(cityFromAddress("De Ruiter 12, Waasmunster")).toBe("Waasmunster");
  });

  it("drops a Belgian postal code in front of the city", () => {
    expect(cityFromAddress("Groenselstraat 48, 9250 Waasmunster")).toBe("Waasmunster");
  });

  it("accepts a bare city but not a bare street", () => {
    expect(cityFromAddress("Waasmunster")).toBe("Waasmunster");
    expect(cityFromAddress("Groenselstraat 48")).toBeUndefined();
  });

  it("has no city when the gallery has not filled the address in", () => {
    expect(cityFromAddress(undefined)).toBeUndefined();
    expect(cityFromAddress("   ")).toBeUndefined();
  });
});

describe("titleWithCity", () => {
  it("appends the city once the location is known", () => {
    expect(titleWithCity(i18n.t, "welcomeTitle", "Waasmunster"))
      .toBe(`${i18n.t("welcomeTitle")} ${i18n.t("inCity", { city: "Waasmunster" })}`);
  });

  it("leaves the title complete while the location is still loading", () => {
    expect(titleWithCity(i18n.t, "welcomeTitle")).toBe(i18n.t("welcomeTitle"));
  });

  it("names the categories a visitor searches for", () => {
    const title = i18n.t("welcomeTitle").toLowerCase();
    expect(title).toContain("galerie de ruiter");
    expect(title).toContain(i18n.t("antiques").toLowerCase());
  });
});

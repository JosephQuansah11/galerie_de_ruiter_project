import type { TFunction } from "i18next";

/**
 * The translation function of a page. The pages use two of them: i18next's own `t` and the one
 * the gallery's language context hands out, which is the same function with a narrower type.
 */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * The city the pop-up is in, read from the address the location page shows: "Groenselstraat 48,
 * Waasmunster" is in Waasmunster. The location is a record the gallery edits rather than a
 * constant in the code, so the page titles follow it when the pop-up moves.
 */
export function cityFromAddress(address?: string): string | undefined {
  const parts = (address ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return undefined;
  // A Belgian address can carry its postal code in front of the city ("9000 Waasmunster").
  const city = last.replace(/^\d{4}\s+/, "").trim();
  // One part that still carries a house number is a street ("Groenselstraat 48"), not a city.
  const looksLikeCity = parts.length > 1 || !/\d/.test(city);
  return looksLikeCity && city ? city : undefined;
}

/**
 * A page title with the city appended once the location is known: "… in Waasmunster". The city
 * arrives with the store location, so the first render has none and the title stays complete
 * without it rather than ending in a dangling preposition.
 */
export function titleWithCity(t: TFunction | Translate, titleKey: string, city?: string): string {
  const translate = t as Translate;
  const title = translate(titleKey);
  return city ? `${title} ${translate("inCity", { city })}` : title;
}

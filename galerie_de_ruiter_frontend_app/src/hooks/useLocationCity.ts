import { useEffect, useState } from "react";
import { getStoreLocation } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { cityFromAddress } from "@/services/pageTitle";

const STORAGE_KEY = "galerie-city";

/** The city from the last visit, so the heading is already the right size on the first paint. */
function rememberedCity(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function rememberCity(city: string | undefined): void {
  try {
    if (city) localStorage.setItem(STORAGE_KEY, city);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A disabled or full storage must never stop the page from rendering.
  }
}

/**
 * The city the pop-up is in, for the page title and the heading. It comes from the store location
 * - the record the location page shows - so the gallery's own address decides what the title says.
 *
 * The last answer is remembered and the first render starts from it, because the document carries a
 * first screen whose heading already names the city (see index.html): a heading that started without
 * one would shrink when the application took over and grow again when the address arrived, and the
 * largest-contentful-paint measurement follows that second growth - the store location's round trip
 * rather than the paint. A visitor's very first visit still settles once.
 */
export function useLocationCity(): string | undefined {
  const [city, setCity] = useState<string | undefined>(rememberedCity);
  useEffect(() => {
    let active = true;
    const load = () => {
      getStoreLocation()
        .then((value) => {
          if (!active) return;
          const next = cityFromAddress(value.address);
          setCity(next);
          rememberCity(next);
        })
        .catch(() => { if (active) setCity(undefined); });
    };
    load();
    const unsubscribe = subscribeToContentUpdates("location", load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return city;
}

import { useEffect, useState } from "react";
import { getStoreLocation } from "@/apis/backend_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { cityFromAddress } from "@/services/pageTitle";

/**
 * The city the pop-up is in, for the page title and the heading. It comes from the store location
 * - the record the location page shows - so the gallery's own address decides what the title
 * says, and a page that has not loaded it yet renders a title without a city.
 */
export function useLocationCity(): string | undefined {
  const [city, setCity] = useState<string>();
  useEffect(() => {
    let active = true;
    const load = () => {
      getStoreLocation()
        .then((value) => { if (active) setCity(cityFromAddress(value.address)); })
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

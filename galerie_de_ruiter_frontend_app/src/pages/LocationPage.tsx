import { useEffect, useState } from "react";
import { Clock3, MapPin } from "lucide-react";
import { getStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { useLanguage } from "@/context/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { cityFromAddress, titleWithCity } from "@/services/pageTitle";
import { LocationMap } from "./location/LocationMap";

export default function LocationPage() {
  const [location, setLocation] = useState<StoreLocation>();
  const [error, setError] = useState(false);
  const { t } = useLanguage();
  // The heading and the title name the city, which is where the address in the record points.
  const city = cityFromAddress(location?.address);
  usePageMeta({
    title: titleWithCity(t, "metaMapTitle", city),
    description: t("metaMapDescription"),
    canonicalPath: "/map",
  });
  useEffect(() => {
    let active = true;
    const loadLocation = () => {
      getStoreLocation().then((value) => {
        if (active) {
          setLocation(value);
          setError(false);
        }
      }).catch(() => {
        // The page is open to visitors, so a gallery that cannot be reached has to say so
        // instead of leaving the address loading forever.
        if (active) setError(true);
      });
    };
    loadLocation();
    const unsubscribe = subscribeToContentUpdates("location", loadLocation);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  if (error)
    return <div className="catalogue-state">{t("locationCouldNotLoad")}</div>;
  if (!location)
    return <div className="catalogue-state">{t("loadingLocation")}</div>;
  return (
    <section className="location-page">
      <div className="location-copy">
        <span className="catalogue-artist">{t("location")}</span>
        <h1>{titleWithCity(t, "mapHeading", city)}</h1>
        <p>
          {t("locationIntro")}
        </p>
        <div className="location-facts">
          <div>
            <MapPin size={18} />
            <span>
              {t("currentLocation")}
              <strong>{location.address}</strong>
            </span>
          </div>
          <div>
            <Clock3 size={18} />
            <span>
              {t("openingHours")}
              <strong>{location.openingHours}</strong>
            </span>
          </div>
        </div>
      </div>
      <LocationMap location={location} title={t("locationMapTitle")} linkText={t("openInMap")} />
    </section>
  );
}

import { useEffect, useState } from "react";
import { Clock3, MapPin } from "lucide-react";
import { getStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { LocationMap } from "./location/LocationMap";

export default function LocationPage() {
  const [location, setLocation] = useState<StoreLocation>();
  const { t } = useLanguage();
  useEffect(() => {
    let active = true;
    const loadLocation = () => {
      getStoreLocation().then((value) => {
        if (active) setLocation(value);
      });
    };
    loadLocation();
    const unsubscribe = subscribeToContentUpdates("location", loadLocation);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  if (!location)
    return <div className="catalogue-state">{t("loadingLocation")}</div>;
  return (
    <section className="location-page">
      <div className="location-copy">
        <span className="catalogue-artist">{t("location")}</span>
        <h1>{t("findPopup")}</h1>
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

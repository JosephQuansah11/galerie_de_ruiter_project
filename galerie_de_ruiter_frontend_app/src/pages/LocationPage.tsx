import { useEffect, useState } from "react";
import { Clock3, MapPin, Navigation } from "lucide-react";
import { getStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToContentUpdates } from "@/services/contentUpdates";

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
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.025}%2C${location.latitude - 0.015}%2C${location.longitude + 0.025}%2C${location.latitude + 0.015}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;
  const externalMapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=15/${location.latitude}/${location.longitude}`;
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
      <div className="map-frame">
        <iframe id="galerie-de-ruiter-location-map" title={t("locationMapTitle")} src={mapUrl} />
        <a href={externalMapUrl} target="_blank" rel="noreferrer">
          <Navigation size={15} /> {t("openInMap")}
        </a>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Clock3, MapPin, Navigation } from "lucide-react";
import { getStoreLocation, type StoreLocation } from "@/apis/backend_api";
import { useLanguage } from "@/context/LanguageContext";

export default function LocationPage() {
  const [location, setLocation] = useState<StoreLocation>();
  const { t } = useLanguage();
  useEffect(() => {
    getStoreLocation()
      .then(setLocation)
      .catch(() => undefined);
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
          See the current collection in person, meet the owner and take your
          time with the objects.
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
        <iframe id="galerie-de-ruiter-location-map" title="Galerie de Ruiter location map" src={mapUrl} />
        <a href={externalMapUrl} target="_blank" rel="noreferrer">
          <Navigation size={15} /> Open in map
        </a>
      </div>
    </section>
  );
}

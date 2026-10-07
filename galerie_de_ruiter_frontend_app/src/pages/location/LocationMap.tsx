import { Navigation } from "lucide-react";
import type { StoreLocation } from "@/apis/backend_api";

type Props = { location: StoreLocation; title: string; linkText: string };

export function LocationMap({ location, title, linkText }: Props) {
  const { latitude, longitude } = location;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.025}%2C${latitude - 0.015}%2C${longitude + 0.025}%2C${latitude + 0.015}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const externalUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  return <div className="map-frame">
    <iframe id="galerie-de-ruiter-location-map" title={title} src={mapUrl} />
    <a href={externalUrl} target="_blank" rel="noreferrer"><Navigation size={15} /> {linkText}</a>
  </div>;
}

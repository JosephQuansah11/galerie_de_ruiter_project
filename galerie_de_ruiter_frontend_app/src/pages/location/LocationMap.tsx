import { Navigation } from "lucide-react";
import type { StoreLocation } from "@/apis/backend_api";
import { googleMapsEmbedUrl, googleMapsLink } from "@/services/googleMaps";

type Props = { location: StoreLocation; title: string; linkText: string };

/**
 * The gallery's place on Google Maps.
 *
 * The frame uses the Embed API when the build carries a Maps key, and Google's classic embed when
 * it does not - a keyless frame still shows the street and the pin, which is the point of the
 * panel. The link is always there as well, so a visitor can open the full map. It loads lazily
 * because it sits below the address on a phone.
 */
export function LocationMap({ location, title, linkText }: Props) {
  return <div className="map-frame">
    <iframe id="galerie-de-ruiter-location-map" title={title} src={googleMapsEmbedUrl(location)}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    <a href={googleMapsLink(location)} target="_blank" rel="noreferrer"><Navigation size={15} /> {linkText}</a>
  </div>;
}

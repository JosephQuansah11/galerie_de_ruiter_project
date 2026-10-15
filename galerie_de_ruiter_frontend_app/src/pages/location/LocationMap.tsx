import { Navigation } from "lucide-react";
import type { StoreLocation } from "@/apis/backend_api";
import { googleMapsEmbedUrl, googleMapsLink } from "@/services/googleMaps";

type Props = { location: StoreLocation; title: string; linkText: string };

/**
 * The gallery's place on Google Maps. The frame only appears when the build carries a Maps key
 * (see src/services/googleMaps.ts); without one the address, the opening hours beside it and the
 * link below are still enough to find the pop-up, which is why the link is never conditional.
 * The frame loads lazily because it sits below the address on a phone.
 */
export function LocationMap({ location, title, linkText }: Props) {
  const embedUrl = googleMapsEmbedUrl(location);
  return <div className="map-frame">
    {embedUrl && <iframe id="galerie-de-ruiter-location-map" title={title} src={embedUrl}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
    <a href={googleMapsLink(location)} target="_blank" rel="noreferrer"><Navigation size={15} /> {linkText}</a>
  </div>;
}

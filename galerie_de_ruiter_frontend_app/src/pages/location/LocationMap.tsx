import { MapPin, Navigation } from "lucide-react";
import type { StoreLocation } from "@/apis/backend_api";
import { googleMapsEmbedUrl, googleMapsLink } from "@/services/googleMaps";

type Props = { location: StoreLocation; title: string; linkText: string };

/**
 * The gallery's place on Google Maps. The frame only appears when the build carries a Maps key
 * (see src/services/googleMaps.ts). Without one the panel would keep the frame's height and show
 * nothing at all - an empty card where a map should be - so it drops to a quieter shape that holds
 * the mark and the link: the pop-up is still one click away, which is why the link is never
 * conditional. The frame loads lazily because it sits below the address on a phone.
 */
export function LocationMap({ location, title, linkText }: Props) {
  const embedUrl = googleMapsEmbedUrl(location);
  const hasFrame = embedUrl !== undefined;
  return <div className={hasFrame ? "map-frame" : "map-frame map-frame-link-only"}>
    {embedUrl && <iframe id="galerie-de-ruiter-location-map" title={title} src={embedUrl}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
    {!hasFrame && <MapPin className="map-frame-mark" size={26} aria-hidden="true" />}
    <a href={googleMapsLink(location)} target="_blank" rel="noreferrer"><Navigation size={15} /> {linkText}</a>
  </div>;
}

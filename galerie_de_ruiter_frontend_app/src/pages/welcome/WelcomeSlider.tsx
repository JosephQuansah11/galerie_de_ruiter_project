import { Carousel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { resolveHomeImageUrl, type HomeImage } from "@/apis/home_api";

/**
 * Welcome page slider. It only appears once the gallery has published photographs, and
 * it slides through them automatically with controls for visitors who prefer to browse.
 */
export function WelcomeSlider({ images }: { images: HomeImage[] }) {
  const { t } = useTranslation();
  if (images.length === 0) return null;
  const multiple = images.length > 1;
  return <section className="welcome-slider" aria-label={t("welcomeImages")}>
    <Carousel interval={6000} indicators={multiple} controls={multiple} pause="hover">
      {images.map((image, index) => <Carousel.Item key={image.id}>
        <img className="welcome-slide-image" src={resolveHomeImageUrl(image.url)}
          alt={image.caption?.trim() || t("welcomeImages")}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "low"}
          decoding="async"
          width={1280} height={720} />
        {image.caption?.trim() ? <Carousel.Caption><p>{image.caption}</p></Carousel.Caption> : null}
      </Carousel.Item>)}
    </Carousel>
  </section>;
}

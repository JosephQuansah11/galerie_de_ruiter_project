package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.AboutImage;
import java.util.UUID;

/** Where an uploaded About page photograph can be reached, so the editor can insert it. */
public record AboutImageResponse(UUID id, String url) {
    public static AboutImageResponse from(AboutImage image) {
        return new AboutImageResponse(image.getId(), "/api/about/images/" + image.getId());
    }
}

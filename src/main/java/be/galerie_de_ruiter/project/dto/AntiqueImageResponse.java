package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.AntiqueImage;
import java.util.UUID;

/** Where a freshly uploaded antique photograph sits, so the editor can order it. */
public record AntiqueImageResponse(UUID id, String url) {
    public static AntiqueImageResponse from(AntiqueImage image, UUID antiqueId) {
        return new AntiqueImageResponse(image.getId(), "/api/antiques/" + antiqueId + "/image/" + image.getId());
    }
}

package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.HomeImage;
import java.util.UUID;

public record HomeImageResponse(UUID id, String url, String caption) {
    public static HomeImageResponse from(HomeImage image) {
        return new HomeImageResponse(
                image.getId(),
                "/api/home/images/" + image.getId(),
                image.getCaption());
    }
}

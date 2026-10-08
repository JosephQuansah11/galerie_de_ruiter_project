package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, DesignerResponse artist, String description, BigDecimal price,
                              String category, String modelUrl, String imageUrl, List<String> imageUrls,
                              List<SixViewImageResponse> sixViewImages) {

    public static AntiqueResponse from(Antique antique) {
        return new AntiqueResponse(
                antique.getId(),
                antique.getTitle(),
                DesignerResponse.from(antique.getArtist()),
                antique.getDescription(),
                antique.getPrice(),
                antique.getCategory() == null ? null : antique.getCategory().getName(),
                antique.getModelUrl(),
                imageUrls(antique).stream().findFirst().orElse(null),
                imageUrls(antique),
                parseSixViewImages(antique)
        );
    }

    private static List<String> imageUrls(Antique antique) {
        return antique.getImages().stream()
                .filter(image -> !isSixViewPosition(image.getPosition()))
                .map(AntiqueImage::getId)
                .map(imageId -> "/api/antiques/" + antique.getId() + "/image/" + imageId)
                .toList();
    }

    private static List<SixViewImageResponse> parseSixViewImages(Antique antique) {
        return antique.getImages().stream()
                .filter(image -> isSixViewPosition(image.getPosition()))
                .map(image -> new SixViewImageResponse(
                        image.getPosition(),
                        "/api/antiques/" + antique.getId() + "/image/" + image.getId()))
                .toList();
    }

    private static boolean isSixViewPosition(String position) {
        return List.of("front", "back", "left", "right", "top", "bottom").contains(position);
    }

    public record SixViewImageResponse(String position, String url) {
    }
}
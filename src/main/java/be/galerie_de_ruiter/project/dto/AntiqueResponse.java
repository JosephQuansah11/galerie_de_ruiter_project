package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, DesignerResponse artist, String description, BigDecimal price,
                              String category, String modelUrl, String imageUrl, List<String> imageUrls,
                              long viewCount, long likeCount, boolean sold) {

    public static AntiqueResponse from(Antique antique) {
        // One pass over the images, not two: the first photograph and the list are the same order.
        List<String> imageUrls = imageUrls(antique);
        return new AntiqueResponse(
                antique.getId(),
                antique.getTitle(),
                DesignerResponse.from(antique.getArtist()),
                antique.getDescription(),
                antique.getPrice(),
                antique.getCategory() == null ? null : antique.getCategory().getName(),
                antique.getModelUrl(),
                imageUrls.stream().findFirst().orElse(null),
                imageUrls,
                antique.getViewCount(),
                antique.getLikeCount(),
                antique.isSold()
        );
    }

    private static List<String> imageUrls(Antique antique) {
        return antique.getImages().stream()
                // The six-view scan positions never appear among a piece's photographs. The
                // reconstruction endpoints that wrote them are retired (see render.yaml), and this
                // filter stays so that any row an earlier build stored stays out of the gallery.
                .filter(image -> !AntiqueImage.isSixViewPosition(image.getPosition()))
                .sorted(AntiqueImage.BY_DISPLAY_ORDER)
                .map(AntiqueImage::getId)
                .map(imageId -> "/api/antiques/" + antique.getId() + "/image/" + imageId)
                .toList();
    }
}
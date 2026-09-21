package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, DesignerResponse artist, String description, BigDecimal price,
                              String category, String modelUrl, String imageUrl, List<String> imageUrls,
                              List<AntiqueReconstructionRequest.ReconstructionViewDto> sixViewImages) {

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
                .filter(image -> image.getDisplayOrder() == null)
                .map(AntiqueImage::getId)
                .map(imageId -> "/api/antiques/" + antique.getId() + "/image/" + imageId)
                .toList();
    }

    private static List<AntiqueReconstructionRequest.ReconstructionViewDto> parseSixViewImages(Antique antique) {
        return antique.getImages().stream().filter(image -> image.getDisplayOrder() != null)
                .map(image -> new AntiqueReconstructionRequest.ReconstructionViewDto(image.getDisplayOrder(), image.getData(), image.getContentType())).toList();
    }
}
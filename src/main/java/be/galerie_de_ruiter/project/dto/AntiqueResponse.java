package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, DesignerResponse artist, String description, BigDecimal price, String category, String modelUrl, String imageUrl, List<String> imageUrls, List<AntiqueReconstructionRequest.ReconstructionViewDto> sixViewImages) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

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
                parseSixViewImages(antique.getSixViewImagesJson())
        );
    }

    private static List<String> imageUrls(Antique antique) {
        return antique.getImages().stream()
                .map(AntiqueImage::getId)
                .map(imageId -> "/api/antiques/" + antique.getId() + "/image/" + imageId)
                .toList();
    }

    private static List<AntiqueReconstructionRequest.ReconstructionViewDto> parseSixViewImages(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return MAPPER.readValue(json, new TypeReference<List<AntiqueReconstructionRequest.ReconstructionViewDto>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
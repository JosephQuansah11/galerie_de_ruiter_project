package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;

import java.math.BigDecimal;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, DesignerResponse artist, String description, BigDecimal price, String category, String modelUrl, String imageUrl) {
    public static AntiqueResponse from(Antique antique) {
        return new AntiqueResponse(
                antique.getId(),
                antique.getTitle(),
                DesignerResponse.from(antique.getArtist()),
                antique.getDescription(),
                antique.getPrice(),
                antique.getCategory() == null ? null : antique.getCategory().getName(),
                antique.getModelUrl(),
                antique.getImageData() == null ? null : "/api/antiques/" + antique.getId() + "/image"
        );
    }
}
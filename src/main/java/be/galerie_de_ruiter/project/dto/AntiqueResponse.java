package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.Designer;

import java.math.BigDecimal;
import java.util.UUID;

public record AntiqueResponse(UUID id, String title, Designer artist, String description, BigDecimal price) {
    public static AntiqueResponse from(Antique antique) {
        return new AntiqueResponse(
                antique.getId(),
                antique.getTitle(),
                antique.getArtist(),
                antique.getDescription(),
                antique.getPrice()
        );
    }
}
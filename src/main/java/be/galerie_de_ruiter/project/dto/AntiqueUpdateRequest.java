package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import be.galerie_de_ruiter.project.validation.DescriptionLimits;
import be.galerie_de_ruiter.project.validation.MaxWords;
import java.math.BigDecimal;
import java.util.UUID;

public record AntiqueUpdateRequest(
        @NotBlank String title,
        @MaxWords(DescriptionLimits.MAX_WORDS) String description,
        // Optional: a null value leaves the existing price, artist or category in place.
        @DecimalMin("0.0") BigDecimal price,
        UUID artistId,
        UUID categoryId
) {
}

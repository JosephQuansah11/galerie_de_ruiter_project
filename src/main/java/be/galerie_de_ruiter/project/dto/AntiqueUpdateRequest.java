package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AntiqueUpdateRequest(
        @NotBlank String title,
        String description,
        @NotNull @DecimalMin("0.0") BigDecimal price
) {
}

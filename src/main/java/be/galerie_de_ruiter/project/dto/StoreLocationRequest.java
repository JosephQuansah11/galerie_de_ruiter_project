package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record StoreLocationRequest(
        @NotBlank String address,
        @NotBlank String openingHours,
        @NotNull BigDecimal latitude,
        @NotNull BigDecimal longitude) {
}
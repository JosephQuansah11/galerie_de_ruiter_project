package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CheckoutItemRequest(@NotNull UUID antiqueId, @Min(1) int quantity) {
}
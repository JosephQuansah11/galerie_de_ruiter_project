package be.galerie_de_ruiter.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CheckoutRequest(@NotEmpty List<@Valid CheckoutItemRequest> items) {
}
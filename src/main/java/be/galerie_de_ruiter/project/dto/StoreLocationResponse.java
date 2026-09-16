package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.StoreLocation;
import java.math.BigDecimal;
import java.util.UUID;

public record StoreLocationResponse(UUID id, String address, String openingHours, BigDecimal latitude, BigDecimal longitude) {
    public static StoreLocationResponse from(StoreLocation location) {
        return new StoreLocationResponse(location.getId(), location.getAddress(), location.getOpeningHours(), location.getLatitude(), location.getLongitude());
    }
}
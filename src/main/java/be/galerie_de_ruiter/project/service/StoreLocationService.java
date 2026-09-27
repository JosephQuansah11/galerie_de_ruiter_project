package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.StoreLocation;
import be.galerie_de_ruiter.project.dto.StoreLocationRequest;
import be.galerie_de_ruiter.project.repository.StoreLocationRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StoreLocationService {
    private final StoreLocationRepository locations;

    @Transactional
    public StoreLocation get() {
        return locations.findAll().stream().findFirst().orElseGet(() -> locations.save(new StoreLocation(
                "Antwerp, Belgium", "Thursday to Sunday, 11:00 to 18:00", new BigDecimal("51.2194"), new BigDecimal("4.4025"))));
    }

    public StoreLocation update(StoreLocationRequest request) {
        StoreLocation location = get();
        location.setAddress(request.address());
        location.setOpeningHours(request.openingHours());
        location.setLatitude(request.latitude());
        location.setLongitude(request.longitude());
        return locations.save(location);
    }
}
package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.StoreLocationRequest;
import be.galerie_de_ruiter.project.dto.StoreLocationResponse;
import be.galerie_de_ruiter.project.service.StoreLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class StoreLocationController {
    private final StoreLocationService locations;

    @GetMapping
    public StoreLocationResponse get() {
        return StoreLocationResponse.from(locations.get());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public StoreLocationResponse update(@Valid @RequestBody StoreLocationRequest request) {
        return StoreLocationResponse.from(locations.update(request));
    }
}
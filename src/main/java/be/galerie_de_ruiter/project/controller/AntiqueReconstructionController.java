package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueReconstructionRequest;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.service.AntiqueService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Persists the six-view reconstruction result so it is durable and visible to every user, not just the uploading browser session.
@RestController
@RequestMapping("/api/antiques/{id}/reconstruction")
@RequiredArgsConstructor
public class AntiqueReconstructionController {
    private final AntiqueService antiques;

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AntiqueResponse save(@PathVariable UUID id, @Valid @RequestBody AntiqueReconstructionRequest request) {
        return AntiqueResponse.from(antiques.saveReconstruction(id, request));
    }
}

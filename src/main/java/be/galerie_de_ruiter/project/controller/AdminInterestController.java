package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AdminInterestGroupResponse;
import be.galerie_de_ruiter.project.dto.InterestStatusRequest;
import be.galerie_de_ruiter.project.service.AntiqueInterestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** What visitors marked as interesting, with their names and email addresses. */
@RestController
@RequestMapping("/api/admin/interests")
@RequiredArgsConstructor
public class AdminInterestController {
    private final AntiqueInterestService interests;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminInterestGroupResponse> all() {
        return interests.all();
    }

    @PutMapping("/{antiqueId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> status(@PathVariable UUID antiqueId,
            @Valid @RequestBody InterestStatusRequest request) {
        interests.setStatus(antiqueId, request.status());
        return ResponseEntity.noContent().build();
    }
}

package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.service.AntiqueInterestService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The signed-in visitor's interest list. It is the visitor-facing side of the data the gallery
 * reads at {@code /api/admin/interests}.
 */
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {
    private final AntiqueInterestService interests;

    @GetMapping
    public List<AntiqueResponse> wishlist(@AuthenticationPrincipal Jwt jwt) {
        return interests.wishlist(jwt);
    }

    @PostMapping("/{antiqueId}")
    public ResponseEntity<Void> add(@PathVariable UUID antiqueId, @AuthenticationPrincipal Jwt jwt) {
        interests.add(jwt, antiqueId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{antiqueId}")
    public ResponseEntity<Void> remove(@PathVariable UUID antiqueId, @AuthenticationPrincipal Jwt jwt) {
        interests.remove(jwt, antiqueId);
        return ResponseEntity.noContent().build();
    }
}

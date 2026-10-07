package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.service.AntiqueService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/antiques")
public class AntiqueController {
	private final AntiqueService antiques;

	public AntiqueController(AntiqueService antiques) { this.antiques = antiques; }

	@GetMapping
	public List<AntiqueResponse> findAll() { return antiques.findAllResponses(); }

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public AntiqueResponse create(@Valid @RequestBody AntiqueRequest request, @AuthenticationPrincipal Jwt jwt) {
		return antiques.createResponse(request, jwt);
	}
}
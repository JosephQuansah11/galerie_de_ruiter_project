package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueRequest;
import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.dto.AntiqueBulkDeleteRequest;
import be.galerie_de_ruiter.project.dto.AntiqueBulkDeleteResponse;
import be.galerie_de_ruiter.project.dto.AntiqueSoldRequest;
import be.galerie_de_ruiter.project.dto.AntiqueUpdateRequest;
import be.galerie_de_ruiter.project.service.AntiqueService;
import be.galerie_de_ruiter.project.service.ContentWebSocketHandler;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

@RestController
@RequestMapping("/api/antiques")
public class AntiqueController {
	private final AntiqueService antiques;
	private final ContentWebSocketHandler contentUpdates;

	public AntiqueController(AntiqueService antiques, ContentWebSocketHandler contentUpdates) {
		this.antiques = antiques;
		this.contentUpdates = contentUpdates;
	}

	@GetMapping
	public List<AntiqueResponse> findAll() { return antiques.findAllResponses(); }

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public AntiqueResponse create(@Valid @RequestBody AntiqueRequest request, @AuthenticationPrincipal Jwt jwt) {
		AntiqueResponse created = antiques.createResponse(request, jwt);
		contentUpdates.broadcast("antiques");
		return created;
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public AntiqueResponse update(@PathVariable UUID id, @Valid @RequestBody AntiqueUpdateRequest request) {
		AntiqueResponse updated = antiques.update(id, request);
		contentUpdates.broadcast("antiques");
		return updated;
	}

	/**
	 * Records that the client and the gallery have agreed on payment: the piece is sold and no
	 * longer offered for purchase. Sending {@code {"sold": false}} puts it back on offer.
	 */
	@PutMapping("/{id}/sold")
	@PreAuthorize("hasRole('ADMIN')")
	public AntiqueResponse setSold(@PathVariable UUID id, @Valid @RequestBody AntiqueSoldRequest request) {
		AntiqueResponse updated = antiques.setSold(id, request.sold());
		contentUpdates.broadcast("antiques");
		return updated;
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		antiques.delete(id);
		contentUpdates.broadcast("antiques");
		return ResponseEntity.noContent().build();
	}

	/**
	 * Removes every selected piece in one transaction. The answer names any id that was already
	 * gone, so a stale inventory tab does not stop the pieces that are still there from going.
	 */
	@PostMapping("/batch-delete")
	@PreAuthorize("hasRole('ADMIN')")
	public AntiqueBulkDeleteResponse deleteMany(@Valid @RequestBody AntiqueBulkDeleteRequest request) {
		AntiqueBulkDeleteResponse result = antiques.deleteMany(request.ids());
		contentUpdates.broadcast("antiques");
		return result;
	}
}
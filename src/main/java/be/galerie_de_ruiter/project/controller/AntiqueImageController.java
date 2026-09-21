package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/antiques/{id}/image")
@RequiredArgsConstructor
public class AntiqueImageController {
    private final AntiqueRepository antiques;
    private final AntiqueImageRepository images;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        return images.findFirstByAntiqueIdOrderByDisplayOrderAsc(id)
                .map(this::imageResponse)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{imageId}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> getById(@PathVariable UUID id, @PathVariable UUID imageId) {
        return images.findById(imageId)
                .filter(image -> image.getAntique().getId().equals(id))
                .map(this::imageResponse)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> upload(@PathVariable UUID id, @RequestPart("image") MultipartFile image) throws java.io.IOException {
        if (image.isEmpty() || image.getSize() > 8 * 1024 * 1024L || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().build();
        }
        Antique antique = antiques.findById(id).orElseThrow();
        images.save(new AntiqueImage(antique, String.valueOf(images.countByAntiqueId(id)), image.getBytes(), image.getContentType()));
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<byte[]> imageResponse(AntiqueImage image) {
        MediaType type = MediaType.parseMediaType(image.getContentType());
        return ResponseEntity.ok().contentType(type).body(image.getData());
    }
}
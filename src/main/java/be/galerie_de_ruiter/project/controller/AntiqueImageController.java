package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        Antique antique = antiques.findById(id).orElseThrow();
        if (antique.getImageData() == null) return ResponseEntity.notFound().build();
        MediaType type = MediaType.parseMediaType(antique.getImageContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : antique.getImageContentType());
        return ResponseEntity.ok().contentType(type).body(antique.getImageData());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> upload(@PathVariable UUID id, @RequestPart("image") MultipartFile image) throws java.io.IOException {
        if (image.isEmpty() || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().build();
        }
        Antique antique = antiques.findById(id).orElseThrow();
        antique.setImageData(image.getBytes());
        antique.setImageContentType(image.getContentType());
        antiques.save(antique);
        return ResponseEntity.noContent().build();
    }
}
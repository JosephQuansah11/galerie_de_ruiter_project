package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.AboutImage;
import be.galerie_de_ruiter.project.dto.AboutImageResponse;
import be.galerie_de_ruiter.project.repository.AboutImageRepository;
import be.galerie_de_ruiter.project.service.ImageFormats;
import be.galerie_de_ruiter.project.service.ImageUploads;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Photographs for the About page. The gallery uploads them from the story editor and every
 * visitor can read them, exactly like the welcome slider images.
 */
@RestController
@RequestMapping("/api/about/images")
@RequiredArgsConstructor
public class AboutImageController {
    private final AboutImageRepository images;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public AboutImageResponse add(@RequestPart("image") MultipartFile file) throws IOException {
        var prepared = ImageUploads.prepare(file);
        return AboutImageResponse.from(images.save(new AboutImage(prepared.bytes(), prepared.contentType())));
    }

    @GetMapping("/{imageId}")
    @Transactional
    public ResponseEntity<byte[]> image(@PathVariable UUID imageId) {
        return images.findById(imageId)
                .map(image -> {
                    // Existing rows are converted on their first read, and kept as WebP afterwards.
                    if (!ImageFormats.WEBP.equals(image.getContentType())) {
                        byte[] webp = ImageFormats.toWebp(image.getData());
                        if (webp != null) {
                            image.setData(webp);
                            image.setContentType(ImageFormats.WEBP);
                            images.save(image);
                        }
                    }
                    return ResponseEntity.ok()
                            // Same as the welcome slider: the id names immutable bytes, so a long
                            // cache is what keeps the About page from re-reading them every five
                            // minutes.
                            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                            .contentType(MediaType.parseMediaType(image.getContentType()))
                            .contentLength(image.getData().length)
                            .body(image.getData());
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

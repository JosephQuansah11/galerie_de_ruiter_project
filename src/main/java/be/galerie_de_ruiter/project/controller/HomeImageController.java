package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.HomeImage;
import be.galerie_de_ruiter.project.dto.HomeImageResponse;
import be.galerie_de_ruiter.project.repository.HomeImageRepository;
import be.galerie_de_ruiter.project.service.ImageUploads;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Photographs for the welcome page slider. The gallery uploads them, every visitor can
 * read them, and they are served straight from the database as binary.
 */
@RestController
@RequestMapping("/api/home/images")
@RequiredArgsConstructor
public class HomeImageController {
    private final HomeImageRepository images;

    @GetMapping
    public List<HomeImageResponse> list() {
        return images.findAllByOrderByDisplayOrderAsc().stream().map(HomeImageResponse::from).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public HomeImageResponse add(@RequestPart("image") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) throws IOException {
        var prepared = ImageUploads.prepare(file);
        HomeImage image = new HomeImage((int) images.count(), prepared.bytes(), prepared.contentType(),
                caption == null || caption.isBlank() ? null : caption.trim());
        return HomeImageResponse.from(images.save(image));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remove(@PathVariable UUID imageId) {
        if (!images.existsById(imageId)) {
            return ResponseEntity.notFound().build();
        }
        images.deleteById(imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> image(@PathVariable UUID imageId) {
        return images.findById(imageId)
                .map(image -> ResponseEntity.ok()
                        // An upload gets a new id and its bytes never change, so a visitor who has
                        // seen this photograph may keep it. Five minutes made every slider visit
                        // fetch it again and put the bytes through the database a second time.
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .contentLength(image.getData().length)
                        .body(image.getData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

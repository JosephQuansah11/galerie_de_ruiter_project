package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.dto.AntiqueImageOrderRequest;
import be.galerie_de_ruiter.project.dto.AntiqueImageResponse;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.service.ImageStorage;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/antiques/{id}/image")
@RequiredArgsConstructor
public class AntiqueImageController {
    private final AntiqueRepository antiques;
    private final AntiqueImageRepository images;
    /** The bucket, for photographs that have been copied out; inert until a key exists. */
    private final ImageStorage storage;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        return orderedImages(id).stream()
                .findFirst()
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
    public AntiqueImageResponse upload(@PathVariable UUID id, @RequestPart("image") MultipartFile image) throws java.io.IOException {
        if (image.isEmpty() || image.getSize() > 8 * 1024 * 1024L || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image under 8 MB.");
        }
        Antique antique = antiques.findById(id).orElseThrow();
        // A new photograph lands at the end of the gallery's order; the admin can move it after.
        String order = String.valueOf(images.countByAntiqueId(id));
        AntiqueImage saved = images.save(new AntiqueImage(antique, order, order, image.getBytes(), image.getContentType()));
        return AntiqueImageResponse.from(saved, id);
    }

    /**
     * Stores the gallery's preferred order for a piece's photographs. The ids are given the
     * positions 0..n-1 in the order they are listed, so the main image is whichever the gallery
     * put first. Ids that do not belong to the piece are ignored.
     */
    @PutMapping("/order")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> reorder(@PathVariable UUID id, @RequestBody AntiqueImageOrderRequest request) {
        List<UUID> imageIds = request.imageIds() == null ? List.of() : request.imageIds();
        Map<UUID, AntiqueImage> byId = images.findAllByAntiqueId(id).stream()
                .collect(Collectors.toMap(AntiqueImage::getId, image -> image));
        for (int index = 0; index < imageIds.size(); index++) {
            AntiqueImage image = byId.get(imageIds.get(index));
            if (image != null) image.setDisplayOrder(String.valueOf(index));
        }
        images.saveAll(byId.values());
        return ResponseEntity.noContent().build();
    }

    /**
     * Removes one photograph from a piece. The gallery can correct a wrong picture without
     * deleting and recreating the whole antique; the remaining photographs are untouched.
     */
    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable UUID id, @PathVariable UUID imageId) {
        return images.findById(imageId)
                .filter(image -> image.getAntique().getId().equals(id))
                .map(image -> {
                    images.delete(image);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** The piece's photographs in the gallery's order, six-view scans excluded. */
    private List<AntiqueImage> orderedImages(UUID antiqueId) {
        return images.findAllByAntiqueId(antiqueId).stream()
                .filter(image -> !AntiqueImage.isSixViewPosition(image.getPosition()))
                .sorted(AntiqueImage.BY_DISPLAY_ORDER)
                .toList();
    }

    /**
     * A photograph is immutable: its id names these bytes and nothing else, and a new picture is a
     * new row. The browser - and any cache in front of the API - can therefore keep it for a year
     * without asking again, which is what makes a long catalogue cheap to browse after the first
     * visit instead of re-downloading every picture every time.
     *
     * <p>The bytes come from the bucket when the row has been copied out, and from the row itself
     * otherwise - so a half-finished copy is a working gallery rather than a broken one. A row that
     * has a key but whose object cannot be read falls back to its own bytes for the same reason:
     * storage having a bad minute must not make a picture disappear from the shop window.</p>
     */
    private ResponseEntity<byte[]> imageResponse(AntiqueImage image) {
        MediaType type = MediaType.parseMediaType(image.getContentType());
        byte[] bytes = image.getStorageKey() == null
                ? image.getData()
                : storage.get(image.getStorageKey()).orElseGet(image::getData);
        return ResponseEntity.ok()
                .contentType(type)
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL,
                        "public, max-age=31536000, immutable")
                .body(bytes);
    }
}
package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.Antique;
import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.dto.AntiqueImageOrderRequest;
import be.galerie_de_ruiter.project.dto.AntiqueImageResponse;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;
import be.galerie_de_ruiter.project.repository.AntiqueRepository;
import be.galerie_de_ruiter.project.service.ImageFormats;
import be.galerie_de_ruiter.project.service.ImageStorage;
import be.galerie_de_ruiter.project.service.StoredObjectCleanup;
import be.galerie_de_ruiter.project.service.ThumbnailService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
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
    /** The small copy that grids load instead of the original. */
    private final ThumbnailService thumbnails;

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

    /**
     * The small copy a grid draws instead of the original - about forty kilobytes against up to six
     * megabytes.
     *
     * <p>Generated on the first request and kept: from the row while the picture still lives there,
     * from the bucket once it has been copied out. That means the hundred photographs already in the
     * gallery need no separate job - browsing the catalogue fills them in - and each one is paid for
     * exactly once.</p>
     */
    @GetMapping("/{imageId}/thumbnail")
    @Transactional
    public ResponseEntity<byte[]> thumbnail(@PathVariable UUID id, @PathVariable UUID imageId) {
        return images.findThumbnail(imageId, id)
                .map(this::imageBytes)
                .orElseGet(() -> images.findById(imageId)
                        .filter(image -> image.getAntique().getId().equals(id))
                        .map(this::thumbnailResponse)
                        .orElseGet(() -> ResponseEntity.notFound().build()));
    }

    /**
     * The 800-pixel copy for a phone. It is generated on the first request and kept, like the
     * thumbnail, so a catalogue that predates responsive images fills itself in as it is browsed.
     */
    @GetMapping("/{imageId}/medium")
    @Transactional
    public ResponseEntity<byte[]> medium(@PathVariable UUID id, @PathVariable UUID imageId) {
        return images.findMedium(imageId, id)
                .map(this::imageBytes)
                .orElseGet(() -> images.findById(imageId)
                        .filter(image -> image.getAntique().getId().equals(id))
                        .map(image -> variantResponse(image, null,
                                ThumbnailService.MEDIUM_EDGE, image::setMedium))
                        .orElseGet(() -> ResponseEntity.notFound().build()));
    }

    /** The 1600-pixel copy for a desktop or a high-density screen. */
    @GetMapping("/{imageId}/large")
    @Transactional
    public ResponseEntity<byte[]> large(@PathVariable UUID id, @PathVariable UUID imageId) {
        return images.findLarge(imageId, id)
                .map(this::imageBytes)
                .orElseGet(() -> images.findById(imageId)
                        .filter(image -> image.getAntique().getId().equals(id))
                        .map(image -> variantResponse(image, null,
                                ThumbnailService.LARGE_EDGE, image::setLarge))
                        .orElseGet(() -> ResponseEntity.notFound().build()));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AntiqueImageResponse upload(@PathVariable UUID id, @RequestPart("image") MultipartFile image) throws java.io.IOException {
        if (image.isEmpty() || image.getSize() > 8 * 1024 * 1024L || image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image under 8 MB.");
        }
        Antique antique = antiques.findById(id).orElseThrow();
        // Every photograph is stored as WebP, whoever uploads it: the browser converts before it
        // sends, and this conversion is the safety net for an older client or a direct API call.
        // A picture the encoder cannot read (a camera's HEIC, say) is kept as it arrived rather
        // than refused - a picture the gallery has is better than no picture at all.
        byte[] uploaded = image.getBytes();
        String uploadedType = ImageFormats.sniff(uploaded);
        // The browser already sends WebP; re-encoding that would be a second lossy pass for no
        // gain. Anything else (an older client, a direct API call) is converted here.
        byte[] converted = ImageFormats.WEBP.equals(uploadedType) ? null : ImageFormats.toWebp(uploaded);
        byte[] bytes = converted != null ? converted : uploaded;
        String contentType = converted != null ? ImageFormats.WEBP
                : uploadedType != null ? uploadedType : image.getContentType();
        // A new photograph lands at the end of the gallery's order; the admin can move it after.
        String order = String.valueOf(images.countByAntiqueId(id));
        AntiqueImage photo = new AntiqueImage(antique, order, order, bytes, contentType);
        // Made once, now, while the bytes are already in hand: a gallery that uploads a picture
        // should not be the reason a visitor downloads six megabytes for a tile, a phone download
        // a desktop original, or a desktop download a camera file.
        photo.setThumbnail(thumbnails.create(bytes));
        photo.setMedium(thumbnails.create(bytes, ThumbnailService.MEDIUM_EDGE));
        photo.setLarge(thumbnails.create(bytes, ThumbnailService.LARGE_EDGE));
        AntiqueImage saved = images.save(photo);
        // The photograph goes to the bucket, and the row keeps only its key - the bytes never
        // belong in the database once there is somewhere better for them. The id has to exist
        // first, which is why this happens after the save. If the bucket is not configured, or the
        // object cannot be confirmed there, the row keeps its copy and nothing is lost.
        if (storage.isEnabled()) {
            String key = storage.put(id, saved.getId(), bytes, contentType);
            if (storage.exists(key)) {
                saved.setStorageKey(key);
                saved.setImageData(null);
                saved = images.save(saved);
            }
        }
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
                    String storedKey = image.getStorageKey();
                    images.delete(image);
                    StoredObjectCleanup.afterCommit(storage,
                            storedKey == null ? List.of() : List.of(storedKey));
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

    /** One photograph's small copy; public because the catalogue's tiles are public. */
    private ResponseEntity<byte[]> thumbnailResponse(AntiqueImage image) {
        byte[] small = image.getThumbnail();
        if (small == null) {
            small = thumbnails.create(originalBytes(image));
            if (small != null) {
                image.setThumbnail(small);
                images.save(image);
            }
        }
        if (small == null) return ResponseEntity.notFound().build();
        return imageBytes(small);
    }

    /**
     * One of the larger copies, generated on the first request and kept on the row. If it cannot be
     * made, the original is served instead: a slow or missing encoder must not leave a hole in the
     * page, and an original is still a usable answer.
     */
    private ResponseEntity<byte[]> variantResponse(AntiqueImage image, byte[] existing, int maxEdge,
            Consumer<byte[]> keep) {
        byte[] variant = existing;
        if (variant == null) {
            variant = thumbnails.create(originalBytes(image), maxEdge);
            if (variant != null) {
                keep.accept(variant);
                images.save(image);
            }
        }
        return variant == null ? imageResponse(image) : imageBytes(variant);
    }

    /** The original bytes, from the bucket when the row has been copied out and from the row otherwise. */
    private byte[] originalBytes(AntiqueImage image) {
        return image.getStorageKey() == null
                ? image.getData()
                : storage.get(image.getStorageKey()).orElseGet(image::getData);
    }

    /**
     * Serves bytes with the type their signature proves. Variants are WebP now but rows created
     * before the encoder was added still hold JPEG copies, and a row never records which type its
     * variant is - sniffing it here is what keeps the header true for both.
     */
    private ResponseEntity<byte[]> imageBytes(byte[] bytes) {
        String contentType = ImageFormats.sniff(bytes);
        return ResponseEntity.ok()
                .contentType(contentType == null
                        ? MediaType.IMAGE_JPEG
                        : MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(bytes);
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
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(originalBytes(image));
    }
}
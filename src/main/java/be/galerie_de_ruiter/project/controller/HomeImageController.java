package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.HomeImage;
import be.galerie_de_ruiter.project.dto.HomeImageResponse;
import be.galerie_de_ruiter.project.repository.HomeImageRepository;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

/**
 * Photographs for the welcome page slider. The gallery uploads them, every visitor can
 * read them, and they are served straight from the database as binary.
 */
@RestController
@RequestMapping("/api/home/images")
@RequiredArgsConstructor
public class HomeImageController {
    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xff, (byte) 0xd8, (byte) 0xff};

    private final HomeImageRepository images;

    @GetMapping
    public List<HomeImageResponse> list() {
        return images.findAllByOrderByDisplayOrderAsc().stream().map(HomeImageResponse::from).toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public HomeImageResponse add(@RequestPart("image") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) throws IOException {
        var prepared = prepare(file);
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
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .contentLength(image.getData().length)
                        .body(image.getData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static PreparedImage prepare(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image is required.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Images must be 10 MB or smaller.");
        }
        byte[] bytes = file.getBytes();
        return new PreparedImage(bytes, verifiedType(bytes, file.getContentType()));
    }

    private static String verifiedType(byte[] bytes, String declaredType) {
        if (startsWith(bytes, PNG_SIGNATURE)) return MediaType.IMAGE_PNG_VALUE;
        if (startsWith(bytes, JPEG_SIGNATURE)) return MediaType.IMAGE_JPEG_VALUE;
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Only PNG, JPEG and WebP images are supported.");
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (bytes[index] != signature[index]) return false;
        }
        return true;
    }

    private record PreparedImage(byte[] bytes, String contentType) {
    }
}

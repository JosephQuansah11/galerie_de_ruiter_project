package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.service.AntiqueService;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/antiques/{id}/model")
@RequiredArgsConstructor
public class AntiqueModelController {
    private static final byte[] GLB_MAGIC = "glTF".getBytes(StandardCharsets.US_ASCII);

    private final AntiqueService antiques;

    /**
     * Largest accepted GLB. It is configurable because a {@code byte[]} model costs roughly
     * three times its size in memory while it is parsed, validated and stored, and the
     * production instance is much smaller than a developer machine. The same value drives
     * {@code spring.servlet.multipart.max-file-size}, so development and production reject
     * the same files.
     */
    @Value("${app.models.max-size-mb:250}")
    private long maxModelSizeMb;

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public AntiqueResponse upload(@PathVariable UUID id, @RequestPart("model") MultipartFile model) throws IOException {
        if (model.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A GLB model is required.");
        }
        if (model.getSize() > maxModelBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "GLB models must be %d MB or smaller.".formatted(maxModelSizeMb));
        }
        if (model.getOriginalFilename() == null || !model.getOriginalFilename().toLowerCase().endsWith(".glb")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only .glb models are supported.");
        }

        byte[] bytes = model.getBytes();
        validateGlb(bytes);
        return antiques.saveModel(id, bytes);
    }

    @GetMapping(produces = "model/gltf-binary")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        byte[] model = antiques.getModel(id);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("model/gltf-binary"))
                .contentLength(model.length)
                // Models are large, so a visitor who reopens the page reuses the downloaded
                // copy instead of pulling the whole file again in production.
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(model);
    }

    private long maxModelBytes() {
        return maxModelSizeMb * 1024L * 1024L;
    }

    private void validateGlb(byte[] bytes) {
        if (bytes.length < 12
                || !java.util.Arrays.equals(java.util.Arrays.copyOf(bytes, GLB_MAGIC.length), GLB_MAGIC)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid GLB model.");
        }
        ByteBuffer header = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        header.position(4);
        int version = header.getInt();
        long declaredLength = Integer.toUnsignedLong(header.getInt());
        if (version != 2 || declaredLength != bytes.length) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid GLB 2.0 model.");
        }
    }
}

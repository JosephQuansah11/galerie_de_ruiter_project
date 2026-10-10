package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.dto.AntiqueResponse;
import be.galerie_de_ruiter.project.service.AntiqueService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
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
    private static final MediaType GLB_MEDIA_TYPE = MediaType.parseMediaType("model/gltf-binary");

    private final AntiqueService antiques;

    /**
     * Largest accepted GLB. The upload is streamed straight to the gallery disk instead of
     * being buffered in the heap, so the ceiling is about the storage and the transfer, not
     * the instance memory. The same value drives {@code spring.servlet.multipart.max-file-size},
     * so development and production reject the same files.
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

        validateGlb(model);
        return antiques.saveModel(id, model);
    }

    @GetMapping(produces = "model/gltf-binary")
    public ResponseEntity<Resource> get(@PathVariable UUID id) {
        var model = antiques.readModel(id).orElse(null);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(GLB_MEDIA_TYPE)
                .contentLength(model.size())
                // Models are large, so a visitor who reopens the page reuses the downloaded
                // copy instead of pulling the whole file again in production.
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(model.content());
    }

    private long maxModelBytes() {
        return maxModelSizeMb * 1024L * 1024L;
    }

    /**
     * Checks the GLB header without reading the whole file: only the first twelve bytes ever
     * reach the JVM heap, and the length the file declares must match what the client sent.
     */
    private void validateGlb(MultipartFile model) throws IOException {
        byte[] header = readHeader(model);
        boolean magic = Arrays.equals(Arrays.copyOf(header, GLB_MAGIC.length), GLB_MAGIC);
        int version = ByteBuffer.wrap(header, 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
        long declaredLength = Integer.toUnsignedLong(
                ByteBuffer.wrap(header, 8, 4).order(ByteOrder.LITTLE_ENDIAN).getInt());
        if (!magic || version != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid GLB model.");
        }
        if (declaredLength != model.getSize()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid GLB 2.0 model.");
        }
    }

    private byte[] readHeader(MultipartFile model) throws IOException {
        byte[] header = new byte[12];
        try (InputStream content = model.getInputStream()) {
            if (content.readNBytes(header, 0, header.length) < header.length) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid GLB model.");
            }
        }
        return header;
    }
}

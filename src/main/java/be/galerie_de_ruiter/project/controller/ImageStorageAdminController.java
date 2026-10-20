package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.service.ImageFormatMigration;
import be.galerie_de_ruiter.project.service.ImageFormats;
import be.galerie_de_ruiter.project.service.ImageStorage;
import be.galerie_de_ruiter.project.service.ImageStorageMigration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * The switch that moves the gallery's photographs out of the database and into the bucket.
 *
 * <p>Admin only, and deliberately not part of startup: the copy reads and writes tens of megabytes,
 * so it should happen when the gallery decides it should, and be looked at afterwards. Running it
 * twice is harmless - it only looks at rows that have no key yet.</p>
 */
@RestController
@RequestMapping("/api/admin/images")
@RequiredArgsConstructor
public class ImageStorageAdminController {
    private final ImageStorage storage;
    private final ImageStorageMigration migration;
    private final ImageFormatMigration formats;

    /** Whether the destination is configured at all. False means the copy would refuse to start. */
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Boolean> status() {
        return Map.of("enabled", storage.isEnabled());
    }

    /**
     * Copies every photograph that is still held in its row, verifying each one byte for byte before
     * it records the key. Returns what it did: {@code remaining} is zero only when every picture is
     * in the bucket, and {@code failed} is empty only when none was left behind.
     */
    @PostMapping("/migrate-to-storage")
    @PreAuthorize("hasRole('ADMIN')")
    public ImageStorageMigration.Report migrateToStorage() {
        return migration.copyAll();
    }

    /**
     * Frees the copy of every photograph that is already in the bucket. Without {@code confirm=true}
     * it only counts and reports, which is the way to see the size of the saving before making it.
     * A photograph whose object cannot be found in the bucket keeps its bytes and is reported.
     */
    @PostMapping("/release-stored-bytes")
    @PreAuthorize("hasRole('ADMIN')")
    public ImageStorageMigration.Release releaseStoredBytes(
            @RequestParam(name = "confirm", defaultValue = "false") boolean confirm) {
        return migration.releaseStoredBytes(confirm);
    }

    /**
     * How many photographs are WebP and whether this build can encode it at all. The admin screen
     * reads this before offering the conversion: a build without the native encoder can still serve
     * the gallery, but it cannot rewrite a photograph.
     */
    @GetMapping("/format-status")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> formatStatus() {
        ImageFormatMigration.Report status = formats.status();
        return Map.of(
                "webpEncoder", ImageFormats.canWriteWebp(),
                "total", status.total(),
                "webp", status.webp(),
                "candidates", status.candidates());
    }

    /**
     * Rewrites every photograph that is not WebP yet, and its 400/800/1600-pixel copies. Without
     * {@code confirm=true} it only reports what is left to do - that is how the admin sees the size
     * of the job before starting it. Each confirmed call converts at most {@code limit} pictures,
     * so one request stays shorter than a proxy's timeout; the answer's {@code candidates} says
     * whether another call is needed.
     */
    @PostMapping("/convert-to-webp")
    @PreAuthorize("hasRole('ADMIN')")
    public ImageFormatMigration.Report convertToWebp(
            @RequestParam(name = "confirm", defaultValue = "false") boolean confirm,
            @RequestParam(name = "limit", defaultValue = "25") int limit) {
        if (!ImageFormats.canWriteWebp()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "This build has no WebP encoder, so the photographs cannot be converted.");
        }
        return formats.convertAll(confirm, Math.max(1, Math.min(limit, 100)));
    }
}

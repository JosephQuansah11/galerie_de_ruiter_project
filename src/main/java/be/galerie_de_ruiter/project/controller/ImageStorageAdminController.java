package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.service.ImageStorage;
import be.galerie_de_ruiter.project.service.ImageStorageMigration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

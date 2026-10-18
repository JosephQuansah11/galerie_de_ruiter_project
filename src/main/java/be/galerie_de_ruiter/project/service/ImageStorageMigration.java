package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Copies the photographs that still live in their database row into the bucket, one at a time.
 *
 * <p>The order of operations is what makes this safe to interrupt: upload first, then <em>read the
 * object back</em> and compare it, byte for byte, with what the row holds, and only then write the
 * key onto the row. A picture that fails any step keeps no key, so it stays readable from the row
 * and the next run tries it again. Nothing here deletes anything - not a row, not a byte - so the
 * worst outcome of a failed run is "the same as before".</p>
 *
 * <p>Each picture's key is saved in its own transaction (one save per row), so a long run never holds
 * a database transaction open while it talks to storage.</p>
 */
@Service
public class ImageStorageMigration {
    /** One photograph that was copied and verified. */
    public record Copied(UUID imageId, String key, long bytes) {
    }

    /** One photograph that was left alone, with the reason a person can act on. */
    public record Failed(UUID imageId, String reason) {
    }

    /**
     * What one run did. {@code remaining} is zero only when every photograph is in the bucket.
     */
    public record Report(int remaining, List<Copied> copied, List<Failed> failed) {
        public boolean complete() {
            return failed.isEmpty() && remaining == copied.size();
        }
    }

    private final AntiqueImageRepository images;
    private final ImageStorage storage;

    public ImageStorageMigration(AntiqueImageRepository images, ImageStorage storage) {
        this.images = images;
        this.storage = storage;
    }

    /**
     * Copies every photograph still held in its row. Safe to run repeatedly: a picture that is
     * already in the bucket no longer has a missing key and is not looked at again.
     */
    public Report copyAll() {
        if (!storage.isEnabled()) {
            throw new IllegalStateException(
                    "Object storage is not configured, so there is nothing to copy to.");
        }
        List<UUID> pending = images.findIdsNotInStorage();
        List<Copied> copied = new ArrayList<>();
        List<Failed> failed = new ArrayList<>();

        for (UUID imageId : pending) {
            AntiqueImage image = images.findById(imageId).orElse(null);
            if (image == null) continue;
            try {
                byte[] original = image.getData();
                if (original == null || original.length == 0) {
                    failed.add(new Failed(imageId, "the row holds no bytes"));
                    continue;
                }
                UUID pieceId = image.getAntique().getId();
                String key = storage.put(pieceId, imageId, original, image.getContentType());

                byte[] stored = storage.get(key).orElse(null);
                if (stored == null) {
                    failed.add(new Failed(imageId, "the object was uploaded but could not be read back"));
                    continue;
                }
                if (!Arrays.equals(original, stored)) {
                    failed.add(new Failed(imageId,
                            "the object differs from the row (" + stored.length + " bytes stored, "
                                    + original.length + " in the row)"));
                    continue;
                }

                image.setStorageKey(key);
                images.save(image);
                copied.add(new Copied(imageId, key, original.length));
            } catch (RuntimeException failedHere) {
                // One picture failing must not stop the run: keep the key off it and go on.
                failed.add(new Failed(imageId,
                        failedHere.getClass().getSimpleName() + ": " + failedHere.getMessage()));
            }
        }
        return new Report(pending.size(), copied, failed);
    }

    /**
     * What a release run did - or, in a dry run, what it would do.
     */
    public record Release(boolean dryRun, int candidates, long bytes, int released, List<Failed> failed) {
    }

    /**
     * Frees the database copy of every photograph that is safely in the bucket.
     *
     * <p>This is the one irreversible step in the migration, so it is deliberately awkward to
     * trigger: without {@code confirm} it only counts and reports, and even with it a row is freed
     * only when its object is confirmed present under its key. A photograph whose object cannot be
     * found keeps its bytes and is listed instead - the database is the last copy, not the first
     * thing to throw away.</p>
     */
    public Release releaseStoredBytes(boolean confirm) {
        if (!storage.isEnabled()) {
            throw new IllegalStateException(
                    "Object storage is not configured, so there is nothing to release to.");
        }
        List<AntiqueImageRepository.StoredRow> candidates = images.findStoredWithBytes();
        long bytes = candidates.stream().mapToLong(row -> row.getBytes() == null ? 0 : row.getBytes()).sum();
        int released = 0;
        List<Failed> failed = new ArrayList<>();

        for (AntiqueImageRepository.StoredRow row : candidates) {
            if (!storage.exists(row.getStorageKey())) {
                failed.add(new Failed(row.getId(), "the object is not in the bucket, so the row keeps its copy"));
                continue;
            }
            if (!confirm) continue;
            AntiqueImage image = images.findById(row.getId()).orElse(null);
            if (image == null) continue;
            image.setImageData(null);
            images.save(image);
            released++;
        }

        return new Release(!confirm, candidates.size(), bytes, released, failed);
    }
}

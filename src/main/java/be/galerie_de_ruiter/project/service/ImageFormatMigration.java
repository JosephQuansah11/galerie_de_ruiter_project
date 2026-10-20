package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.AntiqueImage;
import be.galerie_de_ruiter.project.repository.AntiqueImageRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Rewrites the gallery's existing photographs as WebP.
 *
 * <p>New uploads are converted the moment they arrive, but the photographs already in the catalogue
 * are JPEG or PNG. This walks them one at a time: decode, encode WebP, upload it, verify it can be
 * read back, and only then point the row at it. The old object is removed after the row is saved, so
 * an interrupted run leaves a picture that still works - never a row whose only copy was deleted.
 * Running it twice is harmless: a photograph that is already WebP is not a candidate.</p>
 *
 * <p>Every converted row also gets fresh variants (400, 800 and 1600 pixels) in the same pass, so
 * the catalogue's small copies shrink too rather than keeping their JPEG weight forever.</p>
 */
@Service
public class ImageFormatMigration {
    /** One photograph that was rewritten, and what it weighed before and after. */
    public record Converted(UUID imageId, long before, long after) {
    }

    /** One photograph that was left alone, with a reason a person can act on. */
    public record Failed(UUID imageId, String reason) {
    }

    /**
     * What a run did - or, in a dry run, how much there is to do. {@code candidates} is zero only
     * when every photograph is already WebP.
     */
    public record Report(boolean dryRun, long total, long webp, long candidates,
                         int converted, long bytesBefore, long bytesAfter, List<Failed> failed) {
    }

    private final AntiqueImageRepository images;
    private final ImageStorage storage;
    private final ThumbnailService thumbnails;

    public ImageFormatMigration(AntiqueImageRepository images, ImageStorage storage,
                                ThumbnailService thumbnails) {
        this.images = images;
        this.storage = storage;
        this.thumbnails = thumbnails;
    }

    /** The counts the admin screen shows before it asks whether to start. */
    public Report status() {
        long total = images.count();
        long candidates = images.countNotWebp();
        return new Report(true, total, total - candidates, candidates, 0, 0, 0, List.of());
    }

    /**
     * Converts every photograph that is not WebP yet, or as many as {@code limit} allows in one
     * request. A catalogue of hundreds of pictures takes minutes to encode, and an HTTP request
     * that long can be cut off by the hosting proxy; the admin screen calls this repeatedly until
     * {@code candidates} reaches zero. Without {@code confirm} nothing is written: the report is
     * the same count {@link #status()} gives, which is how the size of the job is seen first.
     */
    public Report convertAll(boolean confirm, int limit) {
        if (!ImageFormats.canWriteWebp()) {
            throw new IllegalStateException(
                    "This build has no WebP encoder, so the photographs cannot be converted.");
        }
        Report status = status();
        if (!confirm) return status;

        List<Converted> converted = new ArrayList<>();
        List<Failed> failed = new ArrayList<>();
        long bytesBefore = 0;
        long bytesAfter = 0;

        List<UUID> pending = images.findIdsNotWebp();
        int batch = Math.min(Math.max(1, limit), pending.size());
        for (UUID imageId : pending.subList(0, batch)) {
            AntiqueImage image = images.findById(imageId).orElse(null);
            if (image == null) continue;
            try {
                byte[] original = originalBytes(image);
                if (original == null || original.length == 0) {
                    failed.add(new Failed(imageId, "the row holds no bytes"));
                    continue;
                }
                byte[] webp = ImageFormats.toWebp(original);
                if (webp == null) {
                    String type = ImageFormats.sniff(original);
                    failed.add(new Failed(imageId, "the encoder could not read this picture"
                            + (type == null ? "" : " (" + type + ")")));
                    continue;
                }

                UUID pieceId = image.getAntique().getId();
                String oldKey = image.getStorageKey();
                String newKey = null;
                if (storage.isEnabled()) {
                    newKey = storage.put(pieceId, imageId, webp, ImageFormats.WEBP);
                    if (!storage.exists(newKey)) {
                        failed.add(new Failed(imageId,
                                "the WebP object could not be confirmed in the bucket, so the row kept its copy"));
                        continue;
                    }
                }

                // The row is written before the old object is removed: a failure between the two
                // leaves an extra object in the bucket, never a missing photograph.
                image.setContentType(ImageFormats.WEBP);
                if (storage.isEnabled()) {
                    image.setStorageKey(newKey);
                    image.setImageData(null);
                } else {
                    image.setImageData(webp);
                }
                image.setThumbnail(thumbnails.create(webp));
                image.setMedium(thumbnails.create(webp, ThumbnailService.MEDIUM_EDGE));
                image.setLarge(thumbnails.create(webp, ThumbnailService.LARGE_EDGE));
                images.save(image);

                if (storage.isEnabled() && oldKey != null && !oldKey.equals(newKey)) {
                    try {
                        storage.delete(oldKey);
                    } catch (RuntimeException ignored) {
                        // An unreferenced object costs storage, not correctness. The gallery's
                        // photographs stay readable either way.
                    }
                }

                bytesBefore += original.length;
                bytesAfter += webp.length;
                converted.add(new Converted(imageId, original.length, webp.length));
            } catch (RuntimeException failedHere) {
                failed.add(new Failed(imageId,
                        failedHere.getClass().getSimpleName() + ": " + failedHere.getMessage()));
            }
        }

        // Reported after the batch: the admin screen keeps calling until `candidates` is zero, so
        // this has to be what is actually left rather than what there was when the batch began.
        long remaining = images.countNotWebp();
        return new Report(false, images.count(), images.count() - remaining, remaining,
                converted.size(), bytesBefore, bytesAfter, failed);
    }

    /** The original bytes, from the bucket when the row has been copied out and from the row otherwise. */
    private byte[] originalBytes(AntiqueImage image) {
        return image.getStorageKey() == null
                ? image.getData()
                : storage.get(image.getStorageKey()).orElseGet(image::getData);
    }
}

package be.galerie_de_ruiter.project.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * The gallery's photographs, in object storage rather than in the database row.
 *
 * <p>An R2 bucket speaks the S3 API, so this is an S3 client pointed at the bucket's endpoint. The
 * point of moving the bytes out is weight: a photograph is about a megabyte, and the catalogue used
 * to read all of them out of PostgreSQL before it could name one.
 *
 * <p><strong>Nothing calls this until a row has a key.</strong> It is only enabled in an environment
 * that has all four settings - {@code STORAGE_ENDPOINT}, {@code STORAGE_BUCKET},
 * {@code STORAGE_ACCESS_KEY}, {@code STORAGE_SECRET_KEY}, which Spring maps to the {@code storage.*}
 * properties - and {@link #isEnabled()} is false everywhere else, so a machine without a bucket
 * behaves exactly as it did before. The credentials live in the hosting environment only.
 */
@Service
public class ImageStorage {
    private static final Region REGION = Region.of("auto");
    /**
     * Photograph objects are immutable: their id names these bytes and nothing else. The API sends
     * the same header on its own responses; putting it on the object as well means a custom R2
     * domain or a Cloudflare cache in front of the bucket can serve it for a year without asking
     * R2 again.
     */
    private static final String CACHE_CONTROL = "public, max-age=31536000, immutable";

    private final String endpoint;
    private final String bucket;
    private final String publicUrl;
    private final String accessKey;
    private final String secretKey;
    /** Built on first use, so an environment without a bucket never creates a client at all. */
    private volatile S3Client client;

    public ImageStorage(
            @Value("${storage.endpoint:}") String endpoint,
            @Value("${storage.bucket:}") String bucket,
            @Value("${storage.public-url:}") String publicUrl,
            @Value("${storage.access-key:}") String accessKey,
            @Value("${storage.secret-key:}") String secretKey) {
        this.endpoint = trimmed(endpoint);
        this.bucket = trimmed(bucket);
        this.publicUrl = trimmed(publicUrl);
        this.accessKey = trimmed(accessKey);
        this.secretKey = trimmed(secretKey);
    }

    /** Whether this environment has a bucket configured at all. */
    public boolean isEnabled() {
        return !endpoint.isEmpty() && !bucket.isEmpty() && !accessKey.isEmpty() && !secretKey.isEmpty();
    }

    /**
     * Where a photograph lives: namespaced by its piece, so one prefix lists one piece's pictures, and
     * named by its own id, which never changes.
     */
    public static String keyFor(UUID antiqueId, UUID imageId, String contentType) {
        return "antiques/" + antiqueId + "/" + imageId + extensionFor(contentType);
    }

    /** The extension the object is named with; R2 serves the type from the upload, not the name. */
    public static String extensionFor(String contentType) {
        if (contentType == null) return ".bin";
        String type = contentType.toLowerCase(java.util.Locale.ROOT);
        if (type.contains("png")) return ".png";
        if (type.contains("webp")) return ".webp";
        if (type.contains("gif")) return ".gif";
        return ".jpg";
    }

    /** Uploads one photograph, returning the key it was stored under. */
    public String put(UUID antiqueId, UUID imageId, byte[] bytes, String contentType) {
        requireEnabled();
        String key = keyFor(antiqueId, imageId, contentType);
        client().putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .contentLength((long) bytes.length)
                        .cacheControl(CACHE_CONTROL)
                        .contentDisposition("inline")
                        .build(),
                RequestBody.fromBytes(bytes));
        return key;
    }

    /** The bytes of one photograph, or empty when the object is not in the bucket. */
    public Optional<byte[]> get(String key) {
        if (!isEnabled() || key == null || key.isBlank()) return Optional.empty();
        try {
            return Optional.of(client().getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(key).build()).asByteArray());
        } catch (NoSuchKeyException missing) {
            return Optional.empty();
        }
    }

    /** Whether the object is there, which is what the copy job checks after it uploads. */
    public boolean exists(String key) {
        if (!isEnabled() || key == null || key.isBlank()) return false;
        try {
            client().headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return true;
        } catch (S3Exception missing) {
            return false;
        }
    }

    /** Removes one object. Called only by the job that replaces a photograph, never by a read. */
    public void delete(String key) {
        requireEnabled();
        client().deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    /** Removes an object when storage is configured; an unreferenced object is not an error. */
    public void deleteQuietly(String key) {
        if (!isEnabled() || key == null || key.isBlank()) return;
        try {
            delete(key);
        } catch (RuntimeException ignored) {
            // The row is already gone. A failed object delete costs storage, not correctness;
            // the next cleanup pass can find it.
        }
    }

    /**
     * Removes many objects in the bucket's batch call (up to 1,000 keys per request). Used when a
     * piece or a selection of pieces is deleted, so a bulk delete does not become one R2 request per
     * photograph.
     */
    public void deleteAllQuietly(Collection<String> keys) {
        if (!isEnabled() || keys == null || keys.isEmpty()) return;
        List<String> unique = new ArrayList<>(new LinkedHashSet<>(keys));
        for (int start = 0; start < unique.size(); start += 1000) {
            List<ObjectIdentifier> batch = unique.subList(start, Math.min(start + 1000, unique.size()))
                    .stream()
                    .filter((key) -> key != null && !key.isBlank())
                    .map((key) -> ObjectIdentifier.builder().key(key).build())
                    .toList();
            if (batch.isEmpty()) continue;
            try {
                client().deleteObjects(DeleteObjectsRequest.builder()
                        .bucket(bucket)
                        .delete(Delete.builder().objects(batch).build())
                        .build());
            } catch (RuntimeException ignored) {
                // The database rows are already committed. An object left behind costs storage,
                // not correctness; a later cleanup can find it.
            }
        }
    }

    /**
     * The address the browser can load the photograph from directly, when the bucket has a public
     * host; empty otherwise, which leaves the API serving the bytes as it always has.
     */
    public String publicUrl(String key) {
        if (publicUrl.isEmpty() || key == null || key.isBlank()) return "";
        return publicUrl.endsWith("/") ? publicUrl + key : publicUrl + "/" + key;
    }

    private void requireEnabled() {
        if (!isEnabled()) {
            throw new IllegalStateException(
                    "Object storage is not configured: set STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY.");
        }
    }

    /** One client, created once, pointed at the bucket's endpoint with path-style addressing. */
    private S3Client client() {
        S3Client current = client;
        if (current == null) {
            synchronized (this) {
                current = client;
                if (current == null) {
                    current = S3Client.builder()
                            .endpointOverride(java.net.URI.create(endpoint))
                            .region(REGION)
                            .credentialsProvider(StaticCredentialsProvider.create(
                                    AwsBasicCredentials.create(accessKey, secretKey)))
                            .forcePathStyle(true)
                            .build();
                    client = current;
                }
            }
        }
        return current;
    }

    private static String trimmed(String value) {
        return value == null ? "" : value.trim();
    }
}

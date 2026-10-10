package be.galerie_de_ruiter.project.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores antique 3D models as files instead of database rows.
 *
 * <p>A {@code .glb} is tens of megabytes. Keeping it in a {@code bytea} column meant every
 * upload and every download moved the whole file through the JVM heap and through
 * PostgreSQL, which a small production instance cannot afford. Files live under
 * {@code app.models.storage-dir} (a persistent disk in production) and are named after the
 * antique, so no lookup table is needed.</p>
 */
@Component
public class AntiqueModelStorage {
    private static final Logger logger = LoggerFactory.getLogger(AntiqueModelStorage.class);
    private static final String EXTENSION = ".glb";

    private final Path directory;

    AntiqueModelStorage(@Value("${app.models.storage-dir:./data/models}") String storageDir) {
        this.directory = Path.of(storageDir).toAbsolutePath().normalize();
    }

    /**
     * Writes the upload to disk. The bytes are streamed, so a large model is never held in the
     * heap in full. A temporary file plus a move means a failed upload can not leave a
     * half-written model behind.
     */
    public void store(UUID antiqueId, MultipartFile model) {
        Path staged = null;
        try {
            Files.createDirectories(directory);
            staged = Files.createTempFile(directory, antiqueId.toString(), ".part");
            try (InputStream content = model.getInputStream()) {
                Files.copy(content, staged, StandardCopyOption.REPLACE_EXISTING);
            }
            move(staged, pathFor(antiqueId));
        } catch (IOException exception) {
            deleteQuietly(staged);
            throw new IllegalStateException("The model could not be stored on the gallery disk.", exception);
        }
    }

    /** The stored model, or empty when this antique has no model written to disk. */
    public Optional<Path> locate(UUID antiqueId) {
        Path file = pathFor(antiqueId);
        return Files.isReadable(file) ? Optional.of(file) : Optional.empty();
    }

    /** Removes the stored model. A missing file is not an error: the model may be a legacy row. */
    public void delete(UUID antiqueId) {
        deleteQuietly(locate(antiqueId).orElse(null));
    }

    private void move(Path staged, Path target) throws IOException {
        try {
            Files.move(staged, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException unsupported) {
            // Some container filesystems only support a plain move; it is still a rename.
            Files.move(staged, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void deleteQuietly(Path file) {
        if (file == null) return;
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            // An orphaned file is preferable to failing the request that triggered the cleanup.
            logger.warn("Could not remove the stored model file {}", file, exception);
        }
    }

    private Path pathFor(UUID antiqueId) {
        return directory.resolve(antiqueId + EXTENSION);
    }
}

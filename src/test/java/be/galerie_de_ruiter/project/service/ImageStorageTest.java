package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * The storage service's contract, tested without a bucket: the naming it uses, and the fact that a
 * machine with no settings behaves exactly as the gallery did before object storage existed.
 */
class ImageStorageTest {
    private static final UUID PIECE = UUID.fromString("53f09253-ca03-4b7f-8f79-63d0520c7df1");
    private static final UUID IMAGE = UUID.fromString("1118ba63-2c65-40dd-b742-87470a70de45");

    @Test
    void keysAreNamespacedByPieceAndNamedByImage() {
        assertThat(ImageStorage.keyFor(PIECE, IMAGE, "image/jpeg"))
                .isEqualTo("antiques/53f09253-ca03-4b7f-8f79-63d0520c7df1/"
                        + "1118ba63-2c65-40dd-b742-87470a70de45.jpg");
    }

    @Test
    void theExtensionFollowsTheContentType() {
        assertThat(ImageStorage.extensionFor("image/png")).isEqualTo(".png");
        assertThat(ImageStorage.extensionFor("image/webp")).isEqualTo(".webp");
        assertThat(ImageStorage.extensionFor("image/gif")).isEqualTo(".gif");
        assertThat(ImageStorage.extensionFor("image/jpeg")).isEqualTo(".jpg");
        assertThat(ImageStorage.extensionFor(null)).isEqualTo(".bin");
    }

    @Test
    void aMachineWithoutABucketIsNotEnabled() {
        ImageStorage storage = new ImageStorage("", "", "", "", "");

        assertThat(storage.isEnabled()).isFalse();
        assertThat(storage.get("antiques/1/2.jpg")).isEmpty();
        assertThat(storage.exists("antiques/1/2.jpg")).isFalse();
        assertThat(storage.publicUrl("antiques/1/2.jpg")).isEmpty();
        assertThatThrownBy(() -> storage.put(PIECE, IMAGE, new byte[] {1}, "image/jpeg"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("STORAGE_ENDPOINT");
    }

    @Test
    void halfConfiguredStorageStaysDisabled() {
        assertThat(new ImageStorage("https://example.r2.cloudflarestorage.com", "bucket", "key", "", "").isEnabled())
                .isFalse();
    }

    @Test
    void thePublicAddressJoinsWithoutDoublingTheSlash() {
        ImageStorage storage = new ImageStorage(
                "https://example.r2.cloudflarestorage.com", "bucket", "https://images.example/", "key", "secret");

        assertThat(storage.isEnabled()).isTrue();
        assertThat(storage.publicUrl("antiques/1/2.jpg")).isEqualTo("https://images.example/antiques/1/2.jpg");
        assertThat(storage.publicUrl(null)).isEmpty();
    }
}

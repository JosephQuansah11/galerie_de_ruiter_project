package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/**
 * The copies a page draws are made here, not in the browser: a 400-pixel tile, an 800-pixel phone
 * image and a 1600-pixel desktop image. The original is never enlarged, and a copy that cannot be
 * made is null so the caller can fall back to the original rather than break the page.
 */
class ThumbnailServiceTest {
    private final ThumbnailService thumbnails = new ThumbnailService();

    @Test
    void makesACopyAtTheRequestedLongestEdge() throws Exception {
        byte[] copy = thumbnails.create(png(2000, 1000), ThumbnailService.MEDIUM_EDGE);

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(copy));
        assertThat(Math.max(image.getWidth(), image.getHeight())).isEqualTo(ThumbnailService.MEDIUM_EDGE);
        assertThat(image.getWidth()).isEqualTo(800);
        assertThat(image.getHeight()).isEqualTo(400);
    }

    @Test
    void makesTheTileByDefault() throws Exception {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(thumbnails.create(png(2000, 1000))));

        assertThat(Math.max(image.getWidth(), image.getHeight())).isEqualTo(ThumbnailService.THUMBNAIL_EDGE);
    }

    @Test
    void neverEnlargesAnOriginalThatIsAlreadySmaller() throws Exception {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(
                thumbnails.create(png(300, 200), ThumbnailService.LARGE_EDGE)));

        assertThat(image.getWidth()).isEqualTo(300);
        assertThat(image.getHeight()).isEqualTo(200);
    }

    @Test
    void returnsNothingForBytesItCannotRead() {
        assertThat(thumbnails.create(new byte[0])).isNull();
        assertThat(thumbnails.create(new byte[]{1, 2, 3})).isNull();
        assertThat(thumbnails.create(pngOrNull(10, 10), 0)).isNull();
    }

    private static byte[] png(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "png", bytes);
        return bytes.toByteArray();
    }

    private static byte[] pngOrNull(int width, int height) {
        try {
            return png(width, height);
        } catch (Exception impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/**
 * The format the gallery stores: WebP when the native encoder is on the classpath, and a truthful
 * content type either way. A build without the encoder must keep working, so every assertion here
 * is written to say what is true rather than to require the dependency.
 */
class ImageFormatsTest {
    @Test
    void recognisesTheTypesTheGalleryServes() throws Exception {
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(image, "png", png);
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        ImageIO.write(image, "jpeg", jpeg);

        assertThat(ImageFormats.sniff(png.toByteArray())).isEqualTo(ImageFormats.PNG);
        assertThat(ImageFormats.sniff(jpeg.toByteArray())).isEqualTo(ImageFormats.JPEG);
        assertThat(ImageFormats.sniff(new byte[] {1, 2, 3})).isNull();
    }

    @Test
    void writesWebpAtTheRequestedSize() throws Exception {
        assumeTrue(ImageFormats.canWriteWebp(), "this build has no WebP encoder");
        BufferedImage image = new BufferedImage(640, 480, BufferedImage.TYPE_INT_RGB);

        byte[] webp = ImageFormats.writeWebp(image, ImageFormats.QUALITY);

        assertThat(ImageFormats.sniff(webp)).isEqualTo(ImageFormats.WEBP);
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(webp));
        assertThat(decoded.getWidth()).isEqualTo(640);
        assertThat(decoded.getHeight()).isEqualTo(480);
    }

    @Test
    void convertsAnOriginalAndKeepsTransparency() throws Exception {
        assumeTrue(ImageFormats.canWriteWebp(), "this build has no WebP encoder");
        BufferedImage transparent = new BufferedImage(40, 30, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(transparent, "png", png);

        byte[] webp = ImageFormats.toWebp(png.toByteArray());

        assertThat(ImageFormats.sniff(webp)).isEqualTo(ImageFormats.WEBP);
        assertThat(ImageIO.read(new ByteArrayInputStream(webp)).getColorModel().hasAlpha()).isTrue();
    }

    @Test
    void capsAnOriginalAtTheRequestedEdge() throws Exception {
        assumeTrue(ImageFormats.canWriteWebp(), "this build has no WebP encoder");
        BufferedImage image = new BufferedImage(800, 400, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(image, "png", png);

        byte[] webp = ImageFormats.toWebp(png.toByteArray(), 200);

        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(webp));
        assertThat(Math.max(decoded.getWidth(), decoded.getHeight())).isEqualTo(200);
        assertThat(decoded.getWidth()).isEqualTo(200);
        assertThat(decoded.getHeight()).isEqualTo(100);
    }

    @Test
    void refusesBytesItCannotRead() {
        assertThat(ImageFormats.toWebp(null)).isNull();
        assertThat(ImageFormats.toWebp(new byte[0])).isNull();
        assertThat(ImageFormats.toWebp(new byte[] {1, 2, 3})).isNull();
    }
}

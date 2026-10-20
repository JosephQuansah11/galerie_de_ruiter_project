package be.galerie_de_ruiter.project.service;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Service;

/**
 * Makes the small copy a grid can afford to load.
 *
 * <p>The gallery's originals are between forty kilobytes and six megabytes - a size that is right
 * for looking at one piece and wrong for drawing a page of tiles. This produces a copy no larger
 * than {@value #THUMBNAIL_EDGE} pixels on its longest side (and larger copies for the piece's own
 * page), as WebP: it is smaller than the JPEG this used to write, and it keeps the transparency of
 * a PNG instead of painting it onto white. A machine without the WebP encoder still gets a JPEG
 * copy, so the gallery never depends on a native library being present.</p>
 *
 * <p>Everything that can go wrong is treated as "no thumbnail": an unreadable file, a format the
 * JDK cannot decode, an encoder that is not there. A missing thumbnail must never be the reason a
 * photograph fails to display, so callers fall back to the original.</p>
 */
@Service
public class ThumbnailService {
    /** The longest side of the small copy, in pixels. A tile is rarely drawn wider than this. */
    public static final int THUMBNAIL_EDGE = 400;
    /** The copy a phone draws for a piece's own page: enough for a 400-pixel slot at 2x. */
    public static final int MEDIUM_EDGE = 800;
    /** The copy a desktop or a high-density screen draws: enough for an 800-pixel slot at 2x. */
    public static final int LARGE_EDGE = 1600;

    /** Quality: high enough that furniture detail survives, low enough to stay tens of kilobytes. */
    private static final float QUALITY = ImageFormats.QUALITY;

    /** The small copy of one photograph, or null when one cannot be made. */
    public byte[] create(byte[] original) {
        return create(original, THUMBNAIL_EDGE);
    }

    /**
     * A copy of one photograph with its longest side at most {@code maxEdge} pixels, or null when
     * one cannot be made. The original is never enlarged: a photograph already smaller is kept at
     * its own size, which is why a 400-pixel upload costs no more than it has to.
     */
    public byte[] create(byte[] original, int maxEdge) {
        if (original == null || original.length == 0) return null;
        if (maxEdge <= 0) return null;
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(original));
        } catch (IOException | RuntimeException unreadable) {
            return null;
        }
        if (source == null) return null;

        int width = source.getWidth();
        int height = source.getHeight();
        if (width <= 0 || height <= 0) return null;
        double scale = Math.min(1.0, (double) maxEdge / Math.max(width, height));
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        // WebP and JPEG both lack a useful alpha channel here unless the image has one, so a
        // transparent PNG keeps its transparency in a WebP copy and is drawn onto white only when
        // the fallback JPEG is the encoder available.
        boolean alpha = source.getColorModel().hasAlpha();
        BufferedImage scaled = new BufferedImage(targetWidth, targetHeight,
                alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = scaled.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            if (!alpha) {
                graphics.setColor(java.awt.Color.WHITE);
                graphics.fillRect(0, 0, targetWidth, targetHeight);
            }
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        byte[] webp = ImageFormats.writeWebp(scaled, QUALITY);
        if (webp != null) return webp;
        return writeJpeg(scaled);
    }

    /** The JPEG fallback, used only when this machine has no WebP encoder. */
    private byte[] writeJpeg(BufferedImage image) {
        // JPEG has no transparency, so a copy that kept its alpha is drawn onto white first.
        BufferedImage opaque = image;
        if (image.getColorModel().hasAlpha()) {
            opaque = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = opaque.createGraphics();
            try {
                graphics.setColor(java.awt.Color.WHITE);
                graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
                graphics.drawImage(image, 0, 0, null);
            } finally {
                graphics.dispose();
            }
        }
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").hasNext()
                ? ImageIO.getImageWritersByFormatName("jpeg").next()
                : null;
        if (writer == null) return null;
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ImageOutputStream output = ImageIO.createImageOutputStream(bytes)) {
            ImageWriteParam parameters = writer.getDefaultWriteParam();
            parameters.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            parameters.setCompressionQuality(QUALITY);
            writer.setOutput(output);
            writer.write(null, new IIOImage(opaque, null, null), parameters);
            return bytes.toByteArray();
        } catch (IOException | RuntimeException unwritable) {
            return null;
        } finally {
            writer.dispose();
        }
    }
}

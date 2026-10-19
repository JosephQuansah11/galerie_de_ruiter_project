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
 * page), as JPEG, which the JDK can write without any dependency.</p>
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

    /** JPEG quality: high enough that furniture detail survives, low enough to stay tens of kilobytes. */
    private static final float QUALITY = 0.82f;

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

        // JPEG has no transparency, so a transparent PNG is drawn onto white rather than onto black.
        BufferedImage scaled = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = scaled.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setColor(java.awt.Color.WHITE);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
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
            writer.write(null, new IIOImage(scaled, null, null), parameters);
            return bytes.toByteArray();
        } catch (IOException | RuntimeException unwritable) {
            return null;
        } finally {
            writer.dispose();
        }
    }
}

package be.galerie_de_ruiter.project.service;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

/**
 * The one place that knows which image formats the gallery stores and serves.
 *
 * <p>Photographs are kept as WebP: it is about a third of the weight of the JPEG a camera writes at
 * the same visible quality, every browser the catalogue supports can draw it, and it keeps the
 * transparency of a PNG. The JDK has no WebP encoder of its own; {@code webp-imageio} registers one
 * with {@link ImageIO} at runtime. Nothing here assumes it is present - a build or a machine without
 * the native library falls back to JPEG exactly as the gallery did before.</p>
 */
public final class ImageFormats {
    public static final String WEBP = "image/webp";
    public static final String JPEG = "image/jpeg";
    public static final String PNG = "image/png";

    /**
     * The longest side an original is stored at. A camera file can be 50 megapixels, and decoding
     * one at full size costs about 200 MB - more than the API's small hosting plan has to spare.
     * The gallery's largest variant is 1600 pixels, so 4000 keeps ample detail for zooming while
     * keeping conversion inside a predictable memory budget.
     */
    public static final int MAX_ORIGINAL_EDGE = 4000;

    /**
     * Quality for a stored photograph. High enough that the grain of old wood survives, low enough
     * that a camera file becomes a few hundred kilobytes instead of five megabytes.
     */
    public static final float QUALITY = 0.82f;

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xff, (byte) 0xd8, (byte) 0xff};

    private ImageFormats() {
    }

    /** Whether this JVM can write WebP, i.e. whether the native encoder is on the classpath. */
    public static boolean canWriteWebp() {
        return ImageIO.getImageWritersByMIMEType(WEBP).hasNext();
    }

    /**
     * Re-encodes a photograph as WebP at {@link #MAX_ORIGINAL_EDGE}, or returns null when it cannot
     * be decoded, when the encoder is missing, or when writing fails. Callers keep the original in
     * that case: a photograph that cannot be converted must never be lost.
     */
    public static byte[] toWebp(byte[] original) {
        return toWebp(original, MAX_ORIGINAL_EDGE);
    }

    /**
     * Re-encodes a photograph as WebP, with its longest side at most {@code maxEdge} pixels. Large
     * images are read with source subsampling, so the full-size pixels are never held in memory at
     * once - the reason a single large camera file could otherwise restart the API.
     */
    public static byte[] toWebp(byte[] original, int maxEdge) {
        if (original == null || original.length == 0) return null;
        if (maxEdge <= 0 || !canWriteWebp()) return null;
        BufferedImage decoded = read(original, maxEdge);
        return decoded == null ? null : writeWebp(fit(decoded, maxEdge), QUALITY);
    }

    /**
     * Decodes a photograph with its longest side at most roughly {@code maxEdge} pixels, or returns
     * null when it cannot be read. Large sources are subsampled while decoding, which is what keeps
     * a fifty-megapixel file from needing two hundred megabytes of heap just to make a tile.
     */
    public static BufferedImage read(byte[] original, int maxEdge) {
        if (original == null || original.length == 0 || maxEdge <= 0) return null;
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
            if (input == null) return null;
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return null;
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0) return null;
                int longest = Math.max(width, height);
                // Floor keeps the decoded copy at or above the requested edge (never below it), so
                // a later scale can reach the exact size without enlarging pixels that were not
                // read. The decoded image is at most about twice the budget.
                int step = longest > maxEdge ? Math.max(1, (int) Math.floor(longest / (double) maxEdge)) : 1;
                ImageReadParam parameters = reader.getDefaultReadParam();
                if (step > 1) parameters.setSourceSubsampling(step, step, 0, 0);
                return reader.read(0, parameters);
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException unreadable) {
            return null;
        }
    }

    /** Scales a decoded photograph down to {@code maxEdge}; a smaller image is returned as it is. */
    private static BufferedImage fit(BufferedImage source, int maxEdge) {
        int width = source.getWidth();
        int height = source.getHeight();
        double scale = Math.min(1.0, (double) maxEdge / Math.max(width, height));
        if (scale >= 1.0) return source;
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));
        boolean alpha = source.getColorModel().hasAlpha();
        BufferedImage scaled = new BufferedImage(targetWidth, targetHeight,
                alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = scaled.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return scaled;
    }

    /** One image, encoded as WebP at the given quality, or null when it cannot be written. */
    public static byte[] writeWebp(BufferedImage image, float quality) {
        if (image == null) return null;
        ImageWriter writer = ImageIO.getImageWritersByMIMEType(WEBP).hasNext()
                ? ImageIO.getImageWritersByMIMEType(WEBP).next()
                : null;
        if (writer == null) return null;
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ImageOutputStream output = ImageIO.createImageOutputStream(bytes)) {
            ImageWriteParam parameters = writer.getDefaultWriteParam();
            // Do not set the compression mode: on the WebP writer that clears the compression type
            // it has already chosen ("Lossy"), and setting a quality then fails. The default mode
            // is explicit, which is the one quality belongs to.
            if (parameters.canWriteCompressed()) {
                if (parameters.getCompressionType() == null) {
                    String[] types = parameters.getCompressionTypes();
                    if (types != null && types.length > 0) parameters.setCompressionType(types[0]);
                }
                if (parameters.getCompressionType() != null) {
                    parameters.setCompressionQuality(quality);
                }
            }
            writer.setOutput(output);
            writer.write(null, new IIOImage(image, null, null), parameters);
            return bytes.toByteArray();
        } catch (IOException | RuntimeException unwritable) {
            return null;
        } finally {
            writer.dispose();
        }
    }

    /**
     * The type the bytes themselves prove, independent of a file name or a declared content type.
     * Null when the signature is not one the gallery serves.
     */
    public static String sniff(byte[] bytes) {
        if (bytes == null) return null;
        if (startsWith(bytes, PNG_SIGNATURE)) return PNG;
        if (startsWith(bytes, JPEG_SIGNATURE)) return JPEG;
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return WEBP;
        }
        if (bytes.length >= 6 && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F') return "image/gif";
        return null;
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (bytes[index] != signature[index]) return false;
        }
        return true;
    }
}

package be.galerie_de_ruiter.project.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
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
     * Re-encodes a photograph as WebP, or returns null when it cannot be decoded, when the encoder
     * is missing, or when writing fails. Callers keep the original in that case: a photograph that
     * cannot be converted must never be lost.
     */
    public static byte[] toWebp(byte[] original) {
        if (original == null || original.length == 0) return null;
        if (!canWriteWebp()) return null;
        try {
            BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(original));
            return decoded == null ? null : writeWebp(decoded, QUALITY);
        } catch (IOException | RuntimeException unreadable) {
            return null;
        }
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

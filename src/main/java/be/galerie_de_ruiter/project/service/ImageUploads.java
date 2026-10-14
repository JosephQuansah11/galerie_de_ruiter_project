package be.galerie_de_ruiter.project.service;

import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Shared validation for uploaded photographs.
 *
 * <p>The welcome slider and the About page accept an image the same way: a size limit and a
 * content type checked against the file's own signature, so a renamed file cannot smuggle in
 * something that is not an image.</p>
 */
public final class ImageUploads {
    public static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xff, (byte) 0xd8, (byte) 0xff};

    private ImageUploads() {
    }

    /** Reads and validates the upload, returning the bytes and the type the signature proves. */
    public static PreparedImage prepare(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image is required.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Images must be 10 MB or smaller.");
        }
        byte[] bytes = file.getBytes();
        return new PreparedImage(bytes, verifiedType(bytes));
    }

    private static String verifiedType(byte[] bytes) {
        if (startsWith(bytes, PNG_SIGNATURE)) return MediaType.IMAGE_PNG_VALUE;
        if (startsWith(bytes, JPEG_SIGNATURE)) return MediaType.IMAGE_JPEG_VALUE;
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Only PNG, JPEG and WebP images are supported.");
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (bytes[index] != signature[index]) return false;
        }
        return true;
    }

    public record PreparedImage(byte[] bytes, String contentType) {
    }
}

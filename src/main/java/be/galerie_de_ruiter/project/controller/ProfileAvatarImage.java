package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.service.ImageFormats;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

record ProfileAvatarImage(byte[] bytes, String contentType) {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};

    static ProfileAvatarImage read(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image is required.");
        if (file.getSize() > MAX_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        byte[] bytes = file.getBytes();
        String contentType = verifiedType(bytes, file.getContentType());
        // The browser already sends the avatar as WebP; that is exactly what is stored.
        if (ImageFormats.WEBP.equals(contentType)) return new ProfileAvatarImage(bytes, contentType);
        // An avatar is drawn in a small circle; 512 pixels is more than enough and keeps the bytes
        // tiny. The converted WebP also drops any camera metadata the upload carried.
        byte[] webp = ImageFormats.toWebp(bytes, 512);
        if (webp != null) return new ProfileAvatarImage(webp, ImageFormats.WEBP);
        var decoded = ImageIO.read(new ByteArrayInputStream(bytes));
        if (decoded == null || decoded.getWidth() > 4096 || decoded.getHeight() > 4096) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or oversized image.");
        }
        return new ProfileAvatarImage(bytes, contentType);
    }

    private static String verifiedType(byte[] bytes, String declaredType) {
        if (MediaType.IMAGE_PNG_VALUE.equals(declaredType) && startsWith(bytes, PNG_SIGNATURE)) return declaredType;
        if (MediaType.IMAGE_JPEG_VALUE.equals(declaredType) && bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return declaredType;
        if (ImageFormats.WEBP.equals(declaredType) && ImageFormats.WEBP.equals(ImageFormats.sniff(bytes))) {
            return declaredType;
        }
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Only PNG, JPEG and WebP images are supported.");
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) if (bytes[index] != signature[index]) return false;
        return true;
    }
}

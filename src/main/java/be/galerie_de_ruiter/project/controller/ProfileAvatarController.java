package be.galerie_de_ruiter.project.controller;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.service.UserService;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me/avatar")
@RequiredArgsConstructor
public class ProfileAvatarController {
    private final UserService users;

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> update(@AuthenticationPrincipal Jwt jwt, @RequestPart("image") MultipartFile file)
            throws IOException {
        var subject = requireSubject(jwt);
        var avatar = ProfileAvatarImage.read(file);
        // Bootstrap the local row so an avatar upload cannot fail just because the
        // signed-in visitor has no profile row yet.
        users.findOrCreate(subject, jwt.getClaimAsString("preferred_username"), jwt.getClaimAsString("email"));
        users.updateAvatar(subject, avatar.bytes(), avatar.contentType());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<byte[]> get(@AuthenticationPrincipal Jwt jwt) {
        User user = users.getByKeycloakSubject(requireSubject(jwt));
        // "No avatar yet" is an answer, not an error: the account menu falls back to the visitor's
        // initials. It used to be 404, which the browser reports as a failed request in the console
        // on every page load for every signed-in visitor who has not uploaded a picture - and the
        // frontend already reads 204 as "nothing to show" (see loadProfileAvatar).
        if (user == null || user.getAvatarImage() == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .contentType(MediaType.parseMediaType(user.getAvatarContentType()))
                .body(user.getAvatarImage());
    }

    private String requireSubject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return jwt.getSubject();
    }
}

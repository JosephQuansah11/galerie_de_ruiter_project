package be.galerie_de_ruiter.project.controller;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The gallery wants the visitor's real name on the WhatsApp hand-off. The account's username
 * must never end up there, even when the token carries one.
 */
class ChatRequesterNameTest {
    private static Jwt jwtWith(String name, String given, String family, String username) {
        Jwt.Builder builder = Jwt.withTokenValue("token").header("alg", "none");
        if (name != null) builder.claim("name", name);
        if (given != null) builder.claim("given_name", given);
        if (family != null) builder.claim("family_name", family);
        if (username != null) builder.claim("preferred_username", username);
        return builder.build();
    }

    @Test
    void usesTheFirstNameAndLastName() {
        assertThat(ChatController.requesterName(jwtWith(null, "Joseph", "Quansah", "joseph.q")))
                .isEqualTo("Joseph Quansah");
    }

    @Test
    void prefersTheFirstAndLastNameOverAFullNameClaim() {
        assertThat(ChatController.requesterName(jwtWith("J. Quansah", "Joseph", "Quansah", "joseph.q")))
                .isEqualTo("Joseph Quansah");
    }

    @Test
    void fallsBackToTheFullNameClaimWhenThereIsNoFirstOrLastName() {
        assertThat(ChatController.requesterName(jwtWith("Joseph Quansah", null, null, "joseph.q")))
                .isEqualTo("Joseph Quansah");
    }

    @Test
    void neverFallsBackToTheUsername() {
        assertThat(ChatController.requesterName(jwtWith(null, null, null, "joseph.q"))).isNull();
    }

    @Test
    void hasNoNameForAnAnonymousVisitor() {
        assertThat(ChatController.requesterName(null)).isNull();
    }
}

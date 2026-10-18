package be.galerie_de_ruiter.project.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Which claims turn into which authorities. The gallery is mid-move from Keycloak to Supabase, so
 * both shapes have to be understood at once - and only the claims a user cannot write may grant a
 * role.
 */
class KeycloakJwtAuthenticationConverterTest {

    private static Jwt token(Map<String, Object> claims) {
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .subject("d94c57d9-9d01-4863-b1a5-91d14bc31e05");
        claims.forEach(builder::claim);
        return builder.build();
    }

    private static List<String> authoritiesOf(Map<String, Object> claims) {
        return new KeycloakJwtAuthenticationConverter().convert(token(claims)).getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .sorted()
                .toList();
    }

    @Test
    void keycloakRealmRolesStillGrantAuthorities() {
        assertThat(authoritiesOf(Map.of("realm_access", Map.of("roles", List.of("admin", "user")))))
                .containsExactly("ROLE_ADMIN", "ROLE_USER");
    }

    @Test
    void supabaseAppMetadataRolesGrantAuthorities() {
        // Supabase: app_metadata is written by the server only, so a role there can be trusted.
        assertThat(authoritiesOf(Map.of("app_metadata", Map.of("roles", List.of("admin")))))
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void aUserWritableMetadataClaimGrantsNothing() {
        // user_metadata can be edited by its owner; treating it as a role source would let anyone
        // make themselves an admin by saving their profile.
        assertThat(authoritiesOf(Map.of("user_metadata", Map.of("roles", List.of("admin"))))).isEmpty();
    }
}

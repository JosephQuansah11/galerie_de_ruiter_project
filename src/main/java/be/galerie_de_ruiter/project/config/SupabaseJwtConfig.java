package be.galerie_de_ruiter.project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * How a Supabase token is verified, while the Supabase profile is on.
 *
 * <p>Spring's own decoder, built from an issuer, is pinned to RS256. Built from a key set it is
 * <em>also</em> pinned to RS256 - {@code withJwkSetUri} does not infer the algorithm from the keys it
 * fetches. Supabase signs with ES256, so both routes reject every token with "Another algorithm
 * expected, or no matching key(s) found" while the signature is perfectly good.</p>
 *
 * <p>So the decoder is built here with the algorithm named. This is not a weakening of verification:
 * the key set belongs to one project, and a key that is not in it cannot produce a token this
 * accepts no matter which algorithm it claims.</p>
 *
 * <p>Declaring a {@link JwtDecoder} bean makes Spring Boot's own auto-configuration step aside, and
 * the profile keeps it entirely out of the way of the Keycloak decoder until the switch is made.</p>
 */
@Configuration
@Profile("supabase")
public class SupabaseJwtConfig {

    @Bean
    JwtDecoder jwtDecoder(@Value("${SUPABASE_JWK_SET_URI}") String jwkSetUri) {
        // ES256 named, because the builder assumes RS256 when it is not told. Supabase's keys are
        // EC P-256; a project still signing with the legacy RS256 secret would need that here instead.
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).jwsAlgorithm(SignatureAlgorithm.ES256).build();
    }
}

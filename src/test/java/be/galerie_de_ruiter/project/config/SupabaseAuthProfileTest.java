package be.galerie_de_ruiter.project.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

/**
 * The frontend signs in with Supabase, so activating the supabase profile must replace the Keycloak
 * settings inherited from the prod/test profiles. Spring Boot defaults to RS256; Supabase this
 * project signs with ES256, so a missing algorithm line would make every valid token 401.
 */
@SpringBootTest
@ActiveProfiles({"test-dev", "supabase"})
class SupabaseAuthProfileTest {

    @Autowired
    private Environment environment;

    @Test
    void usesTheSupabaseIssuerAlgorithmAndKeySet() {
        assertThat(environment.getProperty("spring.security.oauth2.resourceserver.jwt.issuer-uri"))
                .isEqualTo("https://bgmxpublcoldebamstbj.supabase.co/auth/v1");
        assertThat(environment.getProperty("spring.security.oauth2.resourceserver.jwt.jwk-set-uri"))
                .isEqualTo("https://bgmxpublcoldebamstbj.supabase.co/auth/v1/.well-known/jwks.json");

        List<String> algorithms = Binder.get(environment)
                .bind("spring.security.oauth2.resourceserver.jwt.jws-algorithms", Bindable.listOf(String.class))
                .orElseGet(List::of);
        assertThat(algorithms).containsExactly("ES256");
    }
}

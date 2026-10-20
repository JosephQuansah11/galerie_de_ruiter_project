package be.galerie_de_ruiter.project.config;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * The Keycloak admin client is only for the local/development identity provider. Production runs
 * with the {@code supabase} profile, where no Keycloak service is deployed and no admin client is
 * needed.
 */
@Configuration
@Profile("!supabase")
public class KeycloakConfiguration {

    @Bean
    Keycloak keycloakAdminClient(
            @Value("${keycloak.server-url}") String serverUrl,
            @Value("${keycloak.admin-realm}") String adminRealm,
            @Value("${keycloak.admin-client-id}") String clientId,
            @Value("${keycloak.admin-username}") String username,
            @Value("${keycloak.admin-password}") String password) {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .grantType(OAuth2Constants.PASSWORD)
                .clientId(clientId)
                .username(username)
                .password(password)
                .build();
    }
}

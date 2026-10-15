package be.galerie_de_ruiter.project.service;

import java.util.List;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * What the realm offers a visitor who would rather not use a password.
 *
 * The API is the service that puts Google into the realm (see
 * {@code KeycloakGoogleIdentityProviderProvisioner}), so it is also the one that can say whether it
 * is really there. The sign-in page asks before it offers a button for it: a Google button on a
 * deployment that was never given a Google client leads to a Keycloak error page, which is a dead
 * end the visitor cannot get out of.
 */
@Service
public class IdentityProviderService {

    private final Keycloak keycloakAdminClient;
    private final String realmName;

    public IdentityProviderService(Keycloak keycloakAdminClient, @Value("${keycloak.realm}") String realmName) {
        this.keycloakAdminClient = keycloakAdminClient;
        this.realmName = realmName;
    }

    /**
     * The aliases of the realm's enabled providers, sorted so the answer does not depend on the
     * order Keycloak happens to keep them in.
     */
    public List<String> enabledAliases() {
        return keycloakAdminClient.realm(realmName).identityProviders().findAll().stream()
                .filter(IdentityProviderRepresentation::isEnabled)
                .map(IdentityProviderRepresentation::getAlias)
                .sorted()
                .toList();
    }
}

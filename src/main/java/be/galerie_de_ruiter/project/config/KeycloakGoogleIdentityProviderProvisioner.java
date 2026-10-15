package be.galerie_de_ruiter.project.config;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Adds Google as an identity provider in the gallery's realm, so a visitor can sign in with the
 * account they already have instead of a password the gallery would have to store.
 *
 * The client id and secret come from a Google Cloud OAuth client (see the README); they are read
 * from the environment because a secret does not belong in the repository, and the realm import
 * files are committed. Nothing happens when they are not set, so a deployment that does not want
 * Google sign-in is left exactly as it was.
 *
 * The provider is created once and updated on every start, so rotating the secret, changing the
 * scopes or turning the provider off is a deploy rather than a click in the Keycloak console.
 */
@Component
public class KeycloakGoogleIdentityProviderProvisioner implements ApplicationRunner {

    /** The alias the frontend names in its sign-in request (`idpHint`). */
    static final String ALIAS = "google";

    /** Keycloak's built-in flow: it asks for the details the provider did not supply. */
    private static final String FIRST_BROKER_LOGIN_FLOW = "first broker login";

    private final Keycloak keycloakAdminClient;
    private final String realmName;
    private final String clientId;
    private final String clientSecret;
    private final boolean required;

    public KeycloakGoogleIdentityProviderProvisioner(
            Keycloak keycloakAdminClient,
            @Value("${keycloak.realm}") String realmName,
            @Value("${keycloak.google-idp.client-id:}") String clientId,
            @Value("${keycloak.google-idp.client-secret:}") String clientSecret,
            @Value("${keycloak.google-idp.required:false}") boolean required) {
        this.keycloakAdminClient = keycloakAdminClient;
        this.realmName = realmName;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.required = required;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        if (clientId.isBlank() && clientSecret.isBlank()) {
            if (required) {
                throw new IllegalStateException(
                        "Set GOOGLE_IDP_CLIENT_ID and GOOGLE_IDP_CLIENT_SECRET to enable sign-in with Google.");
            }
            return;
        }
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException(
                    "Set both GOOGLE_IDP_CLIENT_ID and GOOGLE_IDP_CLIENT_SECRET to enable sign-in with Google.");
        }

        for (int attempt = 0; attempt < 60; attempt++) {
            try {
                provisionIdentityProvider();
                return;
            } catch (ProcessingException exception) {
                waitForKeycloak(attempt);
            } catch (WebApplicationException exception) {
                int status = exception.getResponse().getStatus();
                if (status == Response.Status.UNAUTHORIZED.getStatusCode()
                        || status == Response.Status.FORBIDDEN.getStatusCode()
                        || status < 500 && status != Response.Status.NOT_FOUND.getStatusCode()) {
                    throw exception;
                }
                waitForKeycloak(attempt);
            }
        }
    }

    private void provisionIdentityProvider() {
        RealmResource realm = keycloakAdminClient.realm(realmName);
        IdentityProviderRepresentation existing = findIdentityProvider(realm);

        IdentityProviderRepresentation provider = existing == null
                ? new IdentityProviderRepresentation()
                : existing;
        provider.setAlias(ALIAS);
        provider.setProviderId(ALIAS);
        provider.setDisplayName("Google");
        provider.setEnabled(true);
        // Google verifies its own addresses, so the sign-up flow does not have to ask again.
        provider.setTrustEmail(true);
        // The refresh token would be of no use: the gallery never calls Google for the visitor.
        provider.setStoreToken(false);
        provider.setFirstBrokerLoginFlowAlias(FIRST_BROKER_LOGIN_FLOW);

        Map<String, String> config = provider.getConfig() == null
                ? new HashMap<>()
                : new HashMap<>(provider.getConfig());
        config.put("clientId", clientId);
        config.put("clientSecret", clientSecret);
        config.put("defaultScope", "openid profile email");
        config.put("syncMode", "IMPORT");
        config.put("useJwksUrl", "true");
        provider.setConfig(config);

        if (existing == null) {
            try (Response response = realm.identityProviders().create(provider)) {
                if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {
                    throw new IllegalStateException(
                            "Keycloak refused the Google identity provider with HTTP " + response.getStatus() + ".");
                }
            }
        } else {
            realm.identityProviders().get(ALIAS).update(provider);
        }
    }

    /** Keycloak answers 404 for an alias it does not know, which is how a first run looks. */
    private IdentityProviderRepresentation findIdentityProvider(RealmResource realm) {
        try {
            return realm.identityProviders().get(ALIAS).toRepresentation();
        } catch (WebApplicationException exception) {
            if (exception.getResponse().getStatus() != Response.Status.NOT_FOUND.getStatusCode()) {
                throw exception;
            }
            return null;
        }
    }

    private void waitForKeycloak(int attempt) {
        if (attempt == 59) {
            return;
        }
        try {
            Thread.sleep(2000);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Interrupted while waiting for the Google identity provider to be provisioned.", exception);
        }
    }
}

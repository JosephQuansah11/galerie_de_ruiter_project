package be.galerie_de_ruiter.project.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.IdentityProviderResource;
import org.keycloak.admin.client.resource.IdentityProvidersResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * The API creates the realm's Google identity provider from the environment on every start. What
 * matters here is the gate - a deployment that has not been given a Google client must be left
 * exactly as it was, and half a configuration must fail loudly rather than silently - and that the
 * secret and the scopes it writes into the realm are the ones it was given.
 */
@ExtendWith(MockitoExtension.class)
class KeycloakGoogleIdentityProviderProvisionerTest {

    private static final String REALM = "test-realm";

    @Mock
    private Keycloak keycloakAdminClient;

    private KeycloakGoogleIdentityProviderProvisioner provisioner(String clientId, String clientSecret, boolean required) {
        return new KeycloakGoogleIdentityProviderProvisioner(keycloakAdminClient, REALM, clientId, clientSecret, required);
    }

    @Test
    void leavesTheRealmAloneWhenGoogleIsNotConfigured() {
        provisioner("", "", false).run(null);

        verifyNoInteractions(keycloakAdminClient);
    }

    @Test
    void refusesHalfAConfiguration() {
        assertThatThrownBy(() -> provisioner("client-id-123", "", false).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GOOGLE_IDP_CLIENT_SECRET");
        verifyNoInteractions(keycloakAdminClient);
    }

    @Test
    void refusesToStartQuietlyWhenTheDeploymentRequiresGoogle() {
        assertThatThrownBy(() -> provisioner("", "", true).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GOOGLE_IDP_CLIENT_ID");
    }

    @Test
    void createsTheProviderWithTheConfiguredClientAndScopes() {
        IdentityProvidersResource providers = realm();
        when(providers.get("google").toRepresentation()).thenThrow(new NotFoundException());
        ArgumentCaptor<IdentityProviderRepresentation> created = ArgumentCaptor.forClass(IdentityProviderRepresentation.class);
        when(providers.create(any())).thenReturn(Response.status(Response.Status.CREATED).build());

        provisioner("client-id-123", "secret-456", false).run(null);

        verify(providers).create(created.capture());
        IdentityProviderRepresentation provider = created.getValue();
        assertThat(provider.getAlias()).isEqualTo("google");
        assertThat(provider.getProviderId()).isEqualTo("google");
        assertThat(provider.isEnabled()).isTrue();
        assertThat(provider.isTrustEmail()).isTrue();
        assertThat(provider.getFirstBrokerLoginFlowAlias()).isEqualTo("first broker login");
        assertThat(provider.getConfig())
                .containsEntry("clientId", "client-id-123")
                .containsEntry("clientSecret", "secret-456")
                .containsEntry("defaultScope", "openid profile email")
                .containsEntry("syncMode", "IMPORT");
    }

    @Test
    void updatesTheProviderThatIsAlreadyThere() {
        IdentityProvidersResource providers = realm();
        IdentityProviderResource provider = providers.get("google");
        IdentityProviderRepresentation existing = new IdentityProviderRepresentation();
        existing.setAlias("google");
        existing.setConfig(new java.util.HashMap<>(java.util.Map.of("clientId", "an-old-client")));
        when(provider.toRepresentation()).thenReturn(existing);

        provisioner("client-id-123", "secret-456", false).run(null);

        // The update keeps whatever else the provider carries and replaces the client it signs in
        // with, so a rotated secret is a deploy rather than a visit to the Keycloak console.
        assertThat(existing.getConfig()).containsEntry("clientId", "client-id-123");
        verify(provider).update(existing);
    }

    /** A realm resource whose identity providers answer, without deciding what is in them. */
    private IdentityProvidersResource realm() {
        RealmResource realm = mock(RealmResource.class);
        IdentityProvidersResource providers = mock(IdentityProvidersResource.class);
        IdentityProviderResource provider = mock(IdentityProviderResource.class);
        when(keycloakAdminClient.realm(REALM)).thenReturn(realm);
        when(realm.identityProviders()).thenReturn(providers);
        when(providers.get("google")).thenReturn(provider);
        return providers;
    }
}

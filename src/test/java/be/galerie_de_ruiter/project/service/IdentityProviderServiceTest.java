package be.galerie_de_ruiter.project.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.IdentityProvidersResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.IdentityProviderRepresentation;

/**
 * The sign-in page offers a Google button only when the realm really has the provider, so what this
 * answers has to be the realm's enabled providers and nothing else: a disabled provider would put
 * the button back on the page, and the visitor back on Keycloak's error page.
 */
class IdentityProviderServiceTest {

    private static final String REALM = "test-realm";

    private final Keycloak keycloakAdminClient = mock(Keycloak.class);

    @Test
    void reportsTheEnabledProvidersByAlias() {
        givenProviders(provider("google", true), provider("github", false), provider("microsoft", true));

        assertThat(service().enabledAliases()).containsExactly("google", "microsoft");
    }

    @Test
    void reportsNothingWhenTheRealmOffersNoProvider() {
        givenProviders();

        assertThat(service().enabledAliases()).isEmpty();
    }

    private IdentityProviderService service() {
        return new IdentityProviderService(keycloakAdminClient, REALM);
    }

    private void givenProviders(IdentityProviderRepresentation... providers) {
        RealmResource realm = mock(RealmResource.class);
        IdentityProvidersResource resources = mock(IdentityProvidersResource.class);
        when(keycloakAdminClient.realm(REALM)).thenReturn(realm);
        when(realm.identityProviders()).thenReturn(resources);
        when(resources.findAll()).thenReturn(List.of(providers));
    }

    private IdentityProviderRepresentation provider(String alias, boolean enabled) {
        IdentityProviderRepresentation provider = new IdentityProviderRepresentation();
        provider.setAlias(alias);
        provider.setEnabled(enabled);
        return provider;
    }
}

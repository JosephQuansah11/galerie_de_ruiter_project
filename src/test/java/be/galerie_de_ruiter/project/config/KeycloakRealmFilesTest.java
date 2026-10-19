package be.galerie_de_ruiter.project.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;

/**
 * Keycloak reads the files in `keycloak/realms/` with its own Jackson reader, and a field its
 * representation does not know stops the container dead: `--import-realm` parses the file before it
 * decides whether the realm is already there, so the outcome is not "the import was skipped", it is
 * *"Failed to run import ... Exited with status 1"* and a deploy that never goes live.
 *
 * That is exactly what a `postLogoutRedirectUris` field at the top level of a client did. Keycloak
 * keeps those URIs in the client's *attributes*, under `post.logout.redirect.uris`, separated by
 * `##` - the field belongs to the admin console's form, not to the representation.
 *
 * These tests read the files the way Keycloak does: Keycloak's own classes, and a mapper that
 * refuses unknown fields. That mapper is deliberately not the application's - Spring Boot switches
 * `FAIL_ON_UNKNOWN_PROPERTIES` off for the app's own JSON, which would hide the very thing this
 * test is for. A field Keycloak would refuse therefore fails here, in a test run, rather than in a
 * deploy.
 */
class KeycloakRealmFilesTest {

    /** Keycloak's reader, not the application's: it fails on a field it does not know. */
    private static final ObjectMapper KEYCLOAK_READER = new ObjectMapper();

    private static final Path REALMS = Path.of("keycloak", "realms");

    /** The files Keycloak imports: two realms, and the two client exports the dev import is built from. */
    private static final List<String> REALM_FILES =
            List.of("galerie-production-realm.json", "movie_project_keycloak-realm.json");
    private static final List<String> CLIENT_FILES =
            List.of("movie_project_frontend_client.json", "movie_project_client.json");

    @Test
    void everyRealmFileIsOneKeycloakCanRead() throws Exception {
        for (String file : REALM_FILES) {
            RealmRepresentation realm = KEYCLOAK_READER.readValue(REALMS.resolve(file).toFile(), RealmRepresentation.class);
            assertThat(realm.getRealm()).as(file).isNotBlank();
        }
        for (String file : CLIENT_FILES) {
            ClientRepresentation client = KEYCLOAK_READER.readValue(REALMS.resolve(file).toFile(), ClientRepresentation.class);
            assertThat(client.getClientId()).as(file).isNotBlank();
        }
    }

    @Test
    void keepsThePostLogoutUrisWhereKeycloakKeepsThem() throws Exception {
        // A client has no `postLogoutRedirectUris` of its own; the URIs live in the attributes.
        assertThat(KEYCLOAK_READER.readTree(REALMS.resolve("galerie-production-realm.json").toFile())
                .path("clients").path(0).has("postLogoutRedirectUris")).isFalse();

        assertThat(productionFrontendClient().getAttributes())
                .containsKey("post.logout.redirect.uris");
    }

    @Test
    void letsTheGalleryStartASignInAndReceiveTheBrowserBack() throws Exception {
        // Signing out returns the browser to the gallery's own /logout (see AuthContext.logout), so
        // the gallery's origin has to be allowed both to start a sign-in and to be returned to. The
        // Render host is listed beside it: the same site is served there too.
        ClientRepresentation client = productionFrontendClient();

        assertThat(client.getRedirectUris())
                .contains("https://galeriederuiterantieks.gripe/*")
                // The older free subdomain keeps signing in until it is retired.
                .contains("https://galeriederuiter.cloud-ip.cc/*")
                .contains("https://galerie-frontend.onrender.com/*");
        assertThat(client.getWebOrigins())
                .contains("https://galeriederuiterantieks.gripe")
                .contains("https://galeriederuiter.cloud-ip.cc");
        assertThat(client.getAttributes().get("post.logout.redirect.uris"))
                .contains("https://galeriederuiterantieks.gripe/*")
                .contains("https://galeriederuiter.cloud-ip.cc/*")
                // Two or more URIs in one attribute: `##` is the separator Keycloak reads them
                // back with.
                .contains("##");
    }

    @Test
    void theLocalClientKeepsThemWhereKeycloakKeepsThemToo() throws Exception {
        // The development client is its own export, which `prepareDevKeycloakRealm` puts in place of
        // the realm's inline client, so it carries the same setting in the same place instead of
        // leaning on the redirect-URI fallback.
        ClientRepresentation client = KEYCLOAK_READER.readValue(
                REALMS.resolve("movie_project_frontend_client.json").toFile(), ClientRepresentation.class);

        assertThat(client.getAttributes().get("post.logout.redirect.uris"))
                .contains("http://localhost:3000/*")
                .contains("##");
    }

    private ClientRepresentation productionFrontendClient() throws Exception {
        RealmRepresentation realm = KEYCLOAK_READER.readValue(
                REALMS.resolve("galerie-production-realm.json").toFile(), RealmRepresentation.class);
        assertThat(realm.getClients()).isNotEmpty();
        return realm.getClients().getFirst();
    }
}

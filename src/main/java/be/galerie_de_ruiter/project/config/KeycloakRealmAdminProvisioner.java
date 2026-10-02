package be.galerie_de_ruiter.project.config;

import be.galerie_de_ruiter.project.domain.UserRole;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class KeycloakRealmAdminProvisioner implements ApplicationRunner {
    private final Keycloak keycloakAdminClient;
    private final String realmName;
    private final boolean required;
    private final String username;
    private final String email;
    private final String password;

    public KeycloakRealmAdminProvisioner(
            Keycloak keycloakAdminClient,
            @Value("${keycloak.realm}") String realmName,
            @Value("${keycloak.provision-admin.required:false}") boolean required,
            @Value("${keycloak.provision-admin.username:}") String username,
            @Value("${keycloak.provision-admin.email:}") String email,
            @Value("${keycloak.provision-admin.password:}") String password) {
        this.keycloakAdminClient = keycloakAdminClient;
        this.realmName = realmName;
        this.required = required;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        if (username.isBlank() && password.isBlank()) {
            if (required) {
                throw new IllegalStateException(
                        "Set KEYCLOAK_REALM_ADMIN_USERNAME and KEYCLOAK_REALM_ADMIN_PASSWORD to provision the application administrator.");
            }
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException(
                    "Set both KEYCLOAK_REALM_ADMIN_USERNAME and KEYCLOAK_REALM_ADMIN_PASSWORD to provision the realm administrator.");
        }

        for (int attempt = 0; attempt < 60; attempt++) {
            try {
                provisionAdministrator();
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
        throw new IllegalStateException(
                "Keycloak did not become ready for realm administrator provisioning within two minutes.");
    }

    private void provisionAdministrator() {
        RealmResource realm = keycloakAdminClient.realm(realmName);
        UsersResource users = realm.users();
        UserRepresentation representation = findUser(users, username);
        String userId;

        if (representation == null) {
            representation = new UserRepresentation();
            representation.setUsername(username);
            representation.setEnabled(true);
            representation.setEmail(email.isBlank() ? null : email);
            try (Response response = users.create(representation)) {
                if (response.getStatus() == Response.Status.CONFLICT.getStatusCode()) {
                    representation = findUser(users, username);
                    if (representation == null) {
                        throw new IllegalStateException("Keycloak reported a username conflict but the user could not be found.");
                    }
                    userId = representation.getId();
                } else if (response.getStatus() == Response.Status.CREATED.getStatusCode()) {
                    userId = CreatedResponseUtil.getCreatedId(response);
                } else {
                    throw new IllegalStateException(
                            "Keycloak realm administrator creation failed with HTTP " + response.getStatus() + ".");
                }
            }
        } else {
            userId = representation.getId();
            representation.setEnabled(true);
            if (!email.isBlank()) {
                representation.setEmail(email);
            }
            users.get(userId).update(representation);
        }

        UserResource user = users.get(userId);
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);
        user.resetPassword(credential);

        RoleRepresentation adminRole = getOrCreateAdminRole(realm);
        boolean alreadyAssigned = user.roles().realmLevel().listAll().stream()
                .anyMatch(role -> UserRole.ADMIN.name().equals(role.getName()));
        if (!alreadyAssigned) {
            user.roles().realmLevel().add(List.of(adminRole));
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
                    "Interrupted while waiting for Keycloak administrator provisioning.", exception);
        }
    }

    private UserRepresentation findUser(UsersResource users, String username) {
        return users.searchByUsername(username, true).stream()
                .filter(user -> username.equals(user.getUsername()))
                .findFirst()
                .orElse(null);
    }

    private RoleRepresentation getOrCreateAdminRole(RealmResource realm) {
        try {
            return realm.roles().get(UserRole.ADMIN.name()).toRepresentation();
        } catch (WebApplicationException exception) {
            if (exception.getResponse().getStatus() != Response.Status.NOT_FOUND.getStatusCode()) {
                throw exception;
            }
        }

        RoleRepresentation role = new RoleRepresentation();
        role.setName(UserRole.ADMIN.name());
        role.setDescription("Application administrator");
        try {
            realm.roles().create(role);
        } catch (WebApplicationException exception) {
            if (exception.getResponse().getStatus() != Response.Status.CONFLICT.getStatusCode()) {
                throw exception;
            }
        }
        return realm.roles().get(UserRole.ADMIN.name()).toRepresentation();
    }
}

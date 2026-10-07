package be.galerie_de_ruiter.project.service;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.domain.UserRole;
import be.galerie_de_ruiter.project.dto.UserRegistrationRequest;
import be.galerie_de_ruiter.project.dto.UserProfileUpdateRequest;
import be.galerie_de_ruiter.project.repository.UserRepository;
import java.util.List;

import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import be.galerie_de_ruiter.project.service.implementation.UserServiceImplementation;

import jakarta.ws.rs.core.Response;


@Service
@Transactional
public class UserService implements UserServiceImplementation {

    private final UserRepository usersRepository;
    private final Keycloak keycloakAdminClient;
    private final String keycloakRealm;

    public UserService(
            UserRepository usersRepository,
            Keycloak keycloakAdminClient,
            @Value("${keycloak.realm}") String keycloakRealm) {
        this.usersRepository = usersRepository;
        this.keycloakAdminClient = keycloakAdminClient;
        this.keycloakRealm = keycloakRealm;
    }

    @Override
    public User register(UserRegistrationRequest request) {
        UserRepresentation representation = new UserRepresentation();
        representation.setUsername(request.getDisplayName());
        representation.setEmail(request.getEmail());
        representation.setFirstName(request.getFirstName());
        representation.setLastName(request.getLastName());
        representation.setEmailVerified(true);
        representation.setEnabled(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);
        representation.setCredentials(List.of(credential));

        String keycloakSubject;
        try (Response response = keycloakAdminClient.realm(keycloakRealm).users().create(representation)) {
            if (response.getStatus() != Response.Status.CREATED.getStatusCode()) {

                String errorBody = response.hasEntity()
                        ? response.readEntity(String.class)
                        : "No response body";

                throw new IllegalStateException(
                        "Keycloak user creation failed. " +
                                "status=" + response.getStatus() +
                                ", body=" + errorBody
                );
            }
            keycloakSubject = CreatedResponseUtil.getCreatedId(response);
        }

        try {
            UserRole userRequestRole = UserRole.valueOf(request.getRole());
            User user = new User(keycloakSubject, request.getEmail(), request.getDisplayName(), userRequestRole,
                    request.getFirstName(), request.getLastName());
            assignKeycloakRole(keycloakSubject, userRequestRole);
            return usersRepository.save(user);
        } catch (RuntimeException exception) {
            try {
                keycloakAdminClient
                        .realm(keycloakRealm)
                        .users()
                        .delete(keycloakSubject);
            } catch (Exception rollbackException) {
                exception.addSuppressed(rollbackException);
            }

            throw exception;
        }
    }

    @Override
    public User findOrCreate(String keycloakSubject, String username, String email) {
        return usersRepository.findByKeycloakSubject(keycloakSubject)
                .orElseGet(() ->
                        usersRepository.save(
                            new User(keycloakSubject, email, username)
                        )
                );
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return usersRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public User getByKeycloakSubject(String keycloakSubject) {
        return usersRepository.findByKeycloakSubject(keycloakSubject).orElse(null);
    }

    @Override
    public User updateAvatar(String keycloakSubject, byte[] image, String contentType) {
        User user = requireUser(keycloakSubject);
        user.setAvatarImage(image);
        user.setAvatarContentType(contentType);
        return usersRepository.save(user);
    }

    @Override
    public User updateProfile(String keycloakSubject, UserProfileUpdateRequest request) {
        User user = requireUser(keycloakSubject);
        UserRepresentation keycloakUser = keycloakAdminClient.realm(keycloakRealm)
                .users().get(keycloakSubject).toRepresentation();
        keycloakUser.setEmail(request.email());
        keycloakUser.setFirstName(request.firstName());
        keycloakUser.setLastName(request.lastName());
        keycloakAdminClient.realm(keycloakRealm).users().get(keycloakSubject).update(keycloakUser);

        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        return usersRepository.save(user);
    }

    @Override
    public User addRole(String keycloakSubject, UserRole role) {
        User user = requireUser(keycloakSubject);
        if (user == null) {

        }
        assignKeycloakRole(keycloakSubject, role);
        user.getRoles().add(role);
        return usersRepository.save(user);
    }

    @Override
    public User removeRole(String keycloakSubject, UserRole role) {
        User user = requireUser(keycloakSubject);
        keycloakAdminClient.realm(keycloakRealm).users().get(keycloakSubject).roles().realmLevel()
                .remove(java.util.List.of(getKeycloakRole(role)));
        user.getRoles().remove(role);
        return usersRepository.save(user);
    }

    private void assignKeycloakRole(String keycloakSubject, UserRole role) {
        keycloakAdminClient.realm(keycloakRealm).users().get(keycloakSubject).roles().realmLevel()
                .add(java.util.List.of(getKeycloakRole(role)));
    }

    private RoleRepresentation getKeycloakRole(UserRole role) {
        try {
            return keycloakAdminClient.realm(keycloakRealm).roles().get(role.name()).toRepresentation();
        } catch (RuntimeException exception) {
            RoleRepresentation representation = new RoleRepresentation();
            representation.setName(role.name());
            representation.setDescription("Application role " + role.name());
            try {
                keycloakAdminClient.realm(keycloakRealm).roles().create(representation);
            } catch (jakarta.ws.rs.WebApplicationException roleCreationException) {
                if (roleCreationException.getResponse().getStatus() != Response.Status.CONFLICT.getStatusCode()) {
                    throw roleCreationException;
                }
            }
            return keycloakAdminClient.realm(keycloakRealm).roles().get(role.name()).toRepresentation();
        }
    }

    private User requireUser(String keycloakSubject) {
        return usersRepository.findByKeycloakSubject(keycloakSubject)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + keycloakSubject));
    }
}

package be.galerie_de_ruiter.project.service.implementation;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.domain.UserRole;
import be.galerie_de_ruiter.project.dto.UserRegistrationRequest;
import be.galerie_de_ruiter.project.dto.UserProfileUpdateRequest;
import java.util.List;


public interface UserServiceImplementation {

    User register(UserRegistrationRequest request);

    User findOrCreate(String keycloakSubject, String username, String email);

    List<User> findAll();

    User getByKeycloakSubject(String keycloakSubject);

    User updateAvatar(String keycloakSubject, byte[] image, String contentType);

    User updateProfile(String keycloakSubject, UserProfileUpdateRequest request);

    User addRole(String keycloakSubject, UserRole role);

    User removeRole(String keycloakSubject, UserRole role);
}

package be.galerie_de_ruiter.project.service.implementation;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.domain.UserRole;
import be.galerie_de_ruiter.project.dto.UserRegistrationRequest;


public interface UserServiceImplementation {

    User register(UserRegistrationRequest request);

    User findOrCreate(String keycloakSubject, String username, String email);

    User getByKeycloakSubject(String keycloakSubject);

    User addRole(String keycloakSubject, UserRole role);

    User removeRole(String keycloakSubject, UserRole role);
}

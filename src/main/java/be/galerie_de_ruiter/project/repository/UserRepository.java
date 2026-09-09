package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByKeycloakSubject(String keycloakSubject);
}
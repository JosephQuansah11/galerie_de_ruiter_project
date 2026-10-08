package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AntiqueModelRepository extends JpaRepository<AntiqueModel, UUID> {
    Optional<AntiqueModel> findByAntiqueId(UUID antiqueId);

    void deleteByAntiqueId(UUID antiqueId);
}

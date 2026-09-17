package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueImage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AntiqueImageRepository extends JpaRepository<AntiqueImage, UUID> {
    List<AntiqueImage> findByAntiqueIdOrderByDisplayOrderAsc(UUID antiqueId);

    Optional<AntiqueImage> findFirstByAntiqueIdOrderByDisplayOrderAsc(UUID antiqueId);

    long countByAntiqueId(UUID antiqueId);
}
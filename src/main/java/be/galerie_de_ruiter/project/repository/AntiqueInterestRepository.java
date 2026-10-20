package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueInterest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AntiqueInterestRepository extends JpaRepository<AntiqueInterest, UUID> {
    boolean existsByAntiqueIdAndUserId(UUID antiqueId, UUID userId);

    long deleteByAntiqueIdAndUserId(UUID antiqueId, UUID userId);

    /** Removes every interest row for a piece that is being deleted. */
    void deleteAllByAntiqueId(UUID antiqueId);

    @EntityGraph(attributePaths = {"antique", "antique.artist", "antique.category"})
    List<AntiqueInterest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"antique", "antique.artist", "antique.category", "user"})
    List<AntiqueInterest> findAllByOrderByCreatedAtDesc();
}

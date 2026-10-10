package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueView;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AntiqueViewRepository extends JpaRepository<AntiqueView, UUID> {
    boolean existsByAntiqueIdAndViewerKey(UUID antiqueId, String viewerKey);

    /** Removes every view record for an antique. Called when the antique itself is deleted. */
    void deleteAllByAntiqueId(UUID antiqueId);
}

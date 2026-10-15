package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueView;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AntiqueViewRepository extends JpaRepository<AntiqueView, UUID> {
    boolean existsByAntiqueIdAndViewerKey(UUID antiqueId, String viewerKey);

    /** Removes every view record for an antique. Called when the antique itself is deleted. */
    void deleteAllByAntiqueId(UUID antiqueId);

    /**
     * When each distinct view happened, from {@code since} on. The dashboard groups these by day;
     * one record is one visitor, so the chart counts people rather than page loads.
     */
    @Query("select v.createdAt from AntiqueView v where v.createdAt >= :since")
    List<Instant> findCreatedAtSince(@Param("since") Instant since);
}

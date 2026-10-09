package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.AntiqueLike;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AntiqueLikeRepository extends JpaRepository<AntiqueLike, UUID> {
    boolean existsByAntiqueIdAndViewerKey(UUID antiqueId, String viewerKey);

    long deleteByAntiqueIdAndViewerKey(UUID antiqueId, String viewerKey);
}

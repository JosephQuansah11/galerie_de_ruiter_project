package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Antique;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AntiqueRepository extends JpaRepository<Antique, UUID> {
    @Override
    @EntityGraph(attributePaths = "images")
    List<Antique> findAll();

    List<Antique> findByArtistId(UUID artistId);
}
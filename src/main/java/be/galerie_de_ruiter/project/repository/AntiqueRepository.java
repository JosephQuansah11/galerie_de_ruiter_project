package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Antique;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AntiqueRepository extends JpaRepository<Antique, UUID> {
    @Override
    @EntityGraph(attributePaths = {"images", "artist", "category"})
    List<Antique> findAll();

    @Query("""
            select a.id as id,
                   a.title as title,
                   d.firstName as artistFirstName,
                   d.middleName as artistMiddleName,
                   d.lastName as artistLastName,
                   a.description as description,
                   a.price as price,
                   c.name as category
            from Antique a
            left join a.artist d
            left join a.category c
            """)
    List<ChatCatalogueProjection> findChatCatalogueEntries();

    List<Antique> findByArtistId(UUID artistId);
}
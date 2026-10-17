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
                   d.id as artistId,
                   a.description as description,
                   a.price as price,
                   c.name as category,
                   a.sold as sold,
                   a.modelUrl as modelUrl,
                   a.viewCount as viewCount,
                   a.likeCount as likeCount
            from Antique a
            left join a.artist d
            left join a.category c
            """)
    List<CatalogueRow> findCatalogueRows();

    /**
     * One piece as a catalogue listing needs it: its own columns, its artist and its category. No
     * photographs - those are named by {@link AntiqueImageRepository#findCatalogueImages()}, which
     * selects ids rather than image data.
     */
    interface CatalogueRow {
        UUID getId();

        String getTitle();

        String getDescription();

        java.math.BigDecimal getPrice();

        String getCategory();

        String getModelUrl();

        boolean isSold();

        long getViewCount();

        long getLikeCount();

        UUID getArtistId();

        String getArtistFirstName();

        String getArtistLastName();

        String getArtistMiddleName();
    }

    List<Antique> findByArtistId(UUID artistId);
}
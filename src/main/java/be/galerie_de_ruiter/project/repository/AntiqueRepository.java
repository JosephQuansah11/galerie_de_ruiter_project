package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Antique;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AntiqueRepository extends JpaRepository<Antique, UUID> {
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
                   p.name as parentCategory,
                   a.sold as sold,
                   a.modelUrl as modelUrl,
                   a.viewCount as viewCount,
                   a.likeCount as likeCount
            from Antique a
            left join a.artist d
            left join a.category c
            left join c.parent p
            """)
    List<CatalogueRow> findCatalogueRows();

    /**
     * The columns the dashboard counts, as rows rather than entities.
     *
     * <p>The dashboard only needs counts. {@code findAll()} reads every Antique row - including the
     * legacy photograph column - into the heap just to add up what was sold; a projection asks for
     * the columns and nothing else.</p>
     */
    @Query("""
            select a.id as id, a.sold as sold, a.soldAt as soldAt,
                   a.viewCount as viewCount, a.likeCount as likeCount,
                   c.id as categoryId, c.name as categoryName, p.name as parentName
            from Antique a
            left join a.category c
            left join c.parent p
            """)
    List<StatsRow> findStatsRows();

    /** One piece as the dashboard counts it. */
    interface StatsRow {
        UUID getId();

        boolean isSold();

        Instant getSoldAt();

        long getViewCount();

        long getLikeCount();

        UUID getCategoryId();

        String getCategoryName();

        String getParentName();
    }

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

        String getParentCategory();

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
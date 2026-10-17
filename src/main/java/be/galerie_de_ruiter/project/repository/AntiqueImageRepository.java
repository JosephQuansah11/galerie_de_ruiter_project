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

    Optional<AntiqueImage> findByAntiqueIdAndPosition(UUID id, String position);

    List<AntiqueImage> findAllByAntiqueId(UUID id);

    void deleteAllByAntiqueId(UUID antiqueId);

    /**
     * The image metadata a catalogue response needs - which piece, which id, where in the order -
     * and none of the photograph itself.
     *
     * <p>The bytes live in the same row as this metadata, so selecting the entity (or the `images`
     * collection of an antique) reads every photograph of every piece out of PostgreSQL just to name
     * them. That is what made `/api/antiques` take sixteen seconds while every other endpoint
     * answered in a third of one. This query returns ids only; the image endpoints still serve the
     * bytes, one picture at a time, which is what a browser asks for anyway.</p>
     */
    @org.springframework.data.jpa.repository.Query("""
            select i.antique.id as antiqueId, i.id as imageId, i.position as position,
                   i.displayOrder as displayOrder
            from AntiqueImage i
            """)
    List<CatalogueImage> findCatalogueImages();

    /** One row of {@link #findCatalogueImages()}. */
    interface CatalogueImage {
        UUID getAntiqueId();

        UUID getImageId();

        String getPosition();

        String getDisplayOrder();
    }
}
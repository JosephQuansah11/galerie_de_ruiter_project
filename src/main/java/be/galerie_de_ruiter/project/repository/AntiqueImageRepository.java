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

    /**
     * The photographs whose bytes are still in their row, as ids only.
     *
     * <p>Ids, not rows: this is the table the photographs live in, so selecting the entities would
     * read every remaining picture out of PostgreSQL before the copy job has moved a single one. The
     * job loads each row on its own instead, which keeps its memory flat however many there are.</p>
     */
    @org.springframework.data.jpa.repository.Query("""
            select i.id from AntiqueImage i
            where i.storageKey is null
            """)
    List<UUID> findIdsNotInStorage();

    /**
     * The photographs that are in the bucket <em>and</em> still carrying a copy in their row, as
     * ids, keys and byte counts - never the bytes. Selecting the entities here would read the whole
     * database copy into memory just to decide whether to delete it.
     */
    @org.springframework.data.jpa.repository.Query("""
            select i.id as id, i.storageKey as storageKey, length(i.data) as bytes
            from AntiqueImage i
            where i.storageKey is not null and i.data is not null
            """)
    List<StoredRow> findStoredWithBytes();

    /** One row of {@link #findStoredWithBytes()}. */
    interface StoredRow {
        UUID getId();

        String getStorageKey();

        Long getBytes();
    }


    /** One row of {@link #findCatalogueImages()}. */
    interface CatalogueImage {
        UUID getAntiqueId();

        UUID getImageId();

        String getPosition();

        String getDisplayOrder();
    }
}
package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Comparator;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "antique_images", indexes = {
        // Every image request looks a picture up by its piece, and the six-view upload looks it up by
        // piece and position. Without these, each lookup scans the whole table - which is also the
        // table the photographs live in, so it is the largest one in the database.
        @Index(name = "idx_antique_images_antique", columnList = "antique_id"),
        @Index(name = "idx_antique_images_antique_position", columnList = "antique_id, position"),
        // The catalogue sorts a piece's photographs and the copy job asks which rows still hold
        // bytes; both are cheap with these, and the table is the largest one in the database.
        @Index(name = "idx_antique_images_antique_display_order", columnList = "antique_id, display_order"),
        @Index(name = "idx_antique_images_storage_key", columnList = "storage_key")
})
public class AntiqueImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "antique_id", nullable = false)
    private Antique antique;

    @Column(nullable = true)
    private String displayOrder;

    @Column (nullable = false)
    private String position;

    /**
     * The photograph itself - unless it lives in the bucket, in which case this is null and
     * {@link #storageKey} says where it is. The column is nullable for exactly that reason: a
     * gallery whose pictures are in R2 keeps only metadata here. A row that has neither is a
     * broken row, and nothing creates one.
     */
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(columnDefinition = "bytea")
    private byte[] data;

    @Column(nullable = false)
    private String contentType;

    /**
     * Where the photograph lives when it is not in this row: the object key in the gallery's bucket
     * (for example {@code antiques/<antiqueId>/<imageId>.jpg}).
     *
     * <p>Null means the bytes are still in {@link #data}, which is how every image starts and how a
     * gallery that has not been migrated keeps working. Both readers understand it, so the copy out
     * to storage can happen one picture at a time without a moment where anything is missing.</p>
     */
    @Column(name = "storage_key")
    private String storageKey;

    /**
     * A small copy of the photograph - 400 pixels on its longest side - for grids and lists.
     *
     * <p>It stays in the row, and deliberately: at about forty kilobytes it is the one thing here
     * small enough to keep next to its metadata, and it saves the catalogue a round trip to the
     * bucket for every tile it draws. The full picture is fetched only when a piece is opened.</p>
     */
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(columnDefinition = "bytea")
    private byte[] thumbnail;

    /**
     * The 800-pixel copy used by a phone on a piece's own page.
     *
     * <p>Null until it is asked for: an existing row fills it on the first request and keeps it, so
     * no migration job has to touch every photograph at once.</p>
     */
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(columnDefinition = "bytea")
    private byte[] medium;

    /** The 1600-pixel copy for a desktop or a high-density screen. Generated on first request. */
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(columnDefinition = "bytea")
    private byte[] large;

    public AntiqueImage() {
    }

    public AntiqueImage(Antique antique, String displayOrder, String position, byte[] data, String contentType) {
        this.antique = antique;
        this.displayOrder = displayOrder;
        this.position = position;   
        this.data = data;
        this.contentType = contentType;
    }

    public AntiqueImage(Antique antique, String position, byte[] data, String contentType) {
        this.antique = antique;
        this.position = position;   
        this.data = data;
        this.contentType = contentType;
    }

    public UUID getId() {
        return id;
    }

    public Antique getAntique() {
        return antique;
    }

    public String getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(String displayOrder) {
        this.displayOrder = displayOrder;
    }

    /**
     * The display order as a number. A row without one (an image stored before the gallery
     * could order its photographs) sorts last instead of breaking the catalogue.
     */
    public int displayOrderNumber() {
        if (displayOrder == null || displayOrder.isBlank()) return Integer.MAX_VALUE;
        try {
            return Integer.parseInt(displayOrder.trim());
        } catch (NumberFormatException notANumber) {
            return Integer.MAX_VALUE;
        }
    }

    /** Display order first, then id, so a piece's photographs come back in the gallery's order. */
    public static final Comparator<AntiqueImage> BY_DISPLAY_ORDER =
            Comparator.comparingInt(AntiqueImage::displayOrderNumber)
                    .thenComparing(image -> String.valueOf(image.getId()));

    /**
     * The six-view scan positions. The reconstruction service that wrote them is retired, and this
     * stays because rows an earlier build stored are still in the database: `AntiqueResponse` uses it
     * to keep those out of a piece's photographs, so one can never surface as a gallery image.
     */
    private static final Set<String> SIX_VIEW_POSITIONS = Set.of("front", "back", "left", "right", "top", "bottom");

    public static boolean isSixViewPosition(String position) {
        return position != null && SIX_VIEW_POSITIONS.contains(position);
    }

    public byte[] getData() {
        return data;
    }

    public String getContentType() {
        return contentType;
    }

    public void setImageData(byte[] imageData) {
        this.data = imageData;
    }

    public void setContentType(String contentType2) {
        this.contentType = contentType2;
    }

    public String getPosition() {
        return position;
    }

    /** The object key in the gallery's bucket, or null while the bytes are still in this row. */
    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    /** The small copy used by grids, or null until one has been generated. */
    public byte[] getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(byte[] thumbnail) {
        this.thumbnail = thumbnail;
    }

    /** The 800-pixel copy, or null until one has been generated. */
    public byte[] getMedium() {
        return medium;
    }

    public void setMedium(byte[] medium) {
        this.medium = medium;
    }

    /** The 1600-pixel copy, or null until one has been generated. */
    public byte[] getLarge() {
        return large;
    }

    public void setLarge(byte[] large) {
        this.large = large;
    }
}
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
        @Index(name = "idx_antique_images_antique_position", columnList = "antique_id, position")
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

    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(nullable = false, columnDefinition = "bytea")
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
}
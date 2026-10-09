package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * A photograph shown in the welcome page slider. Images are stored as binary (bytea)
 * like the antique photographs, so no filesystem or external bucket is needed.
 */
@Entity
@Table(name = "home_images")
public class HomeImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private int displayOrder;

    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(columnDefinition = "TEXT")
    private String caption;

    protected HomeImage() {
    }

    public HomeImage(int displayOrder, byte[] data, String contentType, String caption) {
        this.displayOrder = displayOrder;
        this.data = data;
        this.contentType = contentType;
        this.caption = caption;
    }

    public UUID getId() {
        return id;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}

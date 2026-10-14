package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A photograph the gallery dropped into the About page. Like the welcome slider images it is
 * stored as binary (bytea), so no filesystem or external bucket is needed. The story text
 * refers to it by its {@code /api/about/images/{id}} path.
 */
@Entity
@Table(name = "about_images")
public class AboutImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(nullable = false, length = 100)
    private String contentType;

    protected AboutImage() {
    }

    public AboutImage(byte[] data, String contentType) {
        this.data = data;
        this.contentType = contentType;
    }

    public UUID getId() {
        return id;
    }

    public byte[] getData() {
        return data;
    }

    public String getContentType() {
        return contentType;
    }
}

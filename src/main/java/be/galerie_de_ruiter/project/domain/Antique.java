package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "antiques")
public class Antique {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    @ManyToOne(optional = false)
    private Designer artist;
    // Long gallery notes (condition, provenance, stories) do not fit in the default
    // varchar(255); the column is `text` so a full description can be stored.
    @Column(columnDefinition = "text")
    private String description;
    private BigDecimal price;
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
    @Column(columnDefinition = "bytea")
    private byte[] imageData;
    private String imageContentType;
    @OneToMany(mappedBy = "antique")
    private List<AntiqueImage> images = new ArrayList<>();
    private String modelUrl;

    /**
     * How many distinct visitors have seen this piece. The column is created with a default
     * so existing rows keep working when the schema is updated.
     */
    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long viewCount;

    /** How many distinct visitors liked this piece. */
    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long likeCount;
    // // JSON array of {position, url} produced by the reconstruction service, persisted so every user sees the same six views.
    // @Column(columnDefinition = "bytea")
    // private List<byte[]> sixViewImages;

    @ManyToOne
    private Category category;

    @ManyToOne(optional = false)
    private User createdBy;

    protected Antique() {
    }

    public Antique(String title, Designer artist, String description, BigDecimal price, User createdBy) {
        this.title = title;
        this.artist = artist;
        this.description = description;
        this.price = price;
        this.createdBy = createdBy;
    }

    public Antique(String title, Designer artist, String description, BigDecimal price, User createdBy, Category category) {
        this(title, artist, description, price, createdBy);
        this.category = category;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Designer getArtist() {
        return artist;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Category getCategory() {
        return category;
    }

    public byte[] getImageData() {
        return imageData;
    }

    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }

    public String getImageContentType() {
        return imageContentType;
    }

    public void setImageContentType(String imageContentType) {
        this.imageContentType = imageContentType;
    }

    public List<AntiqueImage> getImages() {
        return images;
    }

    public String getModelUrl() {
        return modelUrl;
    }

    public void setModelUrl(String modelUrl) {
        this.modelUrl = modelUrl;
    }

    public long getViewCount() {
        return viewCount;
    }

    public long getLikeCount() {
        return likeCount;
    }

    /** Counts one more distinct visitor for this piece. */
    public void addViewer() {
        this.viewCount++;
    }

    /** Counts one more distinct visitor who liked this piece. */
    public void addLiker() {
        this.likeCount++;
    }

    /** Removes a like again; the count never drops below zero. */
    public void removeLiker() {
        this.likeCount = Math.max(0L, this.likeCount - 1);
    }

    // public List<byte[]> getSixViewImages() {
    //     return sixViewImages;
    // }

    // public void setSixViewImages(List<byte[]> sixViewImagesJson) {
    //     this.sixViewImages= sixViewImagesJson;
    // }
}
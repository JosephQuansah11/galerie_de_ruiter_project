package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "antiques")
public class Antique {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;
	private String title;
    @ManyToOne(optional = false)
    private Designer artist;
	private String description;
	private BigDecimal price;
	@Lob
	private byte[] imageData;
	private String imageContentType;
	private String modelUrl;

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

	public UUID getId() { return id; }
	public String getTitle() { return title; }
	public Designer getArtist() { return artist; }
	public String getDescription() { return description; }
	public BigDecimal getPrice() { return price; }
	public Category getCategory() { return category; }
	public byte[] getImageData() { return imageData; }
	public void setImageData(byte[] imageData) { this.imageData = imageData; }
	public String getImageContentType() { return imageContentType; }
	public void setImageContentType(String imageContentType) { this.imageContentType = imageContentType; }
	public String getModelUrl() { return modelUrl; }
	public void setModelUrl(String modelUrl) { this.modelUrl = modelUrl; }
}
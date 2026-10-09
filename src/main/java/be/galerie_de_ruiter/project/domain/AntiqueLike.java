package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

/**
 * One distinct visitor who liked an antique. A visitor can like a piece once and remove
 * that like again, so the public count matches what people actually see.
 */
@Entity
@Table(name = "antique_likes",
        uniqueConstraints = @UniqueConstraint(name = "uk_antique_likes_viewer",
                columnNames = { "antique_id", "viewer_key" }))
public class AntiqueLike {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "antique_id", nullable = false)
    private UUID antiqueId;

    @Column(name = "viewer_key", nullable = false, length = 120)
    private String viewerKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected AntiqueLike() {
    }

    public AntiqueLike(UUID antiqueId, String viewerKey) {
        this.antiqueId = antiqueId;
        this.viewerKey = viewerKey;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAntiqueId() {
        return antiqueId;
    }

    public String getViewerKey() {
        return viewerKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

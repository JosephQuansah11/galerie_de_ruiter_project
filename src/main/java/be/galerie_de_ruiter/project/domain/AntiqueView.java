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
 * One distinct visitor who opened an antique.
 *
 * <p>The row exists to keep the public counter honest: a refresh, a second tab or a return
 * visit must not turn one person into several viewers. The catalogue therefore shows how
 * many people saw a piece, not how many page loads it received.</p>
 */
@Entity
@Table(name = "antique_views",
        uniqueConstraints = @UniqueConstraint(name = "uk_antique_views_viewer",
                columnNames = { "antique_id", "viewer_key" }))
public class AntiqueView {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "antique_id", nullable = false)
    private UUID antiqueId;

    /**
     * Either the Keycloak subject of a signed-in visitor or the id the browser keeps for an
     * anonymous one. Sanitised before it is stored, because it arrives from the client.
     */
    @Column(name = "viewer_key", nullable = false, length = 120)
    private String viewerKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected AntiqueView() {
    }

    public AntiqueView(UUID antiqueId, String viewerKey) {
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

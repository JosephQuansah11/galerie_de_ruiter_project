package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

/**
 * One signed-in visitor who marked a piece as interesting. Unlike the public like counter, this is
 * tied to the visitor's account so the gallery can see who is interested and get in touch.
 */
@Entity
@Table(name = "antique_interests",
        uniqueConstraints = @UniqueConstraint(name = "uk_antique_interests_user",
                columnNames = {"antique_id", "user_id"}))
public class AntiqueInterest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "antique_id", nullable = false)
    private Antique antique;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected AntiqueInterest() {
    }

    public AntiqueInterest(Antique antique, User user) {
        this.antique = antique;
        this.user = user;
    }

    public UUID getId() {
        return id;
    }

    public Antique getAntique() {
        return antique;
    }

    public User getUser() {
        return user;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

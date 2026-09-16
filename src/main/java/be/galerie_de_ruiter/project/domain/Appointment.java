package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String keycloakSubject;
    private LocalDateTime startsAt;
    private String type;
    private String summary;
    private String status = "REQUESTED";

    public Appointment(String keycloakSubject, LocalDateTime startsAt, String type, String summary) {
        this.keycloakSubject = keycloakSubject;
        this.startsAt = startsAt;
        this.type = type;
        this.summary = summary;
    }
}
package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Appointment;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByKeycloakSubjectOrderByStartsAtDesc(String keycloakSubject);

    boolean existsByKeycloakSubjectAndStartsAtAndType(String keycloakSubject, LocalDateTime startsAt, String type);
}
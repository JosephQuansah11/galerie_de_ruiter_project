package be.galerie_de_ruiter.project.repository;

import be.galerie_de_ruiter.project.domain.Appointment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByKeycloakSubjectOrderByStartsAtDesc(String keycloakSubject);
}
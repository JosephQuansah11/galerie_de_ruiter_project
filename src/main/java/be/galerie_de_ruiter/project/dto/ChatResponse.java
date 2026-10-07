package be.galerie_de_ruiter.project.dto;

import java.time.LocalDateTime;

public record ChatResponse(
        String message,
        LocalDateTime appointmentAt,
        String appointmentType,
        boolean appointmentConfirmed) {
}
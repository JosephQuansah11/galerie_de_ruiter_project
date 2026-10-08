package be.galerie_de_ruiter.project.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatResponse(
        String message,
        LocalDateTime appointmentAt,
        String appointmentType,
        boolean appointmentConfirmed,
        boolean appointmentHandoffRequired,
        List<ChatSource> sources) {
    public ChatResponse(String message, LocalDateTime appointmentAt, String appointmentType, boolean appointmentConfirmed) {
        this(message, appointmentAt, appointmentType, appointmentConfirmed, false, List.of());
    }

    public ChatResponse(String message, LocalDateTime appointmentAt, String appointmentType,
            boolean appointmentConfirmed, List<ChatSource> sources) {
        this(message, appointmentAt, appointmentType, appointmentConfirmed, false, sources);
    }
}
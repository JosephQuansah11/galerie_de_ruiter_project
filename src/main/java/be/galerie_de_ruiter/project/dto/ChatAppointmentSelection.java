package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;

public record ChatAppointmentSelection(
        @NotNull LocalDateTime at,
        @NotBlank @Pattern(regexp = "VISIT|ONLINE") String type) {
}

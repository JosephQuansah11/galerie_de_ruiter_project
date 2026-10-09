package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ChatRequest(
        @NotBlank @Size(max = 2000) String message,
        @Size(max = 30) List<@Valid ChatTurn> history,
        @Valid ChatAppointmentSelection appointmentSelection) {
    public ChatRequest {
        history = history == null ? List.of() : java.util.Collections.unmodifiableList(
                new java.util.ArrayList<>(history));
    }

    public ChatRequest(String message, List<ChatTurn> history) {
        this(message, history, null);
    }

    public record ChatTurn(
            @NotNull @NotBlank @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 2000) String text) {
    }
}
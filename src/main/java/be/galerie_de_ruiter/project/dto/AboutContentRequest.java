package be.galerie_de_ruiter.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AboutContentRequest(
        @NotBlank @Size(max = 50000) String content) {
}
